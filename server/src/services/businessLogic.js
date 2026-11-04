const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const User = require('../models/User');
const Investment = require('../models/Investment');
const ReferralIncome = require('../models/ReferralIncome');
const ROIHistory = require('../models/ROIHistory');
const WalletTransaction = require('../models/WalletTransaction');
const { referralConfig } = require('../config/referral');

/**
 * Safely rounds monetary values to 2 decimal places to avoid floating-point drift.
 */
const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

/**
 * Normalizes the provided date to the start of the day in UTC for idempotent ROI checks.
 */
const buildDateKey = (date = new Date()) => {
  const nextDate = new Date(date);
  nextDate.setUTCHours(0, 0, 0, 0);
  return nextDate;
};

const getIdempotencyKey = (prefix, ...parts) => `${prefix}-${parts.filter(Boolean).join('-')}`;

const recordWalletTransaction = async ({
  userId,
  transactionType,
  amount,
  balanceBefore,
  balanceAfter,
  referenceId,
  referenceModel,
  description,
  status = 'success',
  session,
}) => {
  await WalletTransaction.create(
    [
      {
        userId,
        transactionType,
        amount: roundMoney(amount),
        balanceBefore: roundMoney(balanceBefore),
        balanceAfter: roundMoney(balanceAfter),
        referenceId,
        referenceModel,
        description,
        status,
      },
    ],
    { session }
  );
};

const generateReferralCode = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let index = 0; index < 8; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  const exists = await User.exists({ referralCode: code });
  if (exists) {
    return generateReferralCode();
  }

  return code;
};

const getReferralCommissionRate = (level) => {
  const config = referralConfig.levels.find((entry) => Number(entry.level) === Number(level));
  return config ? Number(config.percentage || 0) / 100 : 0;
};

const validateReferralTarget = async (referrerId, candidateId = null) => {
  if (!referrerId) {
    return null;
  }

  const referrer = await User.findById(referrerId).lean();
  if (!referrer) {
    return null;
  }

  if (candidateId && String(referrer._id) === String(candidateId)) {
    throw new Error('Self-referrals are not allowed.');
  }

  let currentParentId = referrer.referredBy || null;
  const seen = new Set([String(referrer._id)]);

  while (currentParentId) {
    if (String(currentParentId) === String(candidateId)) {
      throw new Error('Referral cycle detected. Please choose a different referrer.');
    }
    if (seen.has(String(currentParentId))) {
      break;
    }
    seen.add(String(currentParentId));
    const parent = await User.findById(currentParentId).lean();
    if (!parent) {
      break;
    }
    currentParentId = parent.referredBy || null;
  }

  return referrer;
};

/**
 * Resolves the referral ancestors in nearest-first order up to the configured payout depth.
 * The session keeps eligibility and hierarchy reads consistent with the payout transaction.
 */
const getAncestorChain = async (userId, session) => {
  const chain = [];
  const seen = new Set();
  let currentUserId = userId;
  const projection = '_id referredBy accountStatus walletBalance totalLevelIncomeEarned totalLevelIncome fullName';

  while (currentUserId && chain.length < referralConfig.maxLevels) {
    const currentUser = await User.findById(currentUserId).select('_id referredBy').session(session).lean();
    if (!currentUser || seen.has(String(currentUserId))) {
      break;
    }

    seen.add(String(currentUserId));
    if (currentUser.referredBy) {
      chain.push({ userId: currentUser.referredBy, level: chain.length + 1 });
      currentUserId = currentUser.referredBy;
    } else {
      break;
    }
  }

  const ancestors = [];
  for (const entry of chain) {
    const referrer = await User.findById(entry.userId).select(projection).session(session).lean();
    if (!referrer) continue;
    const commissionRate = getReferralCommissionRate(entry.level);
    if (commissionRate <= 0) continue;
    ancestors.push({ user: referrer, level: entry.level, commissionRate });
  }

  return ancestors;
};

/**
 * Walks the referrer tree and credits active ancestors using configured rates and eligibility.
 * Each payout updates the wallet, income summary, referral ledger, and wallet ledger atomically.
 * A unique receiver + level + investment key prevents duplicate credits.
 */
