const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
      default: undefined,
    },
    mobileNumber: {
      type: String,
      trim: true,
      default: undefined,
    },
    password: {
      type: String,
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    totalROIEarned: {
      type: Number,
      default: 0,
    },
    totalROI: {
      type: Number,
      default: 0,
    },
    totalLevelIncomeEarned: {
      type: Number,
      default: 0,
    },
    totalLevelIncome: {
      type: Number,
      default: 0,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'inactive'],
      default: 'active',
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ referredBy: 1, accountStatus: 1 });
userSchema.index(
  { mobile: 1 },
  { unique: true, partialFilterExpression: { mobile: { $type: 'string', $gt: '' } } }
);
userSchema.index(
  { mobileNumber: 1 },
  { unique: true, partialFilterExpression: { mobileNumber: { $type: 'string', $gt: '' } } }
);

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password') && !/^\$2[aby]\$/.test(this.password)) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.pre('save', function syncFinancialFields(next) {
  const totalROIValue = Number(this.totalROIEarned || this.totalROI || 0);
  const totalLevelValue = Number(this.totalLevelIncomeEarned || this.totalLevelIncome || 0);

  this.totalROIEarned = Number(totalROIValue.toFixed(2));
  this.totalROI = this.totalROIEarned;
  this.totalLevelIncomeEarned = Number(totalLevelValue.toFixed(2));
  this.totalLevelIncome = this.totalLevelIncomeEarned;

  if (!this.mobileNumber && this.mobile) {
    this.mobileNumber = this.mobile;
  }

  next();
});

module.exports = mongoose.model('User', userSchema);
