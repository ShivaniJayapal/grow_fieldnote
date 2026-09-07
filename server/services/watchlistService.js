const mongoose = require('mongoose');
const Watchlist = require('../models/Watchlist');
const Snapshot = require('../models/Snapshot');
const redis = require('../config/redis');
const marketDataService = require('./marketData');
const { calculateAttentionScore } = require('./attentionScore');

class WatchlistService {
  /**
   * Helper to validate and convert ObjectId
   */
  isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
  }

  /**
   * Helper to validate symbol format (1-5 alphabetical characters)
   */
  validateSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      const err = new Error('Symbol must be a string of 1 to 5 alphabetic characters');
      err.statusCode = 400;
      throw err;
    }

    const clean = symbol.trim().toUpperCase();
    const symbolRegex = /^[A-Z]{1,5}$/;

    if (!symbolRegex.test(clean)) {
      const err = new Error(`Invalid symbol '${symbol}'. Symbol must be 1 to 5 letters (e.g. AAPL, NVDA)`);
      err.statusCode = 400;
      throw err;
    }

    return clean;
  }

  /**
   * Synchronize active_symbols Redis set from all existing watchlists in MongoDB
   */
  async syncActiveSymbols() {
    try {
      const allSymbols = await Watchlist.distinct('symbols');
      await redis.del('active_symbols');
      if (allSymbols && allSymbols.length > 0) {
        await redis.sadd('active_symbols', ...allSymbols);
        console.log(`[Redis] Synced ${allSymbols.length} active symbols into 'active_symbols' set.`);
      }
      return allSymbols || [];
    } catch (err) {
      console.warn('[Redis] Warning syncing active_symbols:', err.message);
      return [];
    }
  }

  /**
   * Create a new watchlist for the user
   */
  async createWatchlist(userId, name) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      const err = new Error('Watchlist name is required');
      err.statusCode = 400;
      throw err;
    }

    const cleanName = name.trim();
    if (cleanName.length > 50) {
      const err = new Error('Watchlist name cannot exceed 50 characters');
      err.statusCode = 400;
      throw err;
    }

    // Check for duplicate name under this user
    const existing = await Watchlist.findOne({
      userId,
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
    });

    if (existing) {
      const err = new Error(`A watchlist named '${cleanName}' already exists`);
      err.statusCode = 400;
      throw err;
    }

    const watchlist = await Watchlist.create({
      userId,
      name: cleanName,
      symbols: [],
    });

    return {
      id: watchlist._id.toString(),
      name: watchlist.name,
      symbols: watchlist.symbols,
      symbolCount: 0,
      createdAt: watchlist.createdAt,
    };
  }

  /**
   * Get all watchlists belonging to the user formatted for frontend contract:
   * GET /watchlists -> [{ id, name, symbolCount }]
   */
  async getWatchlists(userId) {
    const watchlists = await Watchlist.find({ userId }).sort({ createdAt: -1 });

    return watchlists.map((w) => ({
      id: w._id.toString(),
      name: w.name,
      symbolCount: Array.isArray(w.symbols) ? w.symbols.length : 0,
    }));
  }

  async getLiveWatchlist(userId, watchlistId) {
    if (!this.isValidObjectId(watchlistId)) {
      const error = new Error('Watchlist not found (invalid ID format)');
      error.statusCode = 404;
      throw error;
    }

    const watchlist = await Watchlist.findById(watchlistId);
    if (!watchlist) {
      const error = new Error('Watchlist not found');
      error.statusCode = 404;
      throw error;
    }

    if (watchlist.userId.toString() !== userId.toString()) {
      const error = new Error('Forbidden: You do not have permission to view this watchlist');
      error.statusCode = 403;
      throw error;
    }

    return Promise.all(watchlist.symbols.map(async (symbol) => {
      const quote = await marketDataService.getQuote(symbol);
      const score = calculateAttentionScore(quote);
      const timestamp = Date.parse(quote.cachedAt || quote.timestamp);
      const dataStatus = Number.isFinite(timestamp) && Date.now() - timestamp <= 90000 ? 'live' : 'delayed';

      return {
        symbol,
        companyName: score.companyName,
        price: quote.price,
        changePct: score.changePct,
        updatedAt: quote.cachedAt || quote.timestamp,
        volumeRatio: score.volumeRatio,
        attentionScore: score.attentionScore,
        why: score.why,
        tags: score.tags,
        dataStatus,
      };
    }));
  }

  async getWatchlistDiff(userId, watchlistId) {
    if (!this.isValidObjectId(watchlistId)) {
      const error = new Error('Watchlist not found (invalid ID format)');
      error.statusCode = 404;
      throw error;
    }

    const watchlist = await Watchlist.findById(watchlistId);
    if (!watchlist) {
      const error = new Error('Watchlist not found');
      error.statusCode = 404;
      throw error;
    }

    if (watchlist.userId.toString() !== userId.toString()) {
      const error = new Error('Forbidden: You do not have permission to view this watchlist');
      error.statusCode = 403;
      throw error;
    }

    const results = [];

    for (const symbol of watchlist.symbols) {
      const quote = await marketDataService.getQuote(symbol);
      const previousSnapshot = await Snapshot.findOne({ userId, watchlistId, symbol }).sort({ timestamp: -1 });
      const priceAtLastCheck = previousSnapshot ? previousSnapshot.priceAtSnapshot : null;
      const hasValidCurrentPrice = Number.isFinite(quote.price) && quote.price > 0;
      const hasValidSnapshotPrice = Number.isFinite(priceAtLastCheck) && priceAtLastCheck > 0;

      if (!hasValidCurrentPrice) {
        const error = new Error(`No valid current price available for ${symbol}`);
        error.statusCode = 502;
        throw error;
      }

      const changeAbs = hasValidSnapshotPrice ? quote.price - priceAtLastCheck : 0;
      const changePct = hasValidSnapshotPrice ? (changeAbs / priceAtLastCheck) * 100 : 0;
      const roundedChangePct = Number(changePct.toFixed(2));
      const roundedChangeAbs = Number(changeAbs.toFixed(2));

      console.info('[Diff] comparison', {
        symbol,
        priceAtSnapshot: previousSnapshot?.priceAtSnapshot ?? null,
        snapshotTimestamp: previousSnapshot?.timestamp ?? null,
        priceNow: quote.price,
        quoteCachedAt: quote.cachedAt ?? null,
        changePct: roundedChangePct,
      });

      const score = calculateAttentionScore(quote, { changePct });
      const flagged = Boolean(previousSnapshot && changePct !== 0 && score.attentionScore >= 60);
      const why = previousSnapshot
        ? roundedChangePct === 0
          ? 'No price movement since your last check'
          : `${symbol} moved ${roundedChangePct >= 0 ? 'up' : 'down'} ${Math.abs(roundedChangePct).toFixed(2)}% since your last check`
        : 'First time tracking this symbol';

      results.push({
        symbol,
        companyName: score.companyName,
        priceAtLastCheck,
        priceNow: quote.price,
        changePct: roundedChangePct,
        changeAbs: roundedChangeAbs,
        why,
        tags: previousSnapshot && roundedChangePct !== 0 ? score.tags : [],
        flagged,
        lastCheckedAt: previousSnapshot ? previousSnapshot.timestamp : null,
        attentionScore: score.attentionScore,
        dataStatus: Date.now() - Date.parse(quote.cachedAt || quote.timestamp) <= 90000 ? 'live' : 'delayed',
      });
    }

    return results;
  }

  async markWatchlistChecked(userId, watchlistId) {
    if (!this.isValidObjectId(watchlistId)) {
      const error = new Error('Watchlist not found (invalid ID format)');
      error.statusCode = 404;
      throw error;
    }

    const watchlist = await Watchlist.findById(watchlistId);
    if (!watchlist) {
      const error = new Error('Watchlist not found');
      error.statusCode = 404;
      throw error;
    }

    if (watchlist.userId.toString() !== userId.toString()) {
      const error = new Error('Forbidden: You do not have permission to update this watchlist');
      error.statusCode = 403;
      throw error;
    }

    const quotes = await Promise.all(watchlist.symbols.map((symbol) => marketDataService.getQuote(symbol)));
    const timestamp = new Date();
    for (const quote of quotes) {
      if (!Number.isFinite(quote.price) || quote.price <= 0) {
        const error = new Error(`Cannot save an invalid price for ${quote.symbol}`);
        error.statusCode = 502;
        throw error;
      }

      console.info('[Diff] writing snapshot', {
        symbol: quote.symbol,
        priceAtSnapshot: quote.price,
        timestamp,
        quoteCachedAt: quote.cachedAt ?? null,
      });
    }

    await Snapshot.insertMany(quotes.map((quote) => ({
      userId,
      watchlistId,
      symbol: quote.symbol,
      priceAtSnapshot: quote.price,
      timestamp,
    })));

    return { lastCheckedAt: timestamp.toISOString(), symbolCount: quotes.length };
  }

  /**
   * Add a symbol to a watchlist and register with active_symbols Redis set
   */
  async addSymbol(userId, watchlistId, rawSymbol) {
    if (!this.isValidObjectId(watchlistId)) {
      const err = new Error('Watchlist not found (invalid ID format)');
      err.statusCode = 404;
      throw err;
    }

    const cleanSymbol = this.validateSymbol(rawSymbol);

    const watchlist = await Watchlist.findById(watchlistId);
    if (!watchlist) {
      const err = new Error('Watchlist not found');
      err.statusCode = 404;
      throw err;
    }

    // Authorization check: Must belong to requesting user
    if (watchlist.userId.toString() !== userId.toString()) {
      const err = new Error('Forbidden: You do not have permission to modify this watchlist');
      err.statusCode = 403;
      throw err;
    }

    // Duplicate check within that watchlist
    if (watchlist.symbols.includes(cleanSymbol)) {
      const err = new Error(`Symbol '${cleanSymbol}' is already in this watchlist`);
      err.statusCode = 400;
      throw err;
    }

    watchlist.symbols.push(cleanSymbol);
    await watchlist.save();

    // Track symbol in active_symbols Redis set
    try {
      await redis.sadd('active_symbols', cleanSymbol);
    } catch (err) {
      console.warn(`[Redis] Failed to add ${cleanSymbol} to active_symbols:`, err.message);
    }

    return {
      id: watchlist._id.toString(),
      name: watchlist.name,
      symbol: cleanSymbol,
      symbols: watchlist.symbols,
      symbolCount: watchlist.symbols.length,
    };
  }

  /**
   * Remove a symbol from a watchlist and update active_symbols Redis set
   */
  async removeSymbol(userId, watchlistId, rawSymbol) {
    if (!this.isValidObjectId(watchlistId)) {
      const err = new Error('Watchlist not found (invalid ID format)');
      err.statusCode = 404;
      throw err;
    }

    const cleanSymbol = rawSymbol.trim().toUpperCase();

    const watchlist = await Watchlist.findById(watchlistId);
    if (!watchlist) {
      const err = new Error('Watchlist not found');
      err.statusCode = 404;
      throw err;
    }

    // Authorization check
    if (watchlist.userId.toString() !== userId.toString()) {
      const err = new Error('Forbidden: You do not have permission to modify this watchlist');
      err.statusCode = 403;
      throw err;
    }

    if (!watchlist.symbols.includes(cleanSymbol)) {
      const err = new Error(`Symbol '${cleanSymbol}' is not present in this watchlist`);
      err.statusCode = 404;
      throw err;
    }

    watchlist.symbols = watchlist.symbols.filter((s) => s !== cleanSymbol);
    await watchlist.save();

    // Check if this symbol is still used by any other watchlist
    try {
      const stillInUse = await Watchlist.exists({ symbols: cleanSymbol });
      if (!stillInUse) {
        await redis.srem('active_symbols', cleanSymbol);
      }
    } catch (err) {
      console.warn(`[Redis] Failed to update active_symbols for ${cleanSymbol}:`, err.message);
    }

    return {
      message: `Symbol '${cleanSymbol}' removed successfully`,
      id: watchlist._id.toString(),
      symbols: watchlist.symbols,
      symbolCount: watchlist.symbols.length,
    };
  }

  /**
   * Delete an entire watchlist, associated snapshots, and clean up active_symbols
   */
  async deleteWatchlist(userId, watchlistId) {
    if (!this.isValidObjectId(watchlistId)) {
      const err = new Error('Watchlist not found (invalid ID format)');
      err.statusCode = 404;
      throw err;
    }

    const watchlist = await Watchlist.findById(watchlistId);
    if (!watchlist) {
      const err = new Error('Watchlist not found');
      err.statusCode = 404;
      throw err;
    }

    // Authorization check
    if (watchlist.userId.toString() !== userId.toString()) {
      const err = new Error('Forbidden: You do not have permission to delete this watchlist');
      err.statusCode = 403;
      throw err;
    }

    const symbolsToCheck = [...(watchlist.symbols || [])];

    await Watchlist.findByIdAndDelete(watchlistId);
    await Snapshot.deleteMany({ watchlistId });

    // Clean up active_symbols set for any symbols no longer in any watchlist
    try {
      for (const sym of symbolsToCheck) {
        const stillInUse = await Watchlist.exists({ symbols: sym });
        if (!stillInUse) {
          await redis.srem('active_symbols', sym);
        }
      }
    } catch (err) {
      console.warn('[Redis] Failed to clean active_symbols on watchlist deletion:', err.message);
    }

    return {
      message: `Watchlist '${watchlist.name}' deleted successfully`,
      id: watchlistId,
    };
  }
}

module.exports = new WatchlistService();
