const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Investment = require('../src/models/Investment');
const ReferralIncome = require('../src/models/ReferralIncome');
const ROIHistory = require('../src/models/ROIHistory');
const { processDailyROI } = require('../src/services/businessLogic');

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

const getInvestmentDates = () => {
  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

const registerUser = async (suffix, referralCode = '') => {
  const email = `nexachain-${Date.now()}-${suffix}@example.com`;
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: `Test ${suffix}`,
      email,
      mobileNumber: `900000${Math.floor(Math.random() * 9000 + 1000)}`,
      password: 'Password123!',
      referralCode,
    },
  });

  assert.equal(response.status, 201, `Registration failed for ${suffix}: ${JSON.stringify(response.payload)}`);
  return { email, token: response.payload.data.token, user: response.payload.data.user };
};

test.before(async () => {
  await connectDB();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  testBaseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await server.close();
  await mongoose.disconnect();
});

test('registers a new user and returns a JWT token', async () => {
  const result = await registerUser('register');

  assert.ok(result.token);
  assert.equal(result.user.email, result.email);
  assert.ok(result.user.referralCode);
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

test('rejects invalid JWT on protected routes', async () => {
  const response = await request('/api/auth/me', {
    method: 'GET',
    headers: { Authorization: 'Bearer invalid.token.here' },
  });

  assert.equal(response.status, 401);
  assert.equal(response.payload.success, false);
});

test('creates an investment for an authenticated user', async () => {
  const { token } = await registerUser('investment');
  const { startDate, endDate } = getInvestmentDates();
  const response = await request('/api/investments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      amount: 1000,
      planName: 'Starter Plan',
      planDetails: 'Starter Plan',
      startDate,
      endDate,
      dailyROI: 1.2,
    },
  });

  assert.equal(response.status, 201, JSON.stringify(response.payload));
  assert.equal(response.payload.success, true);
  assert.ok(response.payload.data.investment._id);
});

test('prevents duplicate daily ROI processing for the same investment date', async () => {
  const { token } = await registerUser('dupe-roi');
  const { startDate, endDate } = getInvestmentDates();
  const createResponse = await request('/api/investments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      amount: 1200,
      planName: 'Growth Plan',
      planDetails: 'Growth Plan',
      startDate,
      endDate,
      dailyROI: 1,
    },
  });

  const investmentId = createResponse.payload.data.investment._id;
  const firstRun = await processDailyROI({ manualRun: true });
  const secondRun = await processDailyROI({ manualRun: true });
  const historyRows = await ROIHistory.find({ investmentId }).countDocuments();

  assert.equal(firstRun >= 1, true);
  assert.equal(secondRun, 0);
  assert.equal(historyRows, 1);
});

test('credits referral income to a valid referrer and maintains referral hierarchy data', async () => {
  const parent = await registerUser('parent-referral');
  const child = await registerUser('child-referral', parent.user.referralCode);

  const { startDate, endDate } = getInvestmentDates();
  const investmentResponse = await request('/api/investments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${child.token}` },
    body: {
      amount: 5000,
      planName: 'Referral Plan',
      planDetails: 'Referral Plan',
      startDate,
      endDate,
      dailyROI: 1.5,
    },
  });

  assert.equal(investmentResponse.status, 201);

  const referrerUser = await User.findById(parent.user.id || parent.user._id);
  const referralRows = await ReferralIncome.find({ receiver: referrerUser._id }).countDocuments();
  const directReferrals = await User.countDocuments({ referredBy: referrerUser._id });

  assert.ok(referralRows >= 1);
  assert.equal(directReferrals, 1);
});

test('protects user routes behind authentication', async () => {
  const response = await request('/api/dashboard/summary');
  assert.equal(response.status, 401);
});
