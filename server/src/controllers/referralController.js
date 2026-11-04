const User = require('../models/User');
const ReferralIncome = require('../models/ReferralIncome');
const { getReferralTree } = require('../services/businessLogic');
const { referralConfig } = require('../config/referral');

const getReferralSummary = async (req, res) => {
  try {
    const [user, directReferrals, earnedLevels] = await Promise.all([
      User.findById(req.user._id).select('totalLevelIncomeEarned totalLevelIncome'),
      User.countDocuments({ referredBy: req.user._id }),
      ReferralIncome.distinct('level', { receiver: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Referral summary fetched successfully.',
      data: {
        directReferrals,
        totalLevelIncomeEarned: Number(user?.totalLevelIncomeEarned || user?.totalLevelIncome || 0),
        configuredLevels: referralConfig.levels.length,
        earnedLevels: earnedLevels.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load referral summary.' });
  }
};

const getDirectReferrals = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = { referredBy: req.user._id };
    const [referrals, total] = await Promise.all([
      User.find(filter)
        .select('fullName referralCode accountStatus createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    return res.status(200).json({
      success: true,
      message: 'Direct referrals fetched successfully.',
      data: { referrals, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load direct referrals.' });
  }
};

const getCompleteReferralTree = async (req, res) => {
  try {
    const tree = await getReferralTree(req.user._id);
    if (!tree) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, message: 'Referral tree fetched successfully.', data: { tree } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load referral tree.' });
  }
};

const getReferralIncome = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = { receiver: req.user._id };

    const [items, total] = await Promise.all([
      ReferralIncome.find(filter)
        .populate('generatedBy', 'fullName email')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ReferralIncome.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Referral income fetched successfully.',
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to fetch referral income.' });
  }
};

module.exports = {
  getReferralSummary,
  getDirectReferrals,
  getCompleteReferralTree,
  getReferralIncome,
};
