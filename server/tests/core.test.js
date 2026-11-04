const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

require('dotenv').config();
const configuredMongoUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/investment-platform';
const mongoUriParts = configuredMongoUri.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/[^?]*)?(\?.*)?$/);
if (!mongoUriParts) {
  throw new Error('Tests require a valid MongoDB URI so an isolated test database can be selected.');
}
const testDatabaseName = `investment-platform-test-${process.pid}`;
process.env.MONGODB_URI = `${mongoUriParts[1]}/${testDatabaseName}${mongoUriParts[2] || ''}`;
process.env.JWT_SECRET = 'test-only-secret-that-is-never-used-outside-tests-123456';
process.env.INVESTMENT_PLANS = JSON.stringify([
  {
    id: 'test-plan',
    name: 'Test Plan',
    description: 'Test-only investment terms',
    minAmount: 10,
    maxAmount: 10000,
    durationDays: 30,
    dailyROIPercentage: 1.2,
  },
]);
process.env.REFERRAL_MAX_LEVELS = '2';
process.env.REFERRAL_LEVELS = JSON.stringify([
  { level: 1, percentage: 5 },
  { level: 2, percentage: 3 },
  { level: 3, percentage: 2 },
]);
process.env.MIN_ELIGIBLE_INVESTMENT_AMOUNT = '1000';

const { app } = require('../src/server');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Investment = require('../src/models/Investment');
const ReferralIncome = require('../src/models/ReferralIncome');
const ROIHistory = require('../src/models/ROIHistory');
const WalletTransaction = require('../src/models/WalletTransaction');
const { processDailyROI } = require('../src/services/businessLogic');
const { getJwtSecret } = require('../src/config/security');
const { getInvestmentPlans, assertInvestmentPlanConfiguration } = require('../src/config/investmentPlans');
const cron = require('node-cron');
const { startCronJobs } = require('../src/config/cron');

let server;
let testBaseUrl;

