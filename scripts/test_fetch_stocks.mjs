// Test d'intégration de fetch_stocks.mjs avec un réseau simulé :
// vérifie parsing CSV, scoring, tolérance aux pannes et format du JSON produit.
import { readFileSync } from 'node:fs';

// Génère un historique CSV façon stooq (300 jours, marche aléatoire haussière).
function fakeCsv(seed, drift) {
  let price = 50 + seed * 7;
  const rows = ['Date,Open,High,Low,Close,Volume'];
  const start = Date.now() - 300 * 86400e3;
  let s = seed;
  const rand = () => { s = (s * 16807 + 13) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 300; i++) {
    const date = new Date(start + i * 86400e3).toISOString().slice(0, 10);
    price = Math.max(1, price * (1 + drift + (rand() - 0.5) * 0.03));
    const vol = Math.round(1e6 * (0.5 + rand()));
    rows.push(`${date},${(price * 0.99).toFixed(2)},${(price * 1.01).toFixed(2)},${(price * 0.98).toFixed(2)},${price.toFixed(2)},${vol}`);
  }
  return rows.join('\n');
}

let calls = 0;
globalThis.fetch = async (url) => {
  calls++;
  const sym = new URL(url).searchParams.get('s');
  // Simule 2 tickers en panne pour tester la tolérance aux erreurs.
  if (sym === 'sap.de') return { ok: false, status: 404 };
  if (sym === 'bnp.fr') throw new Error('ECONNRESET simulé');
  const drift = sym.charCodeAt(0) % 3 === 0 ? 0.002 : (sym.charCodeAt(1) % 2 ? 0.0005 : -0.002);
  return { ok: true, text: async () => fakeCsv(sym.length + sym.charCodeAt(0), drift) };
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
check('retries effectués sur les pannes', calls > 30);

if (failures) process.exit(1);
console.log('\nPipeline actions validé ✅');
