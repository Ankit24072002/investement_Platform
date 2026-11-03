const User = require('../models/User');
const Investment = require('../models/Investment');
const { processDailyROI } = require('../services/businessLogic');

const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = String(req.query.search || '').trim();
    const accountStatus = String(req.query.accountStatus || '').trim();

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (accountStatus) {
      query.accountStatus = accountStatus;
    }

    const [items, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully.',
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
    return res.status(500).json({ success: false, message: error.message || 'Unable to fetch users.' });
  }
};

const getInvestments = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const status = String(req.query.status || '').trim();
    const query = {};

    if (status) {
      query.status = status;
    }

    const [items, total] = await Promise.all([
      Investment.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Investment.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Investments fetched successfully.',
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
    return res.status(500).json({ success: false, message: error.message || 'Unable to fetch investments.' });
  }
};

const runManualROI = async (req, res) => {
  try {
    const processed = await processDailyROI({ manualRun: true });
    return res.status(200).json({
      success: true,
      message: 'Manual ROI processing completed.',
      data: { processed },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to process manual ROI run.' });
  }
};

module.exports = { getUsers, getInvestments, runManualROI };