const request = async (path, options = {}) => {
  const { headers = {}, body, ...rest } = options;

  const response = await fetch(`${testBaseUrl}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = text;

  try {
    payload = JSON.parse(text);
  } catch {
    payload = text;
  }

  return { status: response.status, payload };
};

const registerUser = async (suffix, referralCode = '') => {
  const email = `nexachain-${Date.now()}-${suffix}@example.com`;
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: `Test ${suffix}`,
      email,
      mobileNumber: `${Date.now()}${Math.floor(Math.random() * 10000)}`,
      password: 'Password123!',
      referralCode,
    },
  });

  assert.equal(response.status, 201, `Registration failed for ${suffix}: ${JSON.stringify(response.payload)}`);
  return { email, token: response.payload.data.token, user: response.payload.data.user };
};

test.before(async () => {
  await connectDB();
  assert.equal(mongoose.connection.name, testDatabaseName, 'Refusing to run tests outside the isolated test database.');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  testBaseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await server.close();
  if (mongoose.connection.name === testDatabaseName) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

test('registers a new user and returns a JWT token', async () => {
  const result = await registerUser('register');
  const storedUser = await User.findOne({ email: result.email }).select('+password');

  assert.ok(result.token);
  assert.equal(result.user.email, result.email);
  assert.ok(result.user.referralCode);
  assert.match(storedUser.password, /^\$2[aby]\$/);
  assert.notEqual(storedUser.password, 'Password123!');
  assert.equal(Object.hasOwn(result.user, 'password'), false);
});

test('enforces mobile-number uniqueness when registering users', async () => {
  const first = await registerUser('unique-mobile');
  const firstUser = await User.findOne({ email: first.email });
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Duplicate Mobile',
      email: `nexachain-${Date.now()}-duplicate-mobile@example.com`,
      mobileNumber: firstUser.mobileNumber,
      password: 'Password123!',
    },
  });

  assert.equal(response.status, 409);
  assert.match(response.payload.message, /mobile number already exists/i);
});

test('logs in an existing user', async () => {
  const { email } = await registerUser('login');
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email,
      password: 'Password123!',
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.payload.success, true);
  assert.ok(response.payload.data.token);
});

test('blocks login and private APIs for inactive accounts', async () => {
  const { email, token, user } = await registerUser('inactive-account');
  await User.updateOne({ _id: user.id }, { $set: { accountStatus: 'suspended' } });

  const loginResponse = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'Password123!' },
  });
  const privateResponse = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(loginResponse.status, 403);
  assert.equal(privateResponse.status, 403);
});

test('rejects invalid JWT on protected routes', async () => {
  const response = await request('/api/auth/me', {
    method: 'GET',
    headers: { Authorization: 'Bearer invalid.token.here' },
  });

  assert.equal(response.status, 401);
  assert.equal(response.payload.success, false);
});

test('rejects MongoDB operator keys in request parameters', async () => {
  const response = await request('/api/health?filter%5B%24ne%5D=null');

  assert.equal(response.status, 400);
  assert.equal(response.payload.message, 'Request contains unsupported field names.');
});

test('requires a strong configured JWT secret instead of a fallback', () => {
  const configuredSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  assert.throws(() => getJwtSecret(), /JWT_SECRET must be configured/);
  process.env.JWT_SECRET = configuredSecret;
});

test('uses the supplied illustrative investment plan only outside production', () => {
  const originalPlans = process.env.INVESTMENT_PLANS;
  const originalNodeEnv = process.env.NODE_ENV;

  try {
    process.env.NODE_ENV = 'development';
    process.env.INVESTMENT_PLANS = '[]';
    assert.deepEqual(getInvestmentPlans(), [
      {
        id: 'development-example',
        name: 'Development Example',
        description: 'Illustrative testing terms only; not a company-approved plan or a promise of returns.',
        minAmount: 10000,
        maxAmount: 10000,
        durationDays: 30,
        dailyROIPercentage: 1,
      },
    ]);

    process.env.NODE_ENV = 'production';
    assert.deepEqual(getInvestmentPlans(), []);
    assert.throws(assertInvestmentPlanConfiguration, /Configure at least one reviewed investment plan/);
  } finally {
    if (originalPlans === undefined) delete process.env.INVESTMENT_PLANS;
    else process.env.INVESTMENT_PLANS = originalPlans;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});

test('validates registration inputs before writing to the database', async () => {
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Test User',
      email: 'not-an-email',
      mobileNumber: '1',
      password: 'short',
    },
  });

  assert.equal(response.status, 400);
  assert.equal(response.payload.success, false);
  assert.ok(response.payload.errors.length >= 3);
  assert.equal(await User.countDocuments({ fullName: 'Test User' }), 0);
});

test('creates an investment for an authenticated user', async () => {
  const { token, user } = await registerUser('investment');
  const response = await request('/api/investments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      amount: 1000,
      planId: 'test-plan',
      dailyROI: 999,
      endDate: '2099-01-01',
    },
  });

  assert.equal(response.status, 201, JSON.stringify(response.payload));
  assert.equal(response.payload.success, true);
  const investment = response.payload.data.investment;
  assert.ok(investment._id);
  assert.equal(String(investment.user), String(user.id));
  assert.equal(String(investment.userId), String(user.id));
  assert.equal(investment.amount, 1000);
  assert.equal(investment.planName, 'Test Plan');
  assert.equal(investment.planDetails, 'Test-only investment terms');
  assert.ok(investment.startDate);
  assert.ok(investment.endDate);
  assert.equal(investment.dailyROI, 1.2);
  assert.equal(investment.dailyROIPercentage, 1.2);
  assert.equal(investment.status, 'active');
  assert.notEqual(new Date(investment.endDate).getFullYear(), 2099);
  const updatedUser = await User.findById(user.id);
  assert.equal(updatedUser.walletBalance, 0);
  assert.equal(await WalletTransaction.countDocuments({ referenceId: investment._id, transactionType: 'INVESTMENT' }), 0);
});

test('runs the supplied development example through investment creation and daily ROI credit', async () => {
  const originalPlans = process.env.INVESTMENT_PLANS;
  const originalNodeEnv = process.env.NODE_ENV;
  let user;
  let investment;

  try {
    process.env.NODE_ENV = 'development';
    process.env.INVESTMENT_PLANS = '[]';
    const registered = await registerUser('development-plan-roi');
    user = registered.user;
    const response = await request('/api/investments', {
      method: 'POST',
      headers: { Authorization: ['Bearer', registered.token].join(' ') },
      body: { amount: 10000, planId: 'development-example' },
    });

    assert.equal(response.status, 201, JSON.stringify(response.payload));
    investment = response.payload.data.investment;
    assert.equal(investment.amount, 10000);
    assert.equal(investment.dailyROIPercentage, 1);
    assert.equal(new Date(investment.endDate).getTime() - new Date(investment.startDate).getTime(), 29 * 24 * 60 * 60 * 1000);
  } finally {
    if (originalPlans === undefined) delete process.env.INVESTMENT_PLANS;
    else process.env.INVESTMENT_PLANS = originalPlans;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }

  await processDailyROI({ manualRun: true });
  assert.equal((await User.findById(user.id)).walletBalance, 100);
  assert.equal(await ROIHistory.countDocuments({ userId: user.id, investmentId: investment._id, roiAmount: 100 }), 1);
  assert.equal(await WalletTransaction.countDocuments({ userId: user.id, referenceId: investment._id, transactionType: 'ROI', amount: 100 }), 1);
});

test('allows simultaneous investment creation without requiring or debiting wallet funds', async () => {
  const { token, user } = await registerUser('concurrent-investment');
  const options = {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { amount: 700, planId: 'test-plan' },
  };

  const responses = await Promise.all([
    request('/api/investments', options),
    request('/api/investments', options),
  ]);
  const statuses = responses.map((response) => response.status).sort();

  assert.deepEqual(statuses, [201, 201]);
  assert.equal((await User.findById(user.id)).walletBalance, 0);
  assert.equal(await Investment.countDocuments({ userId: user.id }), 2);
  assert.equal(await WalletTransaction.countDocuments({ userId: user.id, transactionType: 'INVESTMENT' }), 0);
});

test('creates an investment when the user has no wallet balance', async () => {
  const { token, user } = await registerUser('zero-balance-investment');
  const response = await request('/api/investments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { amount: 100, planId: 'test-plan' },
  });

  assert.equal(response.status, 201);
  assert.equal(await Investment.countDocuments({ userId: user.id }), 1);
  assert.equal((await User.findById(user.id)).walletBalance, 0);
  assert.equal(await WalletTransaction.countDocuments({ userId: user.id, transactionType: 'INVESTMENT' }), 0);
});

test('returns the estimated daily ROI for active investments in the dashboard summary', async () => {
  const { token, user } = await registerUser('daily-roi-summary');
  const investmentResponse = await request('/api/investments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      amount: 1000,
      planId: 'test-plan',
    },
  });
  assert.equal(investmentResponse.status, 201);

  const summaryResponse = await request('/api/dashboard/summary', {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(summaryResponse.status, 200);
  assert.equal(summaryResponse.payload.data.summary.dailyROI, 12);

  const trendResponse = await request('/api/dashboard/earnings-trend?days=7', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(trendResponse.status, 200);
  assert.equal(trendResponse.payload.data.trend.length, 7);
  assert.ok(Object.hasOwn(trendResponse.payload.data.trend[0], 'referralIncome'));
  assert.equal(
    trendResponse.payload.data.trend.find((entry) => entry.date === new Date().toISOString().slice(0, 10))?.investmentVolume,
    1000
  );
});

test('prevents duplicate daily ROI processing for the same investment date', async () => {
  const { token, user } = await registerUser('dupe-roi');
  const createResponse = await request('/api/investments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      amount: 1200,
      planId: 'test-plan',
    },
  });

  const investmentId = createResponse.payload.data.investment._id;
  const runs = await Promise.all([
    processDailyROI({ manualRun: true }),
    processDailyROI({ manualRun: true }),
  ]);
  const historyRows = await ROIHistory.find({ investmentId }).countDocuments();
  const roiLedgerEntries = await WalletTransaction.find({
    userId: user.id,
    transactionType: 'ROI',
    referenceId: investmentId,
  });
  const updatedUser = await User.findById(user.id);
  const updatedInvestment = await Investment.findById(investmentId);

  assert.equal(runs.some((count) => count >= 1), true);
  assert.equal(historyRows, 1);
  const roiHistory = await ROIHistory.findOne({ investmentId });
  assert.equal(String(roiHistory.user), String(user.id));
  assert.equal(String(roiHistory.investment), String(investmentId));
  assert.equal(roiLedgerEntries.length, 1);
  assert.equal(String(roiLedgerEntries[0].user), String(user.id));
  assert.equal(roiLedgerEntries[0].amount, 14.4);
  assert.equal(updatedUser.walletBalance, 14.4);
  assert.equal(updatedUser.totalROIEarned, 14.4);
  assert.equal(updatedInvestment.totalROIGenerated, 14.4);
});

test('schedules the daily ROI job once at midnight in the configured timezone', () => {
  const originalSchedule = cron.schedule;
  const scheduledTasks = [];
  cron.schedule = (...args) => {
    const task = { stop() {} };
    scheduledTasks.push({ args, task });
    return task;
  };

  try {
    const firstTask = startCronJobs();
    const secondTask = startCronJobs();
    const timezone = process.env.CRON_TIMEZONE || process.env.TZ || 'UTC';

    assert.equal(firstTask, secondTask);
    assert.equal(scheduledTasks.length, 1);
    assert.equal(scheduledTasks[0].args[0], '0 0 * * *');
    assert.equal(scheduledTasks[0].args[2].timezone, timezone);
  } finally {
    cron.schedule = originalSchedule;
  }
});

test('rolls back ROI history and balances if the wallet ledger write fails', async () => {
  const { token, user } = await registerUser('roi-rollback');
  const response = await request('/api/investments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { amount: 1000, planId: 'test-plan' },
  });
  assert.equal(response.status, 201);
  const investmentId = response.payload.data.investment._id;

  const originalCreate = WalletTransaction.create;
  WalletTransaction.create = async function failRoiLedger(documents, ...args) {
    const rows = Array.isArray(documents) ? documents : [documents];
    if (rows.some((row) => row.transactionType === 'ROI')) {
      throw new Error('Simulated ROI ledger failure.');
    }
    return originalCreate.call(this, documents, ...args);
  };

  try {
    await assert.rejects(processDailyROI(), /ROI processing failed/);
  } finally {
    WalletTransaction.create = originalCreate;
  }

  assert.equal(await ROIHistory.countDocuments({ investmentId }), 0);
  assert.equal(await WalletTransaction.countDocuments({ referenceId: investmentId, transactionType: 'ROI' }), 0);
  assert.equal((await User.findById(user.id)).walletBalance, 0);
  assert.equal((await Investment.findById(investmentId)).totalROIGenerated, 0);
});

test('credits referral income to a valid referrer and maintains referral hierarchy data', async () => {
  const parent = await registerUser('parent-referral');
  const child = await registerUser('child-referral', parent.user.referralCode);
  const investmentResponse = await request('/api/investments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${child.token}` },
    body: {
      amount: 5000,
      planId: 'test-plan',
    },
  });

  assert.equal(investmentResponse.status, 201);

  const referrerUser = await User.findById(parent.user.id || parent.user._id);
  const referralRows = await ReferralIncome.find({ receiver: referrerUser._id, investmentId: investmentResponse.payload.data.investment._id });
  const referralLedgerEntries = await WalletTransaction.find({
    userId: referrerUser._id,
    transactionType: 'REFERRAL',
    referenceId: investmentResponse.payload.data.investment._id,
  });
  const directReferrals = await User.countDocuments({ referredBy: referrerUser._id });

  assert.equal(referralRows.length, 1);
  assert.equal(referralRows[0].amount, 250);
  assert.equal(referralLedgerEntries.length, 1);
  assert.equal(referralLedgerEntries[0].amount, 250);
  assert.equal((await User.findById(referrerUser._id)).walletBalance, 250);
  assert.equal(directReferrals, 1);
});

