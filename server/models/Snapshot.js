const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    watchlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Watchlist',
      required: [true, 'Watchlist ID is required'],
      index: true,
    },
    symbol: {
      type: String,
      required: [true, 'Symbol is required'],
      uppercase: true,
      trim: true,
    },
    priceAtSnapshot: {
      type: Number,
      required: [true, 'Price at snapshot is required'],
      min: [0.000001, 'Price at snapshot must be greater than zero'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

// Index to query historical snapshots for diff calculations
snapshotSchema.index({ watchlistId: 1, symbol: 1, timestamp: -1 });

module.exports = mongoose.model('Snapshot', snapshotSchema);

