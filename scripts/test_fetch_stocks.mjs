// Test d'intégration de fetch_stocks.mjs avec un réseau simulé :
// scanner TradingView (source principale), repli Yahoo pour les manquants,
// tolérance aux pannes et format du JSON produit.
import { readFileSync } from 'node:fs';

function metricsFor(sym, bullish) {
  const base = 50 + (sym.length * 7) % 200;
  return bullish
    ? [base, 1.4, 2e6, 58, base * 0.97, base * 0.93, 1.1, 0.7, 2.5, 7, 1.4e6, 1e6]
    : [base, -2.1, 8e5, 31, base * 1.04, base * 1.08, -1.2, -0.4, -4, -11, 7e5, 1e6];
}

// Yahoo : historique façon v8 chart pour le repli.
function fakeChart(seed) {
  let price = 60 + seed * 3;
  const close = [], volume = [], timestamp = [];
  const start = Math.floor(Date.now() / 1000) - 250 * 86400;
  let s = seed;
  const rand = () => { s = (s * 16807 + 13) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 250; i++) {
    timestamp.push(start + i * 86400);
    if (i % 53 === 17) { close.push(null); volume.push(null); continue; }
    price = Math.max(1, price * (1.0008 + (rand() - 0.5) * 0.02));
    close.push(price);
    volume.push(Math.round(1e6 * (0.5 + rand())));
  }
  return { chart: { result: [{ meta: { currency: 'EUR' }, timestamp, indicators: { quote: [{ close, volume }] } }] } };
}

let scanCalls = 0, yahooCalls = 0;
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (u.includes('scanner.tradingview.com')) {
    scanCalls++;
    const market = u.match(/scanner\.tradingview\.com\/([^/]+)\/scan/)[1];
    // Panne simulée : le scan "germany" échoue entièrement (SAP → repli Yahoo).
    if (market === 'germany') return { ok: false, status: 500, json: async () => ({}) };
    const tickers = JSON.parse(opts.body).symbols.tickers;
    // Panne simulée : BNP absent de la réponse france (→ repli Yahoo).
    const data = tickers
      .filter(t => t !== 'EURONEXT:BNP')
      .map((t, i) => ({ s: t, d: metricsFor(t, i % 3 !== 0) }));
    return { ok: true, status: 200, json: async () => ({ totalCount: data.length, data }) };
  }
  if (u.includes('finance.yahoo.com')) {
    yahooCalls++;
    const sym = decodeURIComponent(u.match(/chart\/([^?]+)/)[1]);
    // SAP passe par Yahoo avec succès ; BNP échoue partout (testé indisponible).
    if (sym === 'BNP.PA') return { ok: false, status: 429, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => fakeChart(sym.length + sym.charCodeAt(0)) };
  }
  throw new Error('URL inattendue : ' + u);
};

await import('./fetch_stocks.mjs');

const out = JSON.parse(readFileSync('data/stocks.json', 'utf8'));
let failures = 0;
const check = (name, cond, detail = '') => {
  if (cond) console.log(`  ✔ ${name}`);
  else { failures++; console.error(`  ✘ ${name} ${detail}`); }
};

console.log('\n— Vérification du JSON produit —');
check('updatedAt présent', !!out.updatedAt);
check('29 actions OK (30 - BNP indisponible partout)', out.stocks.length === 29, `(=${out.stocks.length})`);
check('SAP récupéré via le repli Yahoo', out.stocks.some(s => s.symbol === 'SAP'));
check('1 erreur signalée (BNP)', out.errors.length === 1 && out.errors[0] === 'BNP.PA', `(=${JSON.stringify(out.errors)})`);
check('tri par score décroissant', out.stocks.every((s, i, a) => !i || a[i - 1].score >= s.score));
check('scores bornés', out.stocks.every(s => s.score >= 0 && s.score <= 100));
check('prix positifs', out.stocks.every(s => s.price > 0));
check('signaux valides', out.stocks.every(s => ['STRONG_BUY', 'BUY', 'WATCH', 'AVOID'].includes(s.signal.code)));
check('devises correctes (€ pour FR/EU)', out.stocks.filter(s => s.market === 'FR' || s.market === 'EU').every(s => s.cur === '€'));
check('source mentionne TradingView', /TradingView/.test(out.source));
check('4 marchés scannés (avec retries pour germany)', scanCalls >= 4, `(=${scanCalls})`);
check('repli Yahoo sollicité', yahooCalls >= 2, `(=${yahooCalls})`);

if (failures) process.exit(1);
console.log('\nPipeline actions validé ✅');
