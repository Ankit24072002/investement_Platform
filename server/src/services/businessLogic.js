const mongoose = require('mongoose');
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

const getAncestorChain = async (userId) => {
  const chain = [];
  const seen = new Set();
  let currentUserId = userId;

  while (currentUserId) {
    const currentUser = await User.findById(currentUserId).lean();
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
    const referrer = await User.findById(entry.userId);
    if (!referrer) continue;
    const commissionRate = getReferralCommissionRate(entry.level);
    if (commissionRate <= 0) continue;
    ancestors.push({ user: referrer, level: entry.level, commissionRate });
  }

  return ancestors;
};

/**
 * Walks the referrer tree and credits configured referral payouts to eligible ancestors.
 * Duplicate payouts are blocked using a unique idempotency key per receiver + level + investment.
 */
const awardReferralIncome = async (userId, investmentAmount, investmentId = null, session = null) => {
  try {
    const user = await User.findById(userId).session(session);
    if (!user || !user.referredBy) {
      return [];
    }

    const investment = investmentId ? await Investment.findById(investmentId).session(session) : null;
    if (investment && investment.referralPayoutProcessed) {
      return [];
    }

    const ancestors = await getAncestorChain(userId);
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

      const balanceBefore = roundMoney(Number(ancestor.user.walletBalance || 0));
      const afterBalance = roundMoney(balanceBefore + amount);

      ancestor.user.walletBalance = afterBalance;
      ancestor.user.totalLevelIncomeEarned = roundMoney((Number(ancestor.user.totalLevelIncomeEarned || 0) + amount));
      ancestor.user.totalLevelIncome = ancestor.user.totalLevelIncomeEarned;
      await ancestor.user.save({ session });

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
      await Investment.findByIdAndUpdate(investmentId, { referralPayoutProcessed: true }, { session, new: true });
    }

    return payouts;
  } catch (error) {
    console.error('Referral award failed:', error);
    throw error;
  }
};

/**
 * Calculates and records a single investment's daily ROI while enforcing idempotency and balance updates.
 */
const processSingleROI = async ({ investment, today, session = null }) => {
  const idempotencyKey = getIdempotencyKey('roi', investment._id.toString(), today.toISOString().slice(0, 10));
  const findOne = (query) => (session ? query.session(session) : query);

  const historyExists = await findOne(ROIHistory.findOne({ idempotencyKey }));
  if (historyExists) {
    return false;
  }

  const user = await findOne(User.findById(investment.userId));
  if (!user) {
    return false;
  }

  const dailyRate = Number(investment.dailyROIPercentage || investment.dailyROI || 0) / 100;
  const roiAmount = roundMoney(Number(investment.amount || 0) * dailyRate);

  if (roiAmount <= 0) {
    return false;
  }

  const balanceBefore = roundMoney(Number(user.walletBalance || 0));
  const balanceAfter = roundMoney(balanceBefore + roiAmount);

  await findOne(
    ROIHistory.findOneAndUpdate(
      { idempotencyKey },
      {
        userId: investment.userId,
        investmentId: investment._id,
        amount: roiAmount,
        roiAmount,
        date: today,
        status: 'credited',
        idempotencyKey,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  );

  user.walletBalance = balanceAfter;
  user.totalROIEarned = roundMoney((Number(user.totalROIEarned || 0) + roiAmount));
  user.totalROI = user.totalROIEarned;
  if (session) {
    await user.save({ session });
  } else {
    await user.save();
  }

  await recordWalletTransaction({
    userId: user._id,
    transactionType: 'ROI',
    amount: roiAmount,
    balanceBefore,
    balanceAfter,
    referenceId: investment._id,
    referenceModel: 'Investment',
    description: 'Daily ROI credit for active investment',
    status: 'success',
    session,
  });

  const updatedInvestment = await findOne(Investment.findById(investment._id));
  if (updatedInvestment) {
    updatedInvestment.totalROIGenerated = roundMoney((Number(updatedInvestment.totalROIGenerated || 0) + roiAmount));
    if (new Date(updatedInvestment.endDate) <= new Date(today)) {
      updatedInvestment.status = 'completed';
    }
    if (session) {
      await updatedInvestment.save({ session });
    } else {
      await updatedInvestment.save();
    }
  }

  return true;
};

/**
 * Runs the daily ROI processor for all active investments and skips duplicate runs with a DB lock.
 */
const processDailyROI = async ({ manualRun = false } = {}) => {
  const cronLockName = 'daily-roi-processor';

  try {
    const lockCollection = mongoose.connection.db.collection('cron_locks');
    await lockCollection.insertOne({ _id: cronLockName, createdAt: new Date() });
  } catch (error) {
    if (error.code === 11000) {
      console.warn('Daily ROI processor is already running. Skipping duplicate execution.');
      return 0;
    }
    throw error;
  }

  try {
    const today = buildDateKey(new Date());
    let processedCount = 0;

    const activeInvestments = await Investment.find({
      status: 'active',
      startDate: { $lte: today },
      endDate: { $gte: today },
    }).lean();

    for (const investment of activeInvestments) {
      const session = await mongoose.startSession();
      try {
        let wasProcessed = false;

        try {
          await session.withTransaction(async () => {
            wasProcessed = await processSingleROI({ investment, today, session });
          });
        } catch (error) {
          if (!error.message || !error.message.includes('Transaction numbers are only allowed on a replica set member or mongos')) {
            throw error;
          }

          wasProcessed = await processSingleROI({ investment, today });
        }

        if (wasProcessed) {
          processedCount += 1;
        }
      } catch (error) {
        console.error(`ROI processing failed for investment ${investment._id}:`, error.message);
      } finally {
        session.endSession();
      }
    }

    if (manualRun) {
      console.log(`Manual ROI run completed. Processed ${processedCount} investments.`);
    }

    return processedCount;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.collection('cron_locks').deleteOne({ _id: cronLockName });
    }
  }
};

/**
 * Builds a nested referral tree rooted at the current user for dashboard display and auditing.
 */
const getReferralTree = async (userId) => {
  const rootUser = await User.findById(userId).select('-password').lean();
  if (!rootUser) {
    return null;
  }

  const buildChildren = async (id, level = 1, seen = new Set()) => {
    if (seen.has(String(id))) {
      return [];
    }
    seen.add(String(id));

    const children = await User.find({ referredBy: id }).select('-password').lean();
    const mappedChildren = [];

    for (const child of children) {
      mappedChildren.push({
        ...child,
        level,
        children: await buildChildren(child._id, level + 1, seen),
      });
    }

    return mappedChildren;
  };

  return {
    ...rootUser,
    level: 0,
    children: await buildChildren(userId),
  };
};

module.exports = {
  generateReferralCode,
  awardReferralIncome,
  processDailyROI,
  getReferralTree,
  roundMoney,
  getIdempotencyKey,
  validateReferralTarget,
};
