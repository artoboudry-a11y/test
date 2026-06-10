// Récupère l'historique des actions via stooq.com (gratuit, sans clé),
// calcule les indicateurs et écrit data/stocks.json.
// Exécuté par GitHub Actions à intervalle régulier.
import { writeFileSync, mkdirSync } from 'node:fs';
import { computeScore, signalFromScore } from '../indicators.js';

const TICKERS = [
  // Mégacaps US
  { sym: 'aapl.us', name: 'Apple', market: 'US' },
  { sym: 'msft.us', name: 'Microsoft', market: 'US' },
  { sym: 'nvda.us', name: 'NVIDIA', market: 'US' },
  { sym: 'googl.us', name: 'Alphabet', market: 'US' },
  { sym: 'amzn.us', name: 'Amazon', market: 'US' },
  { sym: 'meta.us', name: 'Meta', market: 'US' },
  { sym: 'tsla.us', name: 'Tesla', market: 'US' },
  { sym: 'amd.us', name: 'AMD', market: 'US' },
  { sym: 'avgo.us', name: 'Broadcom', market: 'US' },
  { sym: 'nflx.us', name: 'Netflix', market: 'US' },
  { sym: 'jpm.us', name: 'JPMorgan', market: 'US' },
  { sym: 'v.us', name: 'Visa', market: 'US' },
  { sym: 'lly.us', name: 'Eli Lilly', market: 'US' },
  { sym: 'xom.us', name: 'ExxonMobil', market: 'US' },
  { sym: 'crm.us', name: 'Salesforce', market: 'US' },
  { sym: 'pltr.us', name: 'Palantir', market: 'US' },
  { sym: 'uber.us', name: 'Uber', market: 'US' },
  { sym: 'coin.us', name: 'Coinbase', market: 'US' },
  // ETF
  { sym: 'spy.us', name: 'S&P 500 (ETF SPY)', market: 'ETF' },
  { sym: 'qqq.us', name: 'Nasdaq 100 (ETF QQQ)', market: 'ETF' },
  // Europe / France
  { sym: 'mc.fr', name: 'LVMH', market: 'FR' },
  { sym: 'or.fr', name: "L'Oréal", market: 'FR' },
  { sym: 'tte.fr', name: 'TotalEnergies', market: 'FR' },
  { sym: 'air.fr', name: 'Airbus', market: 'FR' },
  { sym: 'su.fr', name: 'Schneider Electric', market: 'FR' },
  { sym: 'ai.fr', name: 'Air Liquide', market: 'FR' },
  { sym: 'san.fr', name: 'Sanofi', market: 'FR' },
  { sym: 'bnp.fr', name: 'BNP Paribas', market: 'FR' },
  { sym: 'asml.nl', name: 'ASML', market: 'EU' },
  { sym: 'sap.de', name: 'SAP', market: 'EU' },
];

const since = new Date(Date.now() - 400 * 86400e3).toISOString().slice(0, 10).replace(/-/g, '');

async function fetchWithRetry(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (TradePilot data bot)' } });
      if (res.ok) return await res.text();
      console.warn(`  HTTP ${res.status} pour ${url}`);
    } catch (e) {
      console.warn(`  Erreur réseau (${i + 1}/${tries}): ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1500 * (i + 1)));
  }
  return null;
}

function parseCsv(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 30 || !/^Date,Open/i.test(lines[0])) return null;
  const closes = [], volumes = [], dates = [];
  for (const line of lines.slice(1)) {
    const [date, , , , close, volume] = line.split(',');
    const c = parseFloat(close);
    if (!Number.isFinite(c)) continue;
    dates.push(date);
    closes.push(c);
    volumes.push(parseFloat(volume) || 0);
  }
  return closes.length >= 60 ? { dates, closes, volumes } : null;
}

const results = [];
const errors = [];

for (const t of TICKERS) {
  const url = `https://stooq.com/q/d/l/?s=${t.sym}&i=d&d1=${since}&d2=${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const text = await fetchWithRetry(url);
  const hist = text ? parseCsv(text) : null;
  if (!hist) {
    errors.push(t.sym);
    console.warn(`✘ ${t.sym}: données indisponibles`);
    continue;
  }
  const a = computeScore({ closes: hist.closes, volumes: hist.volumes });
  const last = hist.closes[hist.closes.length - 1];
  const prev = hist.closes[hist.closes.length - 2];
  results.push({
    symbol: t.sym.split('.')[0].toUpperCase(),
    name: t.name,
    market: t.market,
    price: last,
    changePct: Math.round(((last - prev) / prev) * 10000) / 100,
    lastDate: hist.dates[hist.dates.length - 1],
    score: a.score,
    signal: signalFromScore(a.score),
    rsi: a.rsi, mom7: a.mom7, mom30: a.mom30,
    volRatio: a.volRatio,
    macdHist: a.macdHist === null ? null : Math.round(a.macdHist * 10000) / 10000,
    spark: hist.closes.slice(-40),
  });
  console.log(`✔ ${t.name}: ${last} (score ${a.score})`);
  await new Promise(r => setTimeout(r, 400)); // politesse envers stooq
}

results.sort((a, b) => b.score - a.score);

if (results.length < 5) {
  console.error(`Trop peu de données récupérées (${results.length}) — on conserve l'ancien fichier.`);
  process.exit(1);
}

mkdirSync('data', { recursive: true });
writeFileSync('data/stocks.json', JSON.stringify({
  updatedAt: new Date().toISOString(),
  source: 'stooq.com (cours fin de journée / différés)',
  count: results.length,
  errors,
  stocks: results,
}, null, 1));

console.log(`\n${results.length} actions analysées, ${errors.length} indisponibles → data/stocks.json`);
