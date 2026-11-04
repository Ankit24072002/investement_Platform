const User = require('../models/User');
const Investment = require('../models/Investment');
const ReferralIncome = require('../models/ReferralIncome');
const ROIHistory = require('../models/ROIHistory');

const getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const [user, investmentTotals, directReferrals, investments, roiHistory, referralHistory] = await Promise.all([
      User.findById(req.user._id).select('fullName email referralCode walletBalance totalROIEarned totalROI totalLevelIncomeEarned totalLevelIncome'),
      Investment.aggregate([
        { $match: { userId: req.user._id } },
        {
          $group: {
            _id: null,
            totalInvestments: { $sum: '$amount' },
            dailyROI: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'active'] },
                      { $lte: ['$startDate', now] },
                      { $gte: ['$endDate', now] },
                    ],
                  },
                  {
                    $multiply: [
                      '$amount',
                      {
                        $divide: [
                          {
                            $cond: [
                              { $gt: [{ $ifNull: ['$dailyROIPercentage', 0] }, 0] },
                              '$dailyROIPercentage',
                              { $ifNull: ['$dailyROI', 0] },
                            ],
                          },
                          100,
                        ],
                      },
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      ]),
      User.countDocuments({ referredBy: req.user._id }),
      Investment.find({ userId: req.user._id }).select('amount planName planDetails startDate endDate dailyROI dailyROIPercentage status createdAt').sort({ createdAt: -1 }).limit(10).lean(),
      ROIHistory.find({ userId: req.user._id }).select('investmentId amount roiAmount date status').sort({ date: -1 }).limit(10).lean(),
      ReferralIncome.find({ receiver: req.user._id }).select('generatedBy referredUserId investmentId level amount date status').sort({ date: -1 }).limit(10).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const totals = investmentTotals[0] || { totalInvestments: 0, dailyROI: 0 };

    const summary = {
      totalInvestments: Number(totals.totalInvestments || 0),
      dailyROI: Number(Number(totals.dailyROI || 0).toFixed(2)),
      totalROIEarned: Number(user.totalROIEarned || user.totalROI || 0),
      totalLevelIncomeEarned: Number(user.totalLevelIncomeEarned || user.totalLevelIncome || 0),
      walletBalance: Number(user.walletBalance || 0),
      directReferrals,
    };

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
    const [user, investmentTotals, roiCount, referralCount] = await Promise.all([
      User.findById(req.user._id).select('totalROIEarned totalROI totalLevelIncomeEarned totalLevelIncome walletBalance'),
      Investment.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: null, totalInvestments: { $sum: '$amount' } } },
      ]),
      ROIHistory.countDocuments({ userId: req.user._id }),
      ReferralIncome.countDocuments({ receiver: req.user._id }),
    ]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Earnings breakdown fetched successfully.',
      data: {
        totalInvestments: Number(investmentTotals[0]?.totalInvestments || 0),
        totalROIEarned: Number(user.totalROIEarned || user.totalROI || 0),
        totalLevelIncomeEarned: Number(user.totalLevelIncomeEarned || user.totalLevelIncome || 0),
        walletBalance: Number(user.walletBalance || 0),
        roiCount,
        referralCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load earnings breakdown.' });
  }
};

const getEarningsTrend = async (req, res) => {
  try {
    const requestedDays = Number.parseInt(req.query.days, 10);
    const days = Number.isInteger(requestedDays) ? Math.min(90, Math.max(7, requestedDays)) : 30;
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    startDate.setUTCDate(startDate.getUTCDate() - days + 1);
    const groupByUtcDate = {
      $dateToString: { format: '%Y-%m-%d', date: '$date' },
    };
    const groupInvestmentsByUtcDate = {
      $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
    };
    const [roi, referrals, investments] = await Promise.all([
      ROIHistory.aggregate([
        { $match: { userId: req.user._id, date: { $gte: startDate }, status: 'credited' } },
        { $group: { _id: groupByUtcDate, amount: { $sum: '$roiAmount' } } },
      ]),
      ReferralIncome.aggregate([
        { $match: { receiver: req.user._id, date: { $gte: startDate }, status: 'credited' } },
        { $group: { _id: groupByUtcDate, amount: { $sum: '$amount' } } },
      ]),
      Investment.aggregate([
        {
          $match: {
            userId: req.user._id,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: groupInvestmentsByUtcDate,
            amount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const valuesByDate = new Map();
    const addRows = (rows, key) => {
      for (const row of rows) {
        const values = valuesByDate.get(row._id) || { date: row._id, investmentVolume: 0, roiIncome: 0, referralIncome: 0 };
        values[key] = Number(row.amount || 0);
        valuesByDate.set(row._id, values);
      }
    };
    addRows(investments, 'investmentVolume');
    addRows(roi, 'roiIncome');
    addRows(referrals, 'referralIncome');

    const trend = [];
    for (let offset = 0; offset < days; offset += 1) {
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + offset);
      const key = date.toISOString().slice(0, 10);
      trend.push(valuesByDate.get(key) || { date: key, investmentVolume: 0, roiIncome: 0, referralIncome: 0 });
    }

    return res.status(200).json({
      success: true,
      message: 'Earnings trend fetched successfully.',
      data: { days, trend },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load earnings trend.' });
  }
};

const getDashboard = async (req, res) => getDashboardSummary(req, res);

module.exports = { getDashboard, getDashboardSummary, getROIChart, getEarningsBreakdown, getEarningsTrend };
