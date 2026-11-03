const express = require('express');
const { getWalletSummary, getWalletTransactions } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getWalletSummary);
router.get('/transactions', getWalletTransactions);

module.exports = router;