test('completes the A-B-C referral, investment, duplicate-safe ROI, and refreshed dashboard flow', async () => {
  const userA = await registerUser('flow-user-a');
  const userB = await registerUser('flow-user-b', userA.user.referralCode);
  const userC = await registerUser('flow-user-c', userB.user.referralCode);

  const loginA = await request('/api/auth/login', {
    method: 'POST',
    body: { email: userA.email, password: 'Password123!' },
  });
  assert.equal(loginA.status, 200);
  const treeResponse = await request('/api/referrals/tree', {
    headers: { Authorization: `Bearer ${loginA.payload.data.token}` },
  });
  assert.equal(treeResponse.status, 200);
  const treeB = treeResponse.payload.data.tree.children.find((node) => node._id === userB.user.id);
  assert.ok(treeB);
  assert.ok(treeB.children.some((node) => node._id === userC.user.id));

  const investmentResponse = await request('/api/investments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userC.token}` },
    body: { amount: 1200, planId: 'test-plan' },
  });
  assert.equal(investmentResponse.status, 201);
  const investmentId = investmentResponse.payload.data.investment._id;

  const userABeforeROI = await User.findById(userA.user.id);
  const userBBeforeROI = await User.findById(userB.user.id);
  assert.equal(userABeforeROI.walletBalance, 36);
  assert.equal(userBBeforeROI.walletBalance, 60);
  assert.equal(await ReferralIncome.countDocuments({ investmentId }), 2);

  const loginB = await request('/api/auth/login', {
    method: 'POST',
    body: { email: userB.email, password: 'Password123!' },
  });
  assert.equal(loginB.status, 200);
  const referralIncomeResponse = await request('/api/referrals/income?page=1&limit=20', {
    headers: { Authorization: `Bearer ${loginB.payload.data.token}` },
  });
  assert.equal(referralIncomeResponse.status, 200);
  assert.equal(
    referralIncomeResponse.payload.data.items.find((item) => item.investmentId === investmentId)?.amount,
    60
  );

  const admin = await registerUser('flow-scheduler-admin');
  await User.updateOne({ _id: admin.user.id }, { $set: { role: 'admin' } });
  const firstRun = await request('/api/admin/roi/run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  assert.equal(firstRun.status, 200);
  const userCAfterFirstRun = await User.findById(userC.user.id);
  assert.ok(firstRun.payload.data.processed >= 1);
  assert.equal(userCAfterFirstRun.walletBalance, 14.4);
  assert.equal(userCAfterFirstRun.totalROIEarned, 14.4);
  assert.equal(await ROIHistory.countDocuments({ investmentId }), 1);

  const roiHistoryResponse = await request('/api/roi/history?page=1&limit=20', {
    headers: { Authorization: `Bearer ${userC.token}` },
  });
  assert.equal(roiHistoryResponse.status, 200);
  const roiHistoryItem = roiHistoryResponse.payload.data.items.find(
    (item) => String(item.investmentId?._id || item.investmentId) === String(investmentId)
  );
  assert.equal(roiHistoryItem.roiAmount, 14.4);

  const secondRun = await request('/api/admin/roi/run', {
    method: 'POST',
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  assert.equal(secondRun.status, 200);
  const userCAfterSecondRun = await User.findById(userC.user.id);
  assert.equal(secondRun.payload.data.processed, 0);
  assert.equal(userCAfterSecondRun.walletBalance, 14.4);
  assert.equal(await ROIHistory.countDocuments({ investmentId }), 1);
  assert.equal(
    await WalletTransaction.countDocuments({
      userId: userC.user.id,
      transactionType: 'ROI',
      referenceId: investmentId,
    }),
    1
  );
  const roiLedgerEntry = await WalletTransaction.findOne({
    userId: userC.user.id,
    transactionType: 'ROI',
    referenceId: investmentId,
  });
  assert.equal(roiLedgerEntry.amount, 14.4);
  assert.equal(roiLedgerEntry.balanceBefore, 0);
  assert.equal(roiLedgerEntry.balanceAfter, 14.4);

  const refreshedDashboard = await request('/api/dashboard/summary', {
    headers: { Authorization: `Bearer ${userC.token}` },
  });
  assert.equal(refreshedDashboard.status, 200);
  assert.equal(refreshedDashboard.payload.data.summary.totalInvestments, 1200);
  assert.equal(refreshedDashboard.payload.data.summary.dailyROI, 14.4);
  assert.equal(refreshedDashboard.payload.data.summary.totalROIEarned, 14.4);
  assert.equal(refreshedDashboard.payload.data.summary.walletBalance, 14.4);
  const refreshedUserBDashboard = await request('/api/dashboard/summary', {
    headers: { Authorization: `Bearer ${loginB.payload.data.token}` },
  });
  assert.equal(refreshedUserBDashboard.payload.data.summary.totalLevelIncomeEarned, 60);
  assert.equal(refreshedUserBDashboard.payload.data.summary.walletBalance, 60);
  assert.equal((await User.findById(userA.user.id)).walletBalance, 36);
  assert.equal((await User.findById(userB.user.id)).walletBalance, 60);
});

test('applies the configured minimum investment and maximum referral levels', async () => {
  const level1 = await registerUser('referral-level-1');
  const level2 = await registerUser('referral-level-2', level1.user.referralCode);
  const level3 = await registerUser('referral-level-3', level2.user.referralCode);
  const lowBalanceChild = await registerUser('referral-minimum', level3.user.referralCode);

  const belowMinimum = await request('/api/investments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${lowBalanceChild.token}` },
    body: { amount: 999, planId: 'test-plan' },
  });
  assert.equal(belowMinimum.status, 201);
  assert.equal(await ReferralIncome.countDocuments({ investmentId: belowMinimum.payload.data.investment._id }), 0);

  const adequatelyFundedChild = await registerUser('referral-level-capped', level3.user.referralCode);
  const capped = await request('/api/investments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adequatelyFundedChild.token}` },
    body: { amount: 1000, planId: 'test-plan' },
  });

  assert.equal(capped.status, 201);
  const payoutLevels = await ReferralIncome.distinct('level', { investmentId: capped.payload.data.investment._id });
  assert.deepEqual(payoutLevels.sort(), [1, 2]);
});

