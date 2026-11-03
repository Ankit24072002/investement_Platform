const express = require('express');
const { getDirectReferrals, getCompleteReferralTree } = require('../controllers/referralController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/direct', getDirectReferrals);
router.get('/tree', getCompleteReferralTree);

module.exports = router;
