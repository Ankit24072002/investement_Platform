const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, getCurrentUser, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/register',
  [
    body('fullName').isString().withMessage('Full name must be text.').trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().withMessage('A valid email address is required.').trim(),
    body('mobileNumber').optional({ values: 'falsy' }).isString().trim().isLength({ min: 7, max: 20 }),
    body('mobile').optional({ values: 'falsy' }).isString().trim().isLength({ min: 7, max: 20 }),
    body('password').isString().isLength({ min: 8, max: 128 }),
    body('referralCode').optional({ values: 'falsy' }).isString().trim().isLength({ max: 32 }),
  ],
  validateRequest,
  registerUser
);
router.post(
  '/login',
  [body('email').isEmail().withMessage('A valid email address is required.').trim(), body('password').isString().notEmpty()],
  validateRequest,
  loginUser
);
router.get('/me', protect, getCurrentUser);
router.post('/logout', protect, logoutUser);

module.exports = router;
