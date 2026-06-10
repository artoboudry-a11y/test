// Test d'intégration de fetch_stocks.mjs avec un réseau simulé :
// vérifie parsing CSV, scoring, tolérance aux pannes et format du JSON produit.
import { readFileSync } from 'node:fs';

// Génère une réponse façon Yahoo Finance v8 (250 séances, marche aléatoire),
// avec des trous (null) comme les vrais jours fériés.
function fakeChart(seed, drift, currency) {
  let price = 50 + seed * 7;
  const close = [], volume = [], timestamp = [];
  const start = Math.floor(Date.now() / 1000) - 250 * 86400;
  let s = seed;
  const rand = () => { s = (s * 16807 + 13) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 250; i++) {
    timestamp.push(start + i * 86400);
    if (i % 47 === 13) { close.push(null); volume.push(null); continue; } // jour férié
    price = Math.max(1, price * (1 + drift + (rand() - 0.5) * 0.03));
    close.push(price);
    volume.push(Math.round(1e6 * (0.5 + rand())));
  }
  return {
    chart: {
      result: [{ meta: { currency }, timestamp, indicators: { quote: [{ close, volume }] } }],
      error: null,
    },
  };
}

let calls = 0;
globalThis.fetch = async (url) => {
  calls++;
  const sym = decodeURIComponent(String(url).match(/chart\/([^?]+)/)[1]);
  // Simule 2 tickers en panne pour tester la tolérance aux erreurs.
  if (sym === 'SAP.DE') return { ok: false, status: 404 };
  if (sym === 'BNP.PA') throw new Error('ECONNRESET simulé');
  const drift = sym.charCodeAt(0) % 3 === 0 ? 0.002 : (sym.charCodeAt(1) % 2 ? 0.0005 : -0.002);
  const currency = sym.includes('.PA') || sym.includes('.AS') ? 'EUR' : 'USD';
  return { ok: true, json: async () => fakeChart(sym.length + sym.charCodeAt(0), drift, currency) };
};

await import('./fetch_stocks.mjs');

const out = JSON.parse(readFileSync('data/stocks.json', 'utf8'));
let failures = 0;
const check = (name, cond) => {
  if (cond) console.log(`  ✔ ${name}`);
  else { failures++; console.error(`  ✘ ${name}`); }
};

console.log('\n— Vérification du JSON produit —');
check('updatedAt présent', !!out.updatedAt);
check('28 actions OK (30 - 2 simulées en panne)', out.stocks.length === 28);
check('2 erreurs signalées', out.errors.length === 2);
check('tri par score décroissant', out.stocks.every((s, i, a) => !i || a[i - 1].score >= s.score));
check('scores bornés', out.stocks.every(s => s.score >= 0 && s.score <= 100));
check('prix positifs', out.stocks.every(s => s.price > 0));
check('sparkline de 40 points', out.stocks.every(s => s.spark.length === 40));
check('signaux valides', out.stocks.every(s => ['STRONG_BUY', 'BUY', 'WATCH', 'AVOID'].includes(s.signal.code)));
check('devises correctes (€ pour Paris/Amsterdam)', out.stocks.filter(s => s.market === 'FR').every(s => s.cur === '€'));
check('retries effectués sur les pannes', calls > 30);

if (failures) process.exit(1);
console.log('\nPipeline actions validé ✅');
