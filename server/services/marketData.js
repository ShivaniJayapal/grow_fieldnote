const redis = require('../config/redis');

class MarketDataService {
  constructor() {
    this.finnhubBaseUrl = 'https://finnhub.io/api/v1';
    this.twelveDataBaseUrl = 'https://api.twelvedata.com';
    this.cacheTTLSeconds = 60; // 60s TTL as requested
  }

  validateSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      const error = new Error('Symbol must be a string of 1 to 5 alphabetic characters');
      error.statusCode = 400;
      throw error;
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    if (!/^[A-Z]{1,5}$/.test(cleanSymbol)) {
      const error = new Error(`Invalid symbol '${symbol}'. Symbol must be 1 to 5 letters (e.g. AAPL, NVDA)`);
      error.statusCode = 400;
      throw error;
    }

    return cleanSymbol;
  }

  async fetchFromFinnhub(symbol, apiKey) {
    const response = await fetch(`${this.finnhubBaseUrl}/quote?symbol=${symbol}&token=${apiKey}`);
    if (!response.ok) {
      throw new Error(`Finnhub HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (!data || typeof data.c !== 'number' || !Number.isFinite(data.c)) {
      throw new Error(`Finnhub returned no price data for symbol: ${symbol}`);
    }

    return {
      symbol,
      price: +data.c.toFixed(2),
      volume: null,
      changePct: typeof data.dp === 'number' ? +data.dp.toFixed(2) : 0,
      timestamp: data.t ? new Date(data.t * 1000).toISOString() : new Date().toISOString(),
      source: 'finnhub',
    };
  }

  /**
   * Fetch quote from Twelve Data API
   */
  async fetchFromTwelveData(symbol, apiKey) {
    const url = `${this.twelveDataBaseUrl}/quote?symbol=${symbol}&apikey=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Twelve Data HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'error' || data.close === undefined) {
      throw new Error(data.message || `Twelve Data returned error for symbol: ${symbol}`);
    }

    const price = Number(data.close);
    if (!Number.isFinite(price)) {
      throw new Error(`Twelve Data returned no price data for symbol: ${symbol}`);
    }

    const parsedChangePct = Number(data.percent_change ?? data.change_percent ?? 0);

    return {
      symbol,
      price: +price.toFixed(2),
      volume: data.volume === undefined ? null : Number(data.volume),
      changePct: Number.isFinite(parsedChangePct) ? +parsedChangePct.toFixed(2) : 0,
      timestamp: data.datetime ? new Date(data.datetime).toISOString() : new Date().toISOString(),
      source: 'twelvedata',
    };
  }

  /**
   * Primary quote reader:
   * 1. Check Redis under key quote:{SYMBOL}
  * 2. On miss: fetch from the configured external provider
   * 3. Cache into Redis with 60s TTL
   * 4. Return normalized { symbol, price, volume, timestamp, source }
   */
  async getQuote(rawSymbol) {
    const symbol = this.validateSymbol(rawSymbol);
    const cacheKey = `quote:${symbol}`;

    // 1. Check Redis Cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn(`[Redis Cache] Error reading key ${cacheKey}:`, err.message);
    }

    // 2. Cache miss: fetch from the configured provider.
    const provider = (process.env.MARKET_DATA_PROVIDER || 'finnhub').toLowerCase();
    const apiKey = provider === 'twelvedata'
      ? process.env.TWELVEDATA_API_KEY
      : process.env.FINNHUB_API_KEY;

    if (!apiKey || apiKey.startsWith('your_')) {
      const error = new Error(`Missing API key for market data provider: ${provider}`);
      error.statusCode = 503;
      throw error;
    }

    let quote;
    try {
      if (provider === 'twelvedata') {
        quote = await this.fetchFromTwelveData(symbol, apiKey);
      } else if (provider === 'finnhub') {
        quote = await this.fetchFromFinnhub(symbol, apiKey);
      } else {
        const error = new Error(`Unsupported market data provider: ${provider}`);
        error.statusCode = 500;
        throw error;
      }
    } catch (err) {
      if (!err.statusCode) err.statusCode = 502;
      throw err;
    }

    // 3. Cache in Redis with 60s TTL. cachedAt tracks refresh time separately
    // from the provider's market timestamp, which may be hours old outside market hours.
    quote.cachedAt = new Date().toISOString();
    try {
      await redis.set(cacheKey, JSON.stringify(quote), 'EX', this.cacheTTLSeconds);
    } catch (err) {
      console.warn(`[Redis Cache] Error saving key ${cacheKey}:`, err.message);
    }

    return quote;
  }

  async refreshQuote(rawSymbol) {
    const symbol = this.validateSymbol(rawSymbol);
    await redis.del(`quote:${symbol}`);
    return this.getQuote(symbol);
  }
}

module.exports = new MarketDataService();
