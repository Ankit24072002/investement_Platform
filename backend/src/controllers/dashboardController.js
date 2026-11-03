const User = require('../models/User');
const Investment = require('../models/Investment');
const ReferralIncome = require('../models/ReferralIncome');
const ROIHistory = require('../models/ROIHistory');

const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const investments = await Investment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const totalInvestments = investments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const referralHistory = await ReferralIncome.find({ userId: req.user._id }).sort({ date: -1 }).limit(10);
    const roiHistory = await ROIHistory.find({ userId: req.user._id }).sort({ date: -1 }).limit(10);

    return res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        walletBalance: user.walletBalance,
        totalROI: user.totalROI,
        totalLevelIncome: user.totalLevelIncome,
        referralCode: user.referralCode,
      },
      summary: {
        totalInvestments,
        totalROI: user.totalROI,
        totalLevelIncome: user.totalLevelIncome,
        walletBalance: user.walletBalance,
      },
      investments,
      referralHistory,
      roiHistory,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };
