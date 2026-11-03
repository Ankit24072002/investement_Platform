const mongoose = require('mongoose');

const roiHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    investmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      required: true,
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
      enum: ['credited', 'pending', 'cancelled'],
      default: 'credited',
      index: true,
    },
  },
  { timestamps: true }
);

roiHistorySchema.index({ userId: 1, investmentId: 1, date: 1 }, { unique: true });
roiHistorySchema.index({ investmentId: 1, date: 1 });

module.exports = mongoose.model('ROIHistory', roiHistorySchema);
