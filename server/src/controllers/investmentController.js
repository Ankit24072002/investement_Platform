const Investment = require('../models/Investment');
const ROIHistory = require('../models/ROIHistory');
const ReferralIncome = require('../models/ReferralIncome');
const { awardReferralIncome, processDailyROI } = require('../services/businessLogic');

const createInvestment = async (req, res) => {
  try {
    const { amount, planName, planDetails, startDate, endDate, dailyROI, dailyROIPercentage } = req.body;

    if (!amount || !planDetails || !startDate || !endDate || !(dailyROI || dailyROIPercentage)) {
      return res.status(400).json({ success: false, message: 'Amount, plan details, start date, end date, and daily ROI are required.' });
    }

    const numberAmount = Number(amount);
    const percent = Number(dailyROI || dailyROIPercentage);

    if (numberAmount <= 0 || percent <= 0) {
      return res.status(400).json({ success: false, message: 'Investment amount and daily ROI percentage must be greater than zero.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be after the start date.' });
    }

    const investment = await Investment.create({
      userId: req.user._id,
      user: req.user._id,
      amount: numberAmount,
      planName: planName || planDetails,
      planDetails,
      startDate: start,
      endDate: end,
      dailyROI: percent,
      dailyROIPercentage: percent,
      status: 'active',
      referralPayoutProcessed: false,
    });

    await awardReferralIncome(req.user._id, numberAmount, investment._id);

    return res.status(201).json({
      success: true,
      message: 'Investment created successfully.',
      data: { investment },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to create investment.' });
  }
};

const getInvestmentById = async (req, res) => {
  try {
    const investment = await Investment.findOne({ _id: req.params.id, userId: req.user._id });

    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Investment fetched successfully.',
      data: { investment },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to fetch investment details.' });
  }
};

const getInvestments = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const status = String(req.query.status || '').trim();
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortOrder = String(req.query.sortOrder || 'desc') === 'asc' ? 1 : -1;
    const filter = { userId: req.user._id };

    if (status) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      Investment.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit),
      Investment.countDocuments(filter),
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

const getROIHistory = async (req, res) => {
  try {
    const history = await ROIHistory.find({ userId: req.user._id }).sort({ date: -1 });
    return res.status(200).json({ success: true, message: 'ROI history fetched successfully.', data: { history } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to fetch ROI history.' });
  }
};

const getReferralHistory = async (req, res) => {
  try {
    const referralHistory = await ReferralIncome.find({ receiver: req.user._id }).sort({ date: -1 });
    return res.status(200).json({ success: true, message: 'Referral history fetched successfully.', data: { referralHistory } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to fetch referral history.' });
  }
};

const triggerManualROI = async (req, res) => {
  try {
    const processed = await processDailyROI({ manualRun: true });
    return res.status(200).json({ success: true, message: 'Daily ROI processed successfully.', data: { processed } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to process daily ROI.' });
  }
};

module.exports = { createInvestment, getInvestmentById, getInvestments, getROIHistory, getReferralHistory, triggerManualROI };
