const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/security');
const { generateReferralCode, validateReferralTarget } = require('../services/businessLogic');

const createToken = (userId) =>
  jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: '7d' });

const sanitizeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  mobileNumber: user.mobileNumber || user.mobile || '',
  referralCode: user.referralCode,
  walletBalance: Number(user.walletBalance || 0),
  totalROIEarned: Number(user.totalROIEarned || user.totalROI || 0),
  totalLevelIncomeEarned: Number(user.totalLevelIncomeEarned || user.totalLevelIncome || 0),
  accountStatus: user.accountStatus,
  role: user.role,
});

const registerUser = async (req, res) => {
  try {
    const { fullName, email, mobileNumber, mobile, password, referralCode } = req.body;

    if (!fullName || !email || !(mobileNumber || mobile) || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, mobile number, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const generatedCode = await generateReferralCode();

    let referredBy = null;
    if (referralCode) {
      const normalizedReferral = String(referralCode).trim().toUpperCase();
      if (normalizedReferral === generatedCode) {
        return res.status(400).json({ success: false, message: 'Self-referrals are not allowed.' });
      }

      const referrer = await User.findOne({ referralCode: normalizedReferral });
      if (!referrer) {
        return res.status(400).json({ success: false, message: 'Invalid referral code.' });
      }
      try {
        await validateReferralTarget(referrer._id, null);
        referredBy = referrer._id;
      } catch (error) {
        return res.status(400).json({ success: false, message: error.message || 'Invalid referral code.' });
      }
    }

    const normalizedMobile = String(mobileNumber || mobile).trim();
    const existingMobile = await User.exists({ mobileNumber: normalizedMobile });
    if (existingMobile) {
      return res.status(409).json({ success: false, message: 'User with this mobile number already exists.' });
    }

    const user = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      mobileNumber: normalizedMobile,
      mobile: normalizedMobile,
      password: hashedPassword,
      referralCode: generatedCode,
      referredBy,
      accountStatus: 'active',
      role: 'user',
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: sanitizeUser(user),
        token: createToken(user._id),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern?.mobileNumber || error.keyValue?.mobileNumber) {
        return res.status(409).json({ success: false, message: 'User with this mobile number already exists.' });
      }
      if (error.keyPattern?.email || error.keyValue?.email) {
        return res.status(409).json({ success: false, message: 'User with this email already exists.' });
      }
      if (error.keyPattern?.referralCode || error.keyValue?.referralCode) {
        return res.status(409).json({ success: false, message: 'Unable to reserve a referral code; please retry registration.' });
      }
    }
    return res.status(500).json({ success: false, message: error.message || 'Unable to register user.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({ success: false, message: 'This account is not active.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token: createToken(user._id),
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to process login.' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(req.user),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to fetch current user.' });
  }
};

const logoutUser = async (req, res) => {
  return res.status(200).json({ success: true, message: 'Logout successful.' });
};

module.exports = { registerUser, loginUser, getCurrentUser, logoutUser, sanitizeUser };
