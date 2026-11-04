const express = require('express');
const { query } = require('express-validator');
const { getDashboard, getDashboardSummary, getROIChart, getEarningsBreakdown, getEarningsTrend } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(protect);
router.get('/', getDashboard);
router.get('/summary', getDashboardSummary);
router.get('/roi-chart', getROIChart);
router.get('/earnings', getEarningsBreakdown);
router.get('/earnings-trend', query('days').optional().isInt({ min: 7, max: 90 }), validateRequest, getEarningsTrend);

module.exports = router;
