const mongoose = require('mongoose');

const cronLockSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('CronLock', cronLockSchema);
