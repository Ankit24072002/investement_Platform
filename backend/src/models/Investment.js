const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
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

module.exports = mongoose.model('Investment', investmentSchema);
