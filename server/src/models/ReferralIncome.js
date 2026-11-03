const mongoose = require('mongoose');

const referralIncomeSchema = new mongoose.Schema(
  {
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    investment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      default: null,
      index: true,
    },
    investmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      default: null,
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'credited', 'failed'],
      default: 'credited',
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

referralIncomeSchema.index({ receiver: 1, generatedBy: 1, investmentId: 1, level: 1 }, { unique: true, sparse: true });
referralIncomeSchema.index({ userId: 1, referredUserId: 1, level: 1, date: 1 });

referralIncomeSchema.pre('save', function syncFields(next) {
  if (!this.receiver && this.userId) {
    this.receiver = this.userId;
  }
  if (!this.userId && this.receiver) {
    this.userId = this.receiver;
  }
  if (!this.referredUserId && this.generatedBy) {
    this.referredUserId = this.generatedBy;
  }
  if (!this.investmentId && this.investment) {
    this.investmentId = this.investment;
  }
  next();
});

module.exports = mongoose.model('ReferralIncome', referralIncomeSchema);
