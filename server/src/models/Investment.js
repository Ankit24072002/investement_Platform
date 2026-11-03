const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    planName: {
      type: String,
      trim: true,
      default: '',
    },
    planDetails: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    dailyROI: {
      type: Number,
      required: true,
      min: 0,
    },
    dailyROIPercentage: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    totalROIGenerated: {
      type: Number,
      default: 0,
    },
    referralPayoutProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

investmentSchema.index({ userId: 1, status: 1 });
investmentSchema.index({ endDate: 1, status: 1 });

investmentSchema.pre('save', function syncInvestmentFields(next) {
  if (!this.user && this.userId) {
    this.user = this.userId;
  }
  if (!this.dailyROIPercentage && this.dailyROI) {
    this.dailyROIPercentage = this.dailyROI;
  }
  if (!this.planName && this.planDetails) {
    this.planName = this.planDetails;
  }
  next();
});

module.exports = mongoose.model('Investment', investmentSchema);
