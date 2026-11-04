const express = require('express');
const { query } = require('express-validator');
const { getReferralSummary, getDirectReferrals, getCompleteReferralTree, getReferralIncome } = require('../controllers/referralController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(protect);
router.get('/summary', getReferralSummary);
router.get('/direct', [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })], validateRequest, getDirectReferrals);
router.get('/tree', getCompleteReferralTree);
router.get('/income', getReferralIncome);

module.exports = router;
