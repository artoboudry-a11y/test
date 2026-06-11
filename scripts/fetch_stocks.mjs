// Récupère les données actions via le scanner TradingView (source principale,
// indicateurs pré-calculés, 1 requête par marché) avec repli sur l'API chart
// de Yahoo Finance, puis écrit data/stocks.json.
// Exécuté par GitHub Actions à intervalle régulier.
// Politique d'échec : on n'écrase jamais le fichier existant et on sort en
// succès, pour ne pas bloquer le déploiement de l'appli.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { computeScore, computeScoreFromMetrics, signalFromScore } from '../indicators.js';

const TICKERS = [
  // Mégacaps US
  { tv: 'NASDAQ:AAPL', y: 'AAPL', name: 'Apple', market: 'US', scan: 'america' },
  { tv: 'NASDAQ:MSFT', y: 'MSFT', name: 'Microsoft', market: 'US', scan: 'america' },
  { tv: 'NASDAQ:NVDA', y: 'NVDA', name: 'NVIDIA', market: 'US', scan: 'america' },
  { tv: 'NASDAQ:GOOGL', y: 'GOOGL', name: 'Alphabet', market: 'US', scan: 'america' },
  { tv: 'NASDAQ:AMZN', y: 'AMZN', name: 'Amazon', market: 'US', scan: 'america' },
  { tv: 'NASDAQ:META', y: 'META', name: 'Meta', market: 'US', scan: 'america' },
  { tv: 'NASDAQ:TSLA', y: 'TSLA', name: 'Tesla', market: 'US', scan: 'america' },
  { tv: 'NASDAQ:AMD', y: 'AMD', name: 'AMD', market: 'US', scan: 'america' },
  { tv: 'NASDAQ:AVGO', y: 'AVGO', name: 'Broadcom', market: 'US', scan: 'america' },
  { tv: 'NASDAQ:NFLX', y: 'NFLX', name: 'Netflix', market: 'US', scan: 'america' },
  { tv: 'NYSE:JPM', y: 'JPM', name: 'JPMorgan', market: 'US', scan: 'america' },
  { tv: 'NYSE:V', y: 'V', name: 'Visa', market: 'US', scan: 'america' },
  { tv: 'NYSE:LLY', y: 'LLY', name: 'Eli Lilly', market: 'US', scan: 'america' },
  { tv: 'NYSE:XOM', y: 'XOM', name: 'ExxonMobil', market: 'US', scan: 'america' },
  { tv: 'NYSE:CRM', y: 'CRM', name: 'Salesforce', market: 'US', scan: 'america' },
  { tv: 'NASDAQ:PLTR', y: 'PLTR', name: 'Palantir', market: 'US', scan: 'america' },
  { tv: 'NYSE:UBER', y: 'UBER', name: 'Uber', market: 'US', scan: 'america' },
  { tv: 'NASDAQ:COIN', y: 'COIN', name: 'Coinbase', market: 'US', scan: 'america' },
  // ETF
  { tv: 'AMEX:SPY', y: 'SPY', name: 'S&P 500 (ETF SPY)', market: 'ETF', scan: 'america' },
  { tv: 'NASDAQ:QQQ', y: 'QQQ', name: 'Nasdaq 100 (ETF QQQ)', market: 'ETF', scan: 'america' },
  // Europe / France
  { tv: 'EURONEXT:MC', y: 'MC.PA', name: 'LVMH', market: 'FR', scan: 'france' },
  { tv: 'EURONEXT:OR', y: 'OR.PA', name: "L'Oréal", market: 'FR', scan: 'france' },
  { tv: 'EURONEXT:TTE', y: 'TTE.PA', name: 'TotalEnergies', market: 'FR', scan: 'france' },
  { tv: 'EURONEXT:AIR', y: 'AIR.PA', name: 'Airbus', market: 'FR', scan: 'france' },
  { tv: 'EURONEXT:SU', y: 'SU.PA', name: 'Schneider Electric', market: 'FR', scan: 'france' },
  { tv: 'EURONEXT:AI', y: 'AI.PA', name: 'Air Liquide', market: 'FR', scan: 'france' },
  { tv: 'EURONEXT:SAN', y: 'SAN.PA', name: 'Sanofi', market: 'FR', scan: 'france' },
  { tv: 'EURONEXT:BNP', y: 'BNP.PA', name: 'BNP Paribas', market: 'FR', scan: 'france' },
  { tv: 'EURONEXT:ASML', y: 'ASML.AS', name: 'ASML', market: 'EU', scan: 'netherlands' },
  { tv: 'XETR:SAP', y: 'SAP.DE', name: 'SAP', market: 'EU', scan: 'germany' },
];

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const COLUMNS = ['close', 'change', 'volume', 'RSI', 'EMA20', 'EMA50',
  'MACD.macd', 'MACD.signal', 'Perf.W', 'Perf.1M',
  'average_volume_10d_calc', 'average_volume_30d_calc'];

