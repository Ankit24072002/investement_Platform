const User = require('../models/User');
const Investment = require('../models/Investment');
const ReferralIncome = require('../models/ReferralIncome');
const ROIHistory = require('../models/ROIHistory');

const getDashboardSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const investments = await Investment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const totalInvestments = investments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const directReferrals = await User.countDocuments({ referredBy: req.user._id });

    const summary = {
      totalInvestments,
      totalROIEarned: Number(user.totalROIEarned || user.totalROI || 0),
      totalLevelIncomeEarned: Number(user.totalLevelIncomeEarned || user.totalLevelIncome || 0),
      walletBalance: Number(user.walletBalance || 0),
      directReferrals,
    };

    const roiHistory = await ROIHistory.find({ userId: req.user._id }).sort({ date: -1 }).limit(10);
    const referralHistory = await ReferralIncome.find({ receiver: req.user._id }).sort({ date: -1 }).limit(10);

    return res.status(200).json({
      success: true,
      message: 'Dashboard summary fetched successfully.',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          walletBalance: summary.walletBalance,
          totalROIEarned: summary.totalROIEarned,
          totalLevelIncomeEarned: summary.totalLevelIncomeEarned,
          referralCode: user.referralCode,
        },
        summary,
        investments,
        referralHistory,
        roiHistory,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load dashboard summary.' });
  }
};

const getROIChart = async (req, res) => {
  try {
    const data = await ROIHistory.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, roiAmount: { $sum: '$roiAmount' } } },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    return res.status(200).json({
      success: true,
      message: 'ROI chart data fetched successfully.',
      data: data.map((item) => ({ date: item._id, roiAmount: Number(item.roiAmount || 0) })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load ROI chart.' });
  }
};

const getEarningsBreakdown = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const investments = await Investment.find({ userId: req.user._id }).lean();
    const referralIncome = await ReferralIncome.find({ receiver: req.user._id }).lean();
    const roiHistory = await ROIHistory.find({ userId: req.user._id }).lean();

    return res.status(200).json({
      success: true,
      message: 'Earnings breakdown fetched successfully.',
      data: {
        totalInvestments: investments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        totalROIEarned: Number(user.totalROIEarned || user.totalROI || 0),
        totalLevelIncomeEarned: Number(user.totalLevelIncomeEarned || user.totalLevelIncome || 0),
        walletBalance: Number(user.walletBalance || 0),
        roiCount: roiHistory.length,
        referralCount: referralIncome.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load earnings breakdown.' });
  }
};

const getDashboard = async (req, res) => getDashboardSummary(req, res);

module.exports = { getDashboard, getDashboardSummary, getROIChart, getEarningsBreakdown };
