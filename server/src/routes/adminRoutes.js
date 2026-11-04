const express = require('express');
const { query } = require('express-validator');
const { getUsers, getInvestments, runManualROI } = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(protect);
router.use(requireRole('admin'));

router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().isLength({ max: 100 }),
    query('accountStatus').optional().isIn(['active', 'suspended', 'inactive']),
  ],
  validateRequest,
  getUsers
);
router.get(
  '/investments',
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
router.post('/roi/run', runManualROI);

module.exports = router;
