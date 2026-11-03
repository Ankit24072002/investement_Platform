const express = require('express');
const {
  createInvestment,
  getInvestments,
  getROIHistory,
  getReferralHistory,
  triggerManualROI,
} = require('../controllers/investmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/', createInvestment);
router.get('/', getInvestments);
router.get('/roi-history', getROIHistory);
router.get('/referral-history', getReferralHistory);
router.post('/process-roi', triggerManualROI);

module.exports = router;
