const watchlistService = require('../services/watchlistService');

class WatchlistController {
  /**
   * POST /watchlists
   */
  async createWatchlist(req, res) {
    try {
      const { name } = req.body;
      const result = await watchlistService.createWatchlist(req.userId, name);

      return res.status(201).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        error: error.message || 'Failed to create watchlist',
      });
    }
  }

  /**
   * GET /watchlists
   * Contract: returns [{ id, name, symbolCount }]
   */
  async getWatchlists(req, res) {
    try {
      const result = await watchlistService.getWatchlists(req.userId);

      // Return array directly matching frontend contract: [{ id, name, symbolCount }]
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        error: error.message || 'Failed to fetch watchlists',
      });
    }
  }

  /**
   * GET /watchlists/:id/live
   */
  async getLiveWatchlist(req, res) {
    try {
      const result = await watchlistService.getLiveWatchlist(req.userId, req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        error: error.message || 'Failed to fetch live watchlist data',
      });
    }
  }

  /**
   * GET /watchlists/:id/diff
   */
  async getWatchlistDiff(req, res) {
    try {
      const result = await watchlistService.getWatchlistDiff(req.userId, req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        error: error.message || 'Failed to fetch watchlist diff',
      });
    }
  }

  /**
   * POST /watchlists/:id/diff/mark-checked
   */
  async markWatchlistChecked(req, res) {
    try {
      const result = await watchlistService.markWatchlistChecked(req.userId, req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        error: error.message || 'Failed to mark watchlist as checked',
      });
    }
  }

  /**
   * POST /watchlists/:id/symbols
   */
  async addSymbol(req, res) {
    try {
      const { id } = req.params;
      const { symbol } = req.body;

      const result = await watchlistService.addSymbol(req.userId, id, symbol);

      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        error: error.message || 'Failed to add symbol to watchlist',
      });
    }
  }

  /**
   * DELETE /watchlists/:id/symbols/:symbol
   */
  async removeSymbol(req, res) {
    try {
      const { id, symbol } = req.params;

      const result = await watchlistService.removeSymbol(req.userId, id, symbol);

      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        error: error.message || 'Failed to remove symbol from watchlist',
      });
    }
  }

  /**
   * DELETE /watchlists/:id
   */
  async deleteWatchlist(req, res) {
    try {
      const { id } = req.params;

      const result = await watchlistService.deleteWatchlist(req.userId, id);

      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        error: error.message || 'Failed to delete watchlist',
      });
    }
  }
}

module.exports = new WatchlistController();

