const express = require('express');
const { getDashboard, getDashboardSummary, getROIChart, getEarningsBreakdown } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getDashboard);
router.get('/summary', getDashboardSummary);
router.get('/roi-chart', getROIChart);
router.get('/earnings', getEarningsBreakdown);

module.exports = router;
