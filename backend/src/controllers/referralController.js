const User = require('../models/User');
const { getReferralTree } = require('../services/businessLogic');

const getDirectReferrals = async (req, res) => {
  try {
    const referrals = await User.find({ referredBy: req.user._id }).select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ referrals });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCompleteReferralTree = async (req, res) => {
  try {
    const tree = await getReferralTree(req.user._id);
    if (!tree) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ tree });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDirectReferrals,
  getCompleteReferralTree,
};
