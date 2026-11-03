const User = require('../models/User');
const ReferralIncome = require('../models/ReferralIncome');
const { getReferralTree } = require('../services/businessLogic');

const getDirectReferrals = async (req, res) => {
  try {
    const referrals = await User.find({ referredBy: req.user._id }).select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, message: 'Direct referrals fetched successfully.', data: { referrals } });
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
      ReferralIncome.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit),
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
  getDirectReferrals,
  getCompleteReferralTree,
  getReferralIncome,
};