const awardReferralIncome = async (userId, investmentAmount, investmentId = null, session = null) => {
  try {
    if (!session) {
      return await runInTransaction((transactionSession) =>
        awardReferralIncome(userId, investmentAmount, investmentId, transactionSession)
      );
    }

    if (Number(investmentAmount) < referralConfig.minEligibleInvestmentAmount) {
      return [];
    }

    const user = await User.findById(userId).select('_id referredBy fullName').session(session);
    if (!user || !user.referredBy) {
      return [];
    }

    const investment = investmentId ? await Investment.findById(investmentId).session(session) : null;
    if (investment && investment.referralPayoutProcessed) {
      return [];
    }

    const ancestors = await getAncestorChain(userId, session);
    const payouts = [];

    for (const ancestor of ancestors) {
      const amount = roundMoney(Number(investmentAmount || 0) * ancestor.commissionRate);
      if (amount <= 0) {
        continue;
      }

      const key = getIdempotencyKey('referral', ancestor.user._id.toString(), investmentId || userId, String(ancestor.level));
      const existing = await ReferralIncome.findOne({ idempotencyKey: key }).session(session);
      if (existing) {
        continue;
      }

      const updatedAncestor = await User.findOneAndUpdate(
        { _id: ancestor.user._id, accountStatus: 'active' },
        {
          $inc: {
            walletBalance: amount,
            totalLevelIncomeEarned: amount,
            totalLevelIncome: amount,
          },
        },
        { new: false, session }
      );
      if (!updatedAncestor) {
        continue;
      }

      const balanceBefore = roundMoney(Number(updatedAncestor.walletBalance || 0));
      const afterBalance = roundMoney(balanceBefore + amount);

      await ReferralIncome.create(
        [
          {
            receiver: ancestor.user._id,
            userId: ancestor.user._id,
            generatedBy: user._id,
            referredUserId: user._id,
            investment: investmentId || null,
            investmentId: investmentId || null,
            level: ancestor.level,
            amount,
            date: new Date(),
            status: 'credited',
            idempotencyKey: key,
          },
        ],
        { session }
      );

      await recordWalletTransaction({
        userId: ancestor.user._id,
        transactionType: 'REFERRAL',
        amount,
        balanceBefore,
        balanceAfter: afterBalance,
        referenceId: investmentId || user._id,
        referenceModel: 'Investment',
        description: `Referral income level ${ancestor.level} from ${user.fullName || 'referral user'}`,
        status: 'success',
        session,
      });

      payouts.push({ userId: ancestor.user._id, amount, level: ancestor.level });
    }

    if (investmentId) {
      const updatedInvestment = await Investment.findOneAndUpdate(
        { _id: investmentId, referralPayoutProcessed: false },
        { $set: { referralPayoutProcessed: true } },
        { session, new: true }
      );
      if (!updatedInvestment && !(await Investment.exists({ _id: investmentId, referralPayoutProcessed: true }).session(session))) {
        throw new Error(`Investment ${investmentId} was not found while finalizing referral payouts.`);
      }
    }

    return payouts;
  } catch (error) {
    console.error('Referral award failed:', error);
    throw error;
  }
};

/**
 * Calculates and records one eligible investment's daily ROI inside a MongoDB transaction.
 * History, user balances, investment totals, and the wallet ledger either all commit or all roll back.
 */
const processSingleROI = async ({ investment, today, session = null }) => {
  if (!session) {
    throw new Error('Daily ROI must be processed inside a MongoDB transaction.');
  }

  const idempotencyKey = getIdempotencyKey('roi', investment._id.toString(), today.toISOString().slice(0, 10));
  const historyExists = await ROIHistory.findOne({ idempotencyKey }).session(session).lean();
  if (historyExists) {
    return false;
  }

  const currentInvestment = await Investment.findOne({
    _id: investment._id,
    status: 'active',
    startDate: { $lte: today },
    endDate: { $gte: today },
  })
    .select('userId amount dailyROIPercentage dailyROI endDate')
    .session(session)
    .lean();
  if (!currentInvestment) {
    return false;
  }

  const dailyRate = Number(currentInvestment.dailyROIPercentage || currentInvestment.dailyROI || 0) / 100;
  const roiAmount = roundMoney(Number(currentInvestment.amount || 0) * dailyRate);

  if (roiAmount <= 0) {
    return false;
  }

  await ROIHistory.create(
    [
      {
        userId: currentInvestment.userId,
        investmentId: currentInvestment._id,
        amount: roiAmount,
        roiAmount,
        date: today,
        status: 'credited',
        idempotencyKey,
      },
    ],
    { session }
  );

  const updatedUser = await User.findByIdAndUpdate(
    currentInvestment.userId,
    { $inc: { walletBalance: roiAmount, totalROIEarned: roiAmount, totalROI: roiAmount } },
    { new: false, session }
  );
  if (!updatedUser) {
    throw new Error(`User ${currentInvestment.userId} was not found while crediting ROI.`);
  }

  const balanceBefore = roundMoney(Number(updatedUser.walletBalance || 0));
  const balanceAfter = roundMoney(balanceBefore + roiAmount);

  await recordWalletTransaction({
    userId: currentInvestment.userId,
    transactionType: 'ROI',
    amount: roiAmount,
    balanceBefore,
    balanceAfter,
    referenceId: currentInvestment._id,
    referenceModel: 'Investment',
    description: 'Daily ROI credit for active investment',
    status: 'success',
    session,
  });

  const update = { $inc: { totalROIGenerated: roiAmount } };
  if (new Date(currentInvestment.endDate) <= today) {
    update.$set = { status: 'completed' };
  }
  const investmentUpdate = await Investment.updateOne(
    {
      _id: currentInvestment._id,
      status: 'active',
      startDate: { $lte: today },
      endDate: { $gte: today },
    },
    update,
    { session }
  );
  if (investmentUpdate.matchedCount !== 1) {
    throw new Error(`Investment ${currentInvestment._id} changed while crediting ROI.`);
  }

  return true;
};