test('returns only safe direct-referral fields and supports pagination', async () => {
  const parent = await registerUser('direct-referral-fields');
  await registerUser('direct-referral-child', parent.user.referralCode);

  const response = await request('/api/referrals/direct?page=1&limit=1', {
    headers: { Authorization: `Bearer ${parent.token}` },
  });

  assert.equal(response.status, 200);
  assert.equal(response.payload.data.referrals.length, 1);
  assert.equal(response.payload.data.pagination.total, 1);
  assert.equal(Object.hasOwn(response.payload.data.referrals[0], 'password'), false);
  assert.equal(Object.hasOwn(response.payload.data.referrals[0], 'walletBalance'), false);
});

test('returns a complete, nested referral tree without exposing private user fields', async () => {
  const root = await registerUser('tree-root');
  const child = await registerUser('tree-child', root.user.referralCode);
  await registerUser('tree-grandchild', child.user.referralCode);

  const response = await request('/api/referrals/tree', {
    headers: { Authorization: `Bearer ${root.token}` },
  });

  assert.equal(response.status, 200);
  const firstChild = response.payload.data.tree.children[0];
  assert.equal(firstChild.level, 1);
  assert.equal(firstChild.children[0].level, 2);
  assert.equal(Object.hasOwn(firstChild, 'walletBalance'), false);
  assert.equal(Object.hasOwn(firstChild, 'password'), false);
});

