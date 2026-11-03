const express = require('express');
const { getROIHistory } = require('../controllers/roiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/history', getROIHistory);

module.exports = router;