/**
 * Processes all investments active on the current UTC date in bounded-memory cursor batches.
 * A leased database lock coordinates workers; per-investment idempotency remains the final safeguard.
 */
const processDailyROI = async ({ manualRun = false } = {}) => {
  const cronLockName = 'daily-roi-processor';
  const lockOwner = randomUUID();
  const now = new Date();
  const lockCollection = mongoose.connection.db.collection('cron_locks');

  try {
    await lockCollection.updateOne(
      { _id: cronLockName, $or: [{ leaseUntil: { $lte: now } }, { leaseUntil: { $exists: false } }] },
      { $set: { owner: lockOwner, leaseUntil: new Date(now.getTime() + 120000) } },
      { upsert: true }
    );
  } catch (error) {
    if (error.code === 11000) {
      console.warn('Daily ROI processor is already running. Skipping duplicate execution.');
      return 0;
    }
    throw error;
  }

  try {
    let lockError = null;
    const heartbeat = setInterval(async () => {
      try {
        const renewed = await lockCollection.updateOne(
          { _id: cronLockName, owner: lockOwner },
          { $set: { leaseUntil: new Date(Date.now() + 120000) } }
        );
        if (renewed.matchedCount !== 1) {
          lockError = new Error('Daily ROI processor lost its scheduler lease.');
        }
      } catch (error) {
        lockError = error;
      }
    }, 30000);
    heartbeat.unref();
    const today = buildDateKey(new Date());
    let processedCount = 0;
    const failures = [];

    try {
      const activeInvestments = Investment.find({
        status: 'active',
        startDate: { $lte: today },
        endDate: { $gte: today },
      })
        .select('_id')
        .lean()
        .cursor();

      try {
        for await (const investment of activeInvestments) {
          if (lockError) throw lockError;
          try {
            const wasProcessed = await runInTransaction((session) =>
              processSingleROI({ investment, today, session })
            );
            if (wasProcessed) processedCount += 1;
          } catch (error) {
            failures.push({ investmentId: investment._id, error });
            console.error(`ROI processing failed for investment ${investment._id}:`, error.message);
          }
        }
      } finally {
        await activeInvestments.close();
      }

      if (lockError) throw lockError;
      if (failures.length) {
        const processingError = new Error(
          `ROI processing failed for ${failures.length} investment(s). Check server logs for details.`
        );
        processingError.statusCode = failures[0].error.statusCode || 500;
        throw processingError;
      }

      if (manualRun) {
        console.log(`Manual ROI run completed. Processed ${processedCount} investments.`);
      }
      return processedCount;
    } finally {
      clearInterval(heartbeat);
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await lockCollection.deleteOne({ _id: cronLockName, owner: lockOwner });
    }
  }
};

/**
 * Runs a financial mutation with MongoDB's retry behavior and always closes its session.
 */
const runInTransaction = async (operation) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } catch (error) {
    if (
      error.code === 20 ||
      /Transaction numbers are only allowed|does not support transactions/i.test(error.message || '')
    ) {
      const transactionError = new Error(
        'Financial operations require MongoDB running as a replica set or sharded cluster.'
      );
      transactionError.statusCode = 503;
      throw transactionError;
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

const assertTransactionSupport = () => {
  const topologyType = mongoose.connection.getClient()?.topology?.description?.type;
  if (!['ReplicaSetWithPrimary', 'Sharded'].includes(topologyType)) {
    throw new Error('MongoDB must run as a replica set or sharded cluster for atomic financial operations.');
  }
};

/**
 * Builds a nested referral tree rooted at the current user for dashboard display and auditing.
 */
const getReferralTree = async (userId) => {
  const treeProjection = 'fullName referralCode accountStatus createdAt referredBy';
  const rootUser = await User.findById(userId).select(treeProjection).lean();
  if (!rootUser) {
    return null;
  }

  rootUser.level = 0;
  rootUser.children = [];
  const seen = new Set([String(rootUser._id)]);
  let frontier = [rootUser];

  while (frontier.length) {
    const parentIds = frontier.map((parent) => parent._id);
    const children = await User.find({ referredBy: { $in: parentIds } })
      .select(treeProjection)
      .sort({ createdAt: 1 })
      .lean();
    const parentsById = new Map(frontier.map((parent) => [String(parent._id), parent]));
    const nextFrontier = [];

    for (const child of children) {
      const childId = String(child._id);
      const parent = parentsById.get(String(child.referredBy));
      if (!parent || seen.has(childId)) continue;
      seen.add(childId);
      child.level = parent.level + 1;
      child.children = [];
      parent.children.push(child);
      nextFrontier.push(child);
    }

    frontier = nextFrontier;
  }

  return rootUser;
};

module.exports = {
  generateReferralCode,
  awardReferralIncome,
  processDailyROI,
  getReferralTree,
  roundMoney,
  getIdempotencyKey,
  validateReferralTarget,
  runInTransaction,
  assertTransactionSupport,
  recordWalletTransaction,
};
