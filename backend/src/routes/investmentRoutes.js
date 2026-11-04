const express = require('express');
const {
  createInvestment,
  getInvestments,
  getROIHistory,
  getReferralHistory,
} = require('../controllers/investmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/', createInvestment);
router.get('/', getInvestments);
router.get('/roi-history', getROIHistory);
router.get('/referral-history', getReferralHistory);
module.exports = router;
