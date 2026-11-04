const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createInvestment,
  getAvailablePlans,
  getInvestmentById,
  getInvestments,
  getROIHistory,
  getReferralHistory,
} = require('../controllers/investmentController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(protect);
router.get('/plans', getAvailablePlans);
router.post(
  '/',
  [body('amount').isFloat({ gt: 0 }), body('planId').isString().trim().notEmpty()],
  validateRequest,
  createInvestment
);
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'completed', 'cancelled']),
    query('sortBy').optional().isIn(['createdAt', 'startDate', 'endDate', 'amount', 'status']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
  validateRequest,
  getInvestments
);
router.get('/roi-history', getROIHistory);
router.get('/referral-history', getReferralHistory);
router.get('/:id', param('id').isMongoId(), validateRequest, getInvestmentById);

module.exports = router;
