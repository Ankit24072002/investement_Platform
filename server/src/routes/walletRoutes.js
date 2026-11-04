const express = require('express');
const { query } = require('express-validator');
const { getWalletSummary, getWalletTransactions } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(protect);
router.get('/', getWalletSummary);
router.get(
  '/transactions',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['ROI', 'REFERRAL', 'INVESTMENT', 'WITHDRAWAL', 'ADJUSTMENT']),
    query('status').optional().isIn(['pending', 'success', 'failed']),
    query('sortBy').optional().isIn(['createdAt', 'amount']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
  validateRequest,
  getWalletTransactions
);

module.exports = router;
