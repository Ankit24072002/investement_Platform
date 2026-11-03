const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/investment-platform';

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const ensureDefaultAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim();
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  if (!adminEmail || !adminPassword) {
    return;
  }

  try {
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!existingAdmin) {
      const adminUser = await User.create({
        fullName: 'System Admin',
        email: adminEmail.toLowerCase(),
        mobileNumber: '0000000000',
        password: await bcrypt.hash(adminPassword, 10),
        referralCode: `ADMIN-${Date.now().toString().slice(-6)}`,
        role: 'admin',
        accountStatus: 'active',
      });
      console.log(`Default admin user created: ${adminUser.email}`);
      return;
    }

    if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      await existingAdmin.save();
    }
  } catch (error) {
    console.error('Default admin seeding failed:', error.message);
  }
};

module.exports = { connectDB, ensureDefaultAdmin };