test('protects user routes behind authentication', async () => {
  const privateEndpoints = [
    '/api/auth/me',
    '/api/investments',
    '/api/investments/plans',
    '/api/dashboard/summary',
    '/api/referrals/direct',
    '/api/referrals/tree',
  ];

  for (const endpoint of privateEndpoints) {
    const response = await request(endpoint);
    assert.equal(response.status, 401, `${endpoint} should require authentication`);
  }
});

test('restricts manual ROI execution to the admin route', async () => {
  const { token } = await registerUser('manual-roi-access');
  const headers = { Authorization: 'Bearer ' + token };

  const investmentRouteResponse = await request('/api/investments/process-roi', {
    method: 'POST',
    headers,
  });
  const adminRouteResponse = await request('/api/admin/roi/run', {
    method: 'POST',
    headers,
  });

  assert.equal(investmentRouteResponse.status, 404);
  assert.equal(adminRouteResponse.status, 403);
});

test('validates wallet and admin table filters', async () => {
  const { token, user } = await registerUser('admin-table-filters');
  await User.updateOne({ _id: user.id }, { $set: { role: 'admin' } });
  const headers = { Authorization: 'Bearer ' + token };

  const invalidWalletFilter = await request('/api/wallet/transactions?type=UNSUPPORTED', { headers });
  const invalidAdminFilter = await request('/api/admin/investments?status=unknown', { headers });
  const validAdminQuery = await request('/api/admin/investments?page=1&limit=5&sortBy=amount&sortOrder=asc', { headers });

  assert.equal(invalidWalletFilter.status, 400);
  assert.equal(invalidAdminFilter.status, 400);
  assert.equal(validAdminQuery.status, 200);
  assert.equal(validAdminQuery.payload.data.pagination.limit, 5);
});
