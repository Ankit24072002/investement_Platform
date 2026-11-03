const User = require('../models/User');
const Investment = require('../models/Investment');
const ReferralIncome = require('../models/ReferralIncome');
const ROIHistory = require('../models/ROIHistory');

const generateReferralCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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

const getDailyROIKey = (date = new Date()) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const awardReferralIncome = async (userId, investmentAmount, investmentId = null) => {
  const user = await User.findById(userId);

  if (!user || !user.referredBy) {
    return 0;
  }

  if (investmentId) {
    const investment = await Investment.findById(investmentId);
    if (investment && investment.referralPayoutProcessed) {
      return 0;
    }
  }

  let currentReferrerId = user.referredBy;
  let level = 1;
  const commissionRates = [0.05, 0.03, 0.02, 0.01];
  let totalAwarded = 0;

  while (currentReferrerId && level <= commissionRates.length) {
    const referrer = await User.findById(currentReferrerId);

    if (!referrer) {
      break;
    }

    const amount = Number((investmentAmount * commissionRates[level - 1]).toFixed(2));
    referrer.walletBalance = Number((referrer.walletBalance + amount).toFixed(2));
    referrer.totalLevelIncome = Number((referrer.totalLevelIncome + amount).toFixed(2));
    await referrer.save();

    await ReferralIncome.create({
      userId: referrer._id,
      referredUserId: user._id,
      level,
      amount,
      date: new Date(),
    });

    totalAwarded += amount;
    currentReferrerId = referrer.referredBy;
    level += 1;
  }

  if (investmentId) {
    await Investment.findByIdAndUpdate(investmentId, { referralPayoutProcessed: true });
  }

  return totalAwarded;
};

const processDailyROI = async () => {
  const currentDate = getDailyROIKey(new Date());
  const nextDay = new Date(currentDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const activeInvestments = await Investment.find({ status: 'active' });
  let processedCount = 0;

  for (const investment of activeInvestments) {
    const existingToday = await ROIHistory.findOne({
      userId: investment.userId,
      investmentId: investment._id,
      date: {
        $gte: currentDate,
        $lt: nextDay,
      },
    });

    if (existingToday) {
      continue;
    }

    const roiAmount = Number((investment.amount * (investment.dailyROI / 100)).toFixed(2));

    await ROIHistory.create({
      userId: investment.userId,
      investmentId: investment._id,
      amount: roiAmount,
      date: currentDate,
      status: 'credited',
    });

    const user = await User.findById(investment.userId);
    if (user) {
      user.walletBalance = Number((user.walletBalance + roiAmount).toFixed(2));
      user.totalROI = Number((user.totalROI + roiAmount).toFixed(2));
      await user.save();
    }

    investment.totalROIGenerated = Number((investment.totalROIGenerated + roiAmount).toFixed(2));

    if (new Date(investment.endDate) <= currentDate) {
      investment.status = 'completed';
    }

    await investment.save();
    processedCount += 1;
  }

  return processedCount;
};

const getReferralTree = async (userId) => {
  const rootUser = await User.findById(userId).select('-password');
  if (!rootUser) {
    return null;
  }

  const buildChildren = async (id, level = 1) => {
    const children = await User.find({ referredBy: id }).select('-password').lean();
    const mappedChildren = [];

    for (const child of children) {
      mappedChildren.push({
        ...child,
        level,
        children: await buildChildren(child._id, level + 1),
      });
    }

    return mappedChildren;
  };

  return {
    ...rootUser.toObject(),
    level: 0,
    children: await buildChildren(userId, 1),
  };
};

module.exports = {
  generateReferralCode,
  awardReferralIncome,
  processDailyROI,
  getReferralTree,
};
