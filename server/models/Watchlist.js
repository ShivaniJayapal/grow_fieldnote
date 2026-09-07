const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Watchlist name is required'],
      trim: true,
      maxlength: [50, 'Watchlist name cannot exceed 50 characters'],
    },
    symbols: {
      type: [String],
      default: [],
      set: (symbols) => (symbols ? symbols.map((s) => s.toUpperCase().trim()) : []),
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

// Compound index for fast lookup of a user's specific watchlist
watchlistSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Watchlist', watchlistSchema);

