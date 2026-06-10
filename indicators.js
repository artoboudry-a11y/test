// Bibliothèque d'indicateurs techniques — module partagé navigateur / Node.
// Toutes les fonctions prennent des tableaux de nombres (du plus ancien au plus récent).

export function sma(values, period) {
  if (values.length < period) return null;
  let sum = 0;
  for (let i = values.length - period; i < values.length; i++) sum += values[i];
  return sum / period;
}

export function emaSeries(values, period) {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const out = [];
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out.push(prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export function ema(values, period) {
  const s = emaSeries(values, period);
  return s.length ? s[s.length - 1] : null;
}

// RSI de Wilder sur `period` périodes (classique : 14).
export function rsi(values, period = 14) {
  if (values.length < period + 1) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgGain = gain / period, avgLoss = loss / period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

// MACD (12/26/9) : retourne { macd, signal, histogram } ou null.
export function macd(values, fast = 12, slow = 26, signalP = 9) {
  if (values.length < slow + signalP) return null;
  const fastS = emaSeries(values, fast);
  const slowS = emaSeries(values, slow);
  const offset = fastS.length - slowS.length;
  const macdLine = slowS.map((v, i) => fastS[i + offset] - v);
  const signalS = emaSeries(macdLine, signalP);
  const m = macdLine[macdLine.length - 1];
  const s = signalS[signalS.length - 1];
  return { macd: m, signal: s, histogram: m - s };
}

// Variation en % entre la dernière valeur et celle d'il y a `lookback` périodes.
export function momentum(values, lookback) {
  if (values.length <= lookback) return null;
  const past = values[values.length - 1 - lookback];
  if (!past) return null;
  return ((values[values.length - 1] - past) / past) * 100;
}

// Ratio volume récent / volume moyen (signal d'intérêt de la foule).
export function volumeRatio(volumes, recent = 5, base = 20) {
  if (volumes.length < base + recent) return null;
  const r = volumes.slice(-recent).reduce((a, b) => a + b, 0) / recent;
  const b = volumes.slice(-(base + recent), -recent).reduce((a, b2) => a + b2, 0) / base;
  if (!b) return null;
  return r / b;
}

// Score composite 0–100 combinant tendance, momentum, RSI, MACD et volume.
// Philosophie : suivre la tendance confirmée, éviter le surachat extrême.
export function computeScore({ closes, volumes }) {
  const parts = [];
  const r = rsi(closes, 14);
  const m = macd(closes);
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const mom7 = momentum(closes, Math.min(7, closes.length - 1));
  const mom30 = momentum(closes, Math.min(30, closes.length - 1));
  const vr = volumes ? volumeRatio(volumes) : null;
  const last = closes[closes.length - 1];

  // Tendance (30 pts) : prix au-dessus des moyennes mobiles, EMA20 > EMA50.
  let trend = 0;
  if (e20 !== null && e50 !== null) {
    if (last > e20) trend += 10;
    if (last > e50) trend += 8;
    if (e20 > e50) trend += 12;
  }
  parts.push({ label: 'Tendance', pts: trend, max: 30 });

  // Momentum (25 pts) : progression récente sans excès.
  let momPts = 0;
  if (mom7 !== null) momPts += Math.max(0, Math.min(13, mom7 * 1.6 + 5));
  if (mom30 !== null) momPts += Math.max(0, Math.min(12, mom30 * 0.5 + 4));
  parts.push({ label: 'Momentum', pts: Math.round(momPts), max: 25 });

  // RSI (20 pts) : zone saine 45–65 = max ; surachat/survente pénalisés.
  let rsiPts = 0;
  if (r !== null) {
    if (r >= 45 && r <= 65) rsiPts = 20;
    else if (r > 65 && r <= 75) rsiPts = 12;
    else if (r >= 35 && r < 45) rsiPts = 10;
    else if (r > 75) rsiPts = 3;
    else rsiPts = 5;
  }
  parts.push({ label: 'RSI', pts: rsiPts, max: 20 });

  // MACD (15 pts) : histogramme positif et croissant = signal haussier.
  let macdPts = 0;
  if (m !== null) {
    if (m.histogram > 0) macdPts += 9;
    if (m.macd > 0) macdPts += 6;
  }
  parts.push({ label: 'MACD', pts: macdPts, max: 15 });

  // Volume (10 pts) : la foule entre sur le titre.
  let volPts = 0;
  if (vr !== null) volPts = Math.max(0, Math.min(10, (vr - 0.8) * 12));
  parts.push({ label: 'Volume', pts: Math.round(volPts), max: 10 });

  const score = Math.round(Math.max(0, Math.min(100,
    trend + momPts + rsiPts + macdPts + volPts)));

  return {
    score,
    rsi: r === null ? null : Math.round(r * 10) / 10,
    macdHist: m === null ? null : m.histogram,
    ema20: e20, ema50: e50,
    mom7: mom7 === null ? null : Math.round(mom7 * 100) / 100,
    mom30: mom30 === null ? null : Math.round(mom30 * 100) / 100,
    volRatio: vr === null ? null : Math.round(vr * 100) / 100,
    parts,
  };
}

export function signalFromScore(score) {
  if (score >= 70) return { code: 'STRONG_BUY', label: 'ACHAT FORT' };
  if (score >= 55) return { code: 'BUY', label: 'ACHAT' };
  if (score >= 40) return { code: 'WATCH', label: 'SURVEILLER' };
  return { code: 'AVOID', label: 'ÉVITER' };
}
