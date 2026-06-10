// Récupère l'historique des actions via l'API Yahoo Finance (gratuite, sans clé),
// calcule les indicateurs et écrit data/stocks.json.
// Exécuté par GitHub Actions à intervalle régulier.
import { writeFileSync, mkdirSync } from 'node:fs';
import { computeScore, signalFromScore } from '../indicators.js';

const TICKERS = [
  // Mégacaps US
  { sym: 'AAPL', name: 'Apple', market: 'US' },
  { sym: 'MSFT', name: 'Microsoft', market: 'US' },
  { sym: 'NVDA', name: 'NVIDIA', market: 'US' },
  { sym: 'GOOGL', name: 'Alphabet', market: 'US' },
  { sym: 'AMZN', name: 'Amazon', market: 'US' },
  { sym: 'META', name: 'Meta', market: 'US' },
  { sym: 'TSLA', name: 'Tesla', market: 'US' },
  { sym: 'AMD', name: 'AMD', market: 'US' },
  { sym: 'AVGO', name: 'Broadcom', market: 'US' },
  { sym: 'NFLX', name: 'Netflix', market: 'US' },
  { sym: 'JPM', name: 'JPMorgan', market: 'US' },
  { sym: 'V', name: 'Visa', market: 'US' },
  { sym: 'LLY', name: 'Eli Lilly', market: 'US' },
  { sym: 'XOM', name: 'ExxonMobil', market: 'US' },
  { sym: 'CRM', name: 'Salesforce', market: 'US' },
  { sym: 'PLTR', name: 'Palantir', market: 'US' },
  { sym: 'UBER', name: 'Uber', market: 'US' },
  { sym: 'COIN', name: 'Coinbase', market: 'US' },
  // ETF
  { sym: 'SPY', name: 'S&P 500 (ETF SPY)', market: 'ETF' },
  { sym: 'QQQ', name: 'Nasdaq 100 (ETF QQQ)', market: 'ETF' },
  // Europe / France
  { sym: 'MC.PA', name: 'LVMH', market: 'FR' },
  { sym: 'OR.PA', name: "L'Oréal", market: 'FR' },
  { sym: 'TTE.PA', name: 'TotalEnergies', market: 'FR' },
  { sym: 'AIR.PA', name: 'Airbus', market: 'FR' },
  { sym: 'SU.PA', name: 'Schneider Electric', market: 'FR' },
  { sym: 'AI.PA', name: 'Air Liquide', market: 'FR' },
  { sym: 'SAN.PA', name: 'Sanofi', market: 'FR' },
  { sym: 'BNP.PA', name: 'BNP Paribas', market: 'FR' },
  { sym: 'ASML.AS', name: 'ASML', market: 'EU' },
  { sym: 'SAP.DE', name: 'SAP', market: 'EU' },
];

const HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
const CUR_SYMBOL = { USD: '$', EUR: '€', GBP: '£', GBp: 'p', CHF: 'CHF ' };

async function fetchChart(sym, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const host = HOSTS[i % HOSTS.length];
    const url = `https://${host}/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
      });
      if (res.ok) {
        const j = await res.json();
        const r = j?.chart?.result?.[0];
        if (r?.timestamp?.length) return r;
        console.warn(`  Réponse vide pour ${sym}`);
      } else {
        console.warn(`  HTTP ${res.status} (${host}) pour ${sym}`);
      }
    } catch (e) {
      console.warn(`  Erreur réseau ${sym} (${i + 1}/${tries}): ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1500 * (i + 1)));
  }
  return null;
}

function extractSeries(r) {
  const q = r.indicators?.quote?.[0];
  if (!q?.close) return null;
  const closes = [], volumes = [], stamps = [];
  for (let i = 0; i < q.close.length; i++) {
    const c = q.close[i];
    if (!Number.isFinite(c)) continue; // jours fériés / trous
    closes.push(c);
    volumes.push(Number.isFinite(q.volume?.[i]) ? q.volume[i] : 0);
    stamps.push(r.timestamp[i]);
  }
  return closes.length >= 60 ? { closes, volumes, stamps } : null;
}

const results = [];
const errors = [];

for (const t of TICKERS) {
  const chart = await fetchChart(t.sym);
  const hist = chart ? extractSeries(chart) : null;
  if (!hist) {
    errors.push(t.sym);
    console.warn(`✘ ${t.sym}: données indisponibles`);
    continue;
  }
  const a = computeScore({ closes: hist.closes, volumes: hist.volumes });
  const last = hist.closes[hist.closes.length - 1];
  const prev = hist.closes[hist.closes.length - 2];
  const currency = chart.meta?.currency || (t.market === 'FR' || t.market === 'EU' ? 'EUR' : 'USD');
  results.push({
    symbol: t.sym.split('.')[0],
    name: t.name,
    market: t.market,
    cur: CUR_SYMBOL[currency] || '$',
    price: Math.round(last * 100) / 100,
    changePct: Math.round(((last - prev) / prev) * 10000) / 100,
    lastDate: new Date(hist.stamps[hist.stamps.length - 1] * 1000).toISOString().slice(0, 10),
    score: a.score,
    signal: signalFromScore(a.score),
    rsi: a.rsi, mom7: a.mom7, mom30: a.mom30,
    volRatio: a.volRatio,
    macdHist: a.macdHist === null ? null : Math.round(a.macdHist * 10000) / 10000,
    spark: hist.closes.slice(-40).map(v => Math.round(v * 100) / 100),
  });
  console.log(`✔ ${t.name}: ${last.toFixed(2)} (score ${a.score})`);
  await new Promise(r => setTimeout(r, 400)); // politesse envers l'API
}

results.sort((a, b) => b.score - a.score);

if (results.length < 5) {
  console.error(`Trop peu de données récupérées (${results.length}) — on conserve l'ancien fichier.`);
  process.exit(1);
}

mkdirSync('data', { recursive: true });
writeFileSync('data/stocks.json', JSON.stringify({
  updatedAt: new Date().toISOString(),
  source: 'Yahoo Finance (cours différés ~15 min)',
  count: results.length,
  errors,
  stocks: results,
}, null, 1));

console.log(`\n${results.length} actions analysées, ${errors.length} indisponibles → data/stocks.json`);
