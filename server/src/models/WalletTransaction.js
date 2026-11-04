const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: ['ROI', 'REFERRAL', 'INVESTMENT', 'WITHDRAWAL', 'ADJUSTMENT'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceBefore: {
      type: Number,
      required: true,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      default: 0,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referenceModel',
      default: null,
    },
    referenceModel: {
      type: String,
      enum: ['Investment', 'ROIHistory', 'ReferralIncome', 'User', 'WalletTransaction'],
      default: null,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'success',
      index: true,
    },
  },
  { timestamps: true }
);

walletTransactionSchema.pre('save', function syncUserReference(next) {
  if (!this.user && this.userId) this.user = this.userId;
  if (!this.userId && this.user) this.userId = this.user;
  next();
});

walletTransactionSchema.index({ userId: 1, transactionType: 1, createdAt: -1 });
walletTransactionSchema.index({ referenceId: 1, transactionType: 1 }, { sparse: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