function curFor(market) { return market === 'FR' || market === 'EU' ? '€' : '$'; }

// --- Source principale : scanner TradingView ---
async function scanTradingView(scan, tickers, tries = 3) {
  const body = JSON.stringify({
    symbols: { tickers: tickers.map(t => t.tv), query: { types: [] } },
    columns: COLUMNS,
  });
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`https://scanner.tradingview.com/${scan}/scan`, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
        body,
      });
      if (res.ok) return (await res.json()).data || [];
      console.warn(`  TradingView ${scan}: HTTP ${res.status}`);
    } catch (e) {
      console.warn(`  TradingView ${scan} (${i + 1}/${tries}): ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 2000 * (i + 1)));
  }
  return null;
}

async function fromTradingView() {
  const byScan = new Map();
  for (const t of TICKERS) {
    if (!byScan.has(t.scan)) byScan.set(t.scan, []);
    byScan.get(t.scan).push(t);
  }
  const results = [];
  for (const [scan, tickers] of byScan) {
    const rows = await scanTradingView(scan, tickers);
    if (!rows) continue;
    const bySym = new Map(rows.map(r => [r.s, r.d]));
    for (const t of tickers) {
      const d = bySym.get(t.tv);
      if (!d) { console.warn(`✘ ${t.tv}: absent de la réponse`); continue; }
      const [close, change, volume, rsi, ema20, ema50, macd, macdSignal,
        perfW, perf1M, avgVol10, avgVol30] = d;
      if (!Number.isFinite(close)) continue;
      const a = computeScoreFromMetrics({
        price: close, ema20, ema50, rsi, macd, macdSignal,
        perfW, perf1M, volume, avgVol10, avgVol30,
      });
      results.push({
        symbol: t.tv.split(':')[1], name: t.name, market: t.market, cur: curFor(t.market),
        price: Math.round(close * 100) / 100,
        changePct: Number.isFinite(change) ? Math.round(change * 100) / 100 : null,
        lastDate: new Date().toISOString().slice(0, 10),
        score: a.score, signal: signalFromScore(a.score),
        rsi: a.rsi, mom7: a.mom7, mom30: a.mom30, volRatio: a.volRatio,
        macdHist: a.macdHist === null ? null : Math.round(a.macdHist * 10000) / 10000,
      });
      console.log(`✔ ${t.name}: ${close.toFixed(2)} (score ${a.score}) [TradingView]`);
    }
    await new Promise(r => setTimeout(r, 800));
  }
  return results;
}

// --- Repli : API chart Yahoo Finance ---
async function fetchYahooChart(sym, tries = 2) {
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
  for (let i = 0; i < tries; i++) {
    const url = `https://${hosts[i % hosts.length]}/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.ok) {
        const r = (await res.json())?.chart?.result?.[0];
        if (r?.timestamp?.length) return r;
      } else {
        console.warn(`  Yahoo HTTP ${res.status} pour ${sym}`);
      }
    } catch (e) {
      console.warn(`  Yahoo ${sym}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1500 * (i + 1)));
  }
  return null;
}

async function fromYahoo(tickers) {
  const results = [];
  for (const t of tickers) {
    const chart = await fetchYahooChart(t.y);
    const q = chart?.indicators?.quote?.[0];
    if (!q?.close) { console.warn(`✘ ${t.y}: indisponible (Yahoo)`); continue; }
    const closes = [], volumes = [];
    for (let i = 0; i < q.close.length; i++) {
      if (!Number.isFinite(q.close[i])) continue;
      closes.push(q.close[i]);
      volumes.push(Number.isFinite(q.volume?.[i]) ? q.volume[i] : 0);
    }
    if (closes.length < 60) continue;
    const a = computeScore({ closes, volumes });
    const last = closes[closes.length - 1], prev = closes[closes.length - 2];
    results.push({
      symbol: t.y.split('.')[0], name: t.name, market: t.market, cur: curFor(t.market),
      price: Math.round(last * 100) / 100,
      changePct: Math.round(((last - prev) / prev) * 10000) / 100,
      lastDate: new Date().toISOString().slice(0, 10),
      score: a.score, signal: signalFromScore(a.score),
      rsi: a.rsi, mom7: a.mom7, mom30: a.mom30, volRatio: a.volRatio,
      macdHist: a.macdHist === null ? null : Math.round(a.macdHist * 10000) / 10000,
      spark: closes.slice(-40).map(v => Math.round(v * 100) / 100),
    });
    console.log(`✔ ${t.name}: ${last.toFixed(2)} (score ${a.score}) [Yahoo]`);
    await new Promise(r => setTimeout(r, 400));
  }
  return results;
}

// --- Orchestration ---
let results = await fromTradingView();
let source = 'TradingView (cours différés ~15 min)';
const got = new Set(results.map(r => r.symbol));
const missing = TICKERS.filter(t => !got.has(t.tv.split(':')[1]));

if (results.length < 5) {
  console.warn(`TradingView insuffisant (${results.length}) — repli complet sur Yahoo Finance.`);
  results = await fromYahoo(TICKERS);
  source = 'Yahoo Finance (cours différés ~15 min)';
} else if (missing.length) {
  console.warn(`${missing.length} titre(s) manquant(s) via TradingView — complément Yahoo.`);
  results = results.concat(await fromYahoo(missing));
}

results.sort((a, b) => b.score - a.score);
const errors = TICKERS.map(t => t.y).filter(y => !results.some(r => r.symbol === y.split('.')[0]));

if (results.length < 5) {
  console.error(`Trop peu de données récupérées (${results.length}) — on conserve l'ancien fichier et on n'échoue pas le déploiement.`);
  process.exit(0);
}

mkdirSync('data', { recursive: true });
writeFileSync('data/stocks.json', JSON.stringify({
  updatedAt: new Date().toISOString(),
  source,
  count: results.length,
  errors,
  stocks: results,
}, null, 1));

console.log(`\n${results.length} actions analysées, ${errors.length} indisponibles → data/stocks.json`);

// --- Historique des signaux : archive quotidienne + performance mesurée ---
const HIST = 'data/history.json';
let hist = { days: {} };
if (existsSync(HIST)) {
  try { hist = JSON.parse(readFileSync(HIST, 'utf8')); } catch { hist = { days: {} }; }
}
if (!hist.days) hist.days = {};
const today = new Date().toISOString().slice(0, 10);
hist.days[today] = results.map(r => ({ s: r.symbol, sc: r.score, sig: r.signal.code, p: r.price }));
let keys = Object.keys(hist.days).sort();
while (keys.length > 90) delete hist.days[keys.shift()]; // 90 jours conservés

const priceNow = new Map(results.map(r => [r.symbol, r.price]));
const perf = {};
for (const [label, days] of Object.entries({ '1j': 1, '7j': 7, '30j': 30 })) {
  const target = new Date(Date.now() - days * 86400e3).toISOString().slice(0, 10);
  const key = keys.filter(k => k <= target).pop();
  if (!key) continue;
  const groups = {};
  for (const e of hist.days[key]) {
    const now = priceNow.get(e.s);
    if (!Number.isFinite(now) || !e.p) continue;
    (groups[e.sig] ??= []).push((now / e.p - 1) * 100);
  }
  if (!Object.keys(groups).length) continue;
  perf[label] = Object.fromEntries(Object.entries(groups).map(([sig, arr]) => [sig, {
    avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 100) / 100,
    n: arr.length,
    winRate: Math.round(arr.filter(r => r > 0).length / arr.length * 100),
  }]));
  perf[label].since = key;
}
hist.performance = perf;
hist.updatedAt = new Date().toISOString();
writeFileSync(HIST, JSON.stringify(hist));
console.log(`Historique des signaux : ${Object.keys(hist.days).length} jour(s) archivé(s), horizons mesurés : ${Object.keys(perf).join(', ') || 'aucun (archive trop récente)'}`);
