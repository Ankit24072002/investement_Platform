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
    roiAmount: {
      type: Number,
      min: 0,
      default: 0,
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
    idempotencyKey: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

roiHistorySchema.index({ userId: 1, investmentId: 1, date: 1 }, { unique: true, sparse: true });
roiHistorySchema.index({ investmentId: 1, date: 1 });

roiHistorySchema.pre('save', function syncFields(next) {
  if (!this.roiAmount && this.amount) {
    this.roiAmount = this.amount;
  }
  next();
});

module.exports = mongoose.model('ROIHistory', roiHistorySchema);
