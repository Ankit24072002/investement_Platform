const Investment = require('../models/Investment');
const ROIHistory = require('../models/ROIHistory');
const ReferralIncome = require('../models/ReferralIncome');
const User = require('../models/User');
const { awardReferralIncome } = require('../services/businessLogic');

const createInvestment = async (req, res) => {
  try {
    const { amount, planDetails, startDate, endDate, dailyROI } = req.body;

    if (!amount || !planDetails || !startDate || !endDate || !dailyROI) {
      return res.status(400).json({ message: 'All investment fields are required' });
    }

    const investment = await Investment.create({
      userId: req.user._id,
      amount,
      planDetails,
      startDate,
      endDate,
      dailyROI,
      status: 'active',
      referralPayoutProcessed: false,
    });

    await awardReferralIncome(req.user._id, Number(amount), investment._id);

    return res.status(201).json({
      message: 'Investment created successfully',
      investment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ investments });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getROIHistory = async (req, res) => {
  try {
    const history = await ROIHistory.find({ userId: req.user._id }).sort({ date: -1 });
    return res.status(200).json({ history });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getReferralHistory = async (req, res) => {
  try {
    const referralHistory = await ReferralIncome.find({ userId: req.user._id }).sort({ date: -1 });
    return res.status(200).json({ referralHistory });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const triggerManualROI = async (req, res) => {
  try {
    const { processDailyROI } = require('../services/businessLogic');
    const processed = await processDailyROI();
    return res.status(200).json({ message: 'Daily ROI processed', processed });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createInvestment,
  getInvestments,
  getROIHistory,
  getReferralHistory,
  triggerManualROI,
};
