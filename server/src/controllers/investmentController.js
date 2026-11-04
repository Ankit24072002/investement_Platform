const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const ROIHistory = require('../models/ROIHistory');
const ReferralIncome = require('../models/ReferralIncome');
const { awardReferralIncome, runInTransaction, roundMoney } = require('../services/businessLogic');
const { getInvestmentPlans } = require('../config/investmentPlans');

const getAvailablePlans = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Investment plans fetched successfully.',
      data: { plans: getInvestmentPlans() },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load investment plans.' });
  }
};

const createInvestment = async (req, res) => {
  try {
    const { amount, planId } = req.body;
    const numberAmount = Number(amount);
    if (!Number.isFinite(numberAmount) || numberAmount <= 0 || roundMoney(numberAmount) !== numberAmount || !planId) {
      return res.status(400).json({ success: false, message: 'A valid plan and amount with at most two decimal places are required.' });
    }

    const plan = getInvestmentPlans().find((item) => item.id === String(planId));
    if (!plan) {
      return res.status(400).json({ success: false, message: 'The selected investment plan is unavailable.' });
    }

    if (numberAmount < plan.minAmount || numberAmount > plan.maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Amount must be between ${plan.minAmount} and ${plan.maxAmount} for this plan.`,
      });
    }

    const investment = await runInTransaction(async (session) => {
      const startDate = new Date();
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + plan.durationDays - 1);
      const [created] = await Investment.create(
        [
          {
            userId: req.user._id,
            user: req.user._id,
            amount: numberAmount,
            planName: plan.name,
            planDetails: plan.description,
            startDate,
            endDate,
            dailyROI: plan.dailyROIPercentage,
            dailyROIPercentage: plan.dailyROIPercentage,
            status: 'active',
            referralPayoutProcessed: false,
          },
        ],
        { session }
      );

      await awardReferralIncome(req.user._id, numberAmount, created._id, session);
      return created;
    });

    return res.status(201).json({
      success: true,
      message: 'Investment created successfully.',
      data: { investment },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Unable to create investment.' });
  }
};

const getInvestmentById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid investment identifier.' });
    }

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
    const sortFields = new Set(['createdAt', 'startDate', 'endDate', 'amount', 'status']);
    const requestedSort = String(req.query.sortBy || 'createdAt');
    const sortBy = sortFields.has(requestedSort) ? requestedSort : 'createdAt';
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

module.exports = {
  createInvestment,
  getAvailablePlans,
  getInvestmentById,
  getInvestments,
  getROIHistory,
  getReferralHistory,
};
