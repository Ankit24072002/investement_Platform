const express = require('express');
const { getUsers, getInvestments, runManualROI } = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(requireRole('admin'));

router.get('/users', getUsers);
router.get('/investments', getInvestments);
router.post('/roi/run', runManualROI);

module.exports = router;
