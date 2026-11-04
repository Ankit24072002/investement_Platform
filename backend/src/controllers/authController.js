const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateReferralCode } = require('../services/businessLogic');
const { getJwtSecret } = require('../../../server/src/config/security');

const createToken = (userId) =>
  jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: '7d' });

const registerUser = async (req, res) => {
  try {
    const { fullName, email, mobileNumber, password, referralCode } = req.body;

    if (!fullName || !email || !mobileNumber || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let referredBy = null;
    const generatedCode = await generateReferralCode();

    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    const user = await User.create({
      fullName,
      email,
      mobileNumber,
      password: hashedPassword,
      referralCode: generatedCode,
      referredBy,
      accountStatus: 'active',
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        referralCode: user.referralCode,
      },
      token: createToken(user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.status(200).json({
      token: createToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        referralCode: user.referralCode,
        walletBalance: user.walletBalance,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };
