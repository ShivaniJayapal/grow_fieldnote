const marketDataService = require('../services/marketData');

class QuoteController {
  /**
   * GET /quotes/:symbol
   * Returns cached or freshly fetched normalized quote:
   * { symbol, price, volume, timestamp, source }
   */
  async getQuote(req, res) {
    try {
      const { symbol } = req.params;
      const quote = await marketDataService.getQuote(symbol);

      return res.status(200).json(quote);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        error: error.message || 'Failed to fetch quote',
      });
    }
  }
}

module.exports = new QuoteController();
