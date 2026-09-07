const cron = require('node-cron');
const redis = require('../config/redis');
const marketDataService = require('./marketData');

let scheduledTask;

async function refreshActiveSymbols() {
  let symbols;
  try {
    symbols = await redis.smembers('active_symbols');
  } catch (error) {
    console.error('[MarketData] Could not read active_symbols from Redis:', error);
    throw error;
  }

  if (!symbols.length) {
    console.warn('[MarketData] Refresh skipped: active_symbols Redis set is empty.');
    return;
  }

  console.log(`[MarketData] Refreshing active symbols: ${symbols.join(', ')}`);

  const results = await Promise.allSettled(
    symbols.map((symbol) => marketDataService.refreshQuote(symbol))
  );
  const failures = results
    .map((result, index) => ({ result, symbol: symbols[index] }))
    .filter(({ result }) => result.status === 'rejected');

  if (failures.length > 0) {
    failures.forEach(({ symbol, result }) => {
      console.error(`[MarketData] Failed to refresh ${symbol}:`, result.reason);
    });
    console.error(`[MarketData] Failed to refresh ${failures.length} of ${symbols.length} active symbols.`);
  } else {
    console.log(`[MarketData] Refreshed ${symbols.length} active symbol${symbols.length === 1 ? '' : 's'}.`);
  }
}

function startQuoteRefreshJob() {
  if (scheduledTask) return scheduledTask;

  scheduledTask = cron.schedule('0 * * * * *', () => {
    refreshActiveSymbols().catch((error) => {
      console.warn('[MarketData] Active symbol refresh failed:', error.message);
    });
  });

  refreshActiveSymbols().catch((error) => {
    console.warn('[MarketData] Initial active symbol refresh failed:', error.message);
  });

  return scheduledTask;
}

module.exports = {
  refreshActiveSymbols,
  startQuoteRefreshJob,
};