const symbolContext = {
  AAPL: { companyName: 'Apple Inc.', averageVolume: 52000000, volatilityBaseline: 0.018 },
  AMD: { companyName: 'Advanced Micro Devices, Inc.', averageVolume: 38000000, volatilityBaseline: 0.028 },
  ARM: { companyName: 'Arm Holdings plc', averageVolume: 14000000, volatilityBaseline: 0.032 },
  ASML: { companyName: 'ASML Holding N.V.', averageVolume: 2900000, volatilityBaseline: 0.022 },
  MSFT: { companyName: 'Microsoft Corporation', averageVolume: 21000000, volatilityBaseline: 0.016 },
  NVDA: { companyName: 'NVIDIA Corporation', averageVolume: 48000000, volatilityBaseline: 0.026 },
  PLTR: { companyName: 'Palantir Technologies Inc.', averageVolume: 72000000, volatilityBaseline: 0.038 },
  TSM: { companyName: 'Taiwan Semiconductor Manufacturing Company', averageVolume: 18000000, volatilityBaseline: 0.024 },
};

const fallbackContext = {
  companyName: 'Unknown company',
  averageVolume: 10000000,
  volatilityBaseline: 0.025,
};

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getSymbolContext(symbol) {
  return symbolContext[symbol] || fallbackContext;
}

function calculateAttentionScore(quote, historicalContext = {}) {
  const symbol = String(quote.symbol || '').toUpperCase();
  const defaults = getSymbolContext(symbol);
  const averageVolume = historicalContext.averageVolume || defaults.averageVolume;
  const volatilityBaseline = historicalContext.volatilityBaseline || defaults.volatilityBaseline;
  const volumeRatio = historicalContext.volumeRatio
    ?? (Number.isFinite(quote.volume) ? quote.volume / averageVolume : 1);
  const changePct = historicalContext.changePct ?? Number(quote.changePct || 0);
  const absoluteChange = Math.abs(changePct) / 100;

  const volumeScore = clamp((volumeRatio - 1) * 25 + 50, 0, 100);
  const priceScore = clamp((absoluteChange / volatilityBaseline) * 50, 0, 100);
  const attentionScore = Math.round(clamp(volumeScore * 0.45 + priceScore * 0.4 + (absoluteChange >= volatilityBaseline ? 100 : 20) * 0.15, 0, 100));
  const tags = [];

  if (volumeRatio >= 1.5) tags.push('Volume');
  if (absoluteChange >= volatilityBaseline * 1.5) tags.push('Breakout');
  if (absoluteChange >= volatilityBaseline) tags.push('Volatility');
  if (changePct < 0 && tags.length > 0) tags.push('Downside');

  const whyParts = [];
  if (volumeRatio >= 1.5) whyParts.push(`${volumeRatio.toFixed(1)}x average volume`);
  if (absoluteChange >= volatilityBaseline) whyParts.push(`${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}% price move`);
  if (whyParts.length === 0) whyParts.push('Trading within normal volume and volatility ranges');

  return {
    attentionScore,
    why: whyParts.join('; '),
    tags,
    volumeRatio: Number(volumeRatio.toFixed(2)),
    changePct: Number(changePct.toFixed(2)),
    companyName: defaults.companyName,
  };
}

module.exports = {
  calculateAttentionScore,
  getSymbolContext,
  symbolContext,
};