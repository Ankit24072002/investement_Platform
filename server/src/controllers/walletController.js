const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

const getWalletSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance totalROIEarned totalLevelIncomeEarned');

    return res.status(200).json({
      success: true,
      message: 'Wallet summary fetched successfully.',
      data: {
        walletBalance: Number(user.walletBalance || 0),
        totalROIEarned: Number(user.totalROIEarned || 0),
        totalLevelIncomeEarned: Number(user.totalLevelIncomeEarned || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load wallet summary.' });
  }
};

const getWalletTransactions = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const type = String(req.query.type || '').trim();
    const filter = { userId: req.user._id };

    if (type) {
      filter.transactionType = type;
    }

    const [items, total] = await Promise.all([
      WalletTransaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      WalletTransaction.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Wallet transactions fetched successfully.',
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
    return res.status(500).json({ success: false, message: error.message || 'Unable to fetch wallet transactions.' });
  }
};

module.exports = { getWalletSummary, getWalletTransactions };
