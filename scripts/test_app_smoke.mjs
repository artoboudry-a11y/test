// Test de fumée de app.js : exécute l'appli complète dans un mini-DOM simulé
// avec un réseau factice, et vérifie que chaque section se remplit sans erreur.
import { readFileSync } from 'node:fs';

// --- Mini-DOM ---
class El {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.value = '';
    this.textContent = '';
    this._innerHTML = '';
    this._classes = new Set();
    this.width = 0; this.height = 0;
  }
  get classList() {
    const c = this._classes;
    return {
      add: (...n) => n.forEach(x => c.add(x)),
      remove: (...n) => n.forEach(x => c.delete(x)),
      toggle: (n, force) => { (force ?? !c.has(n)) ? c.add(n) : c.delete(n); },
      contains: (n) => c.has(n),
    };
  }
  set className(v) { this._classes = new Set(v.split(/\s+/).filter(Boolean)); }
  get className() { return [...this._classes].join(' '); }
  set innerHTML(v) { this._innerHTML = v; this.children = []; }
  get innerHTML() { return this._innerHTML; }
  appendChild(el) { this.children.push(el); return el; }
  addEventListener() {}
  remove() {}
  querySelector(sel) {
    if (sel === 'canvas') return Object.assign(new El('canvas'), {
      getContext: () => new Proxy({}, { get: () => () => {} }),
    });
    return new El();
  }
  querySelectorAll() { return []; }
  getContext() { return new Proxy({}, { get: () => () => {} }); }
}

const byId = new Map();
const doc = {
  querySelector: (sel) => {
    if (!byId.has(sel)) byId.set(sel, new El());
    return byId.get(sel);
  },
  querySelectorAll: () => [],
  createElement: (tag) => {
    const el = new El(tag);
    if (tag === 'canvas') el.getContext = () => new Proxy({}, { get: () => () => {} });
    return el;
  },
  addEventListener: () => {},
  visibilityState: 'visible',
};

// --- Réseau factice ---
function fakeKlines(n = 120) {
  const out = [];
  let p = 100;
  for (let i = 0; i < n; i++) {
    p *= 1 + (Math.sin(i / 5) * 0.01 + 0.001);
    out.push([0, p, p, p, String(p), 0, 0, String(1000 + i)]);
  }
  return out;
}
const FAIL_BINANCE = !!process.env.FAIL_BINANCE; // simule un réseau où Binance est bloqué
let fetchCalls = [];
globalThis.fetch = async (url) => {
  fetchCalls.push(String(url));
  const u = String(url);
  const ok = (body) => ({ ok: true, status: 200, json: async () => body });
  if (FAIL_BINANCE && u.includes('binance.com')) return { ok: false, status: 451, json: async () => ({}) };
  if (u.includes('ticker/24hr')) {
    const syms = JSON.parse(decodeURIComponent(u.split('symbols=')[1]));
    return ok(syms.map(s => ({ symbol: s, lastPrice: '123.45', priceChangePercent: '2.5', count: '50000' })));
  }
  if (u.includes('/klines')) return ok(fakeKlines());
  if (u.includes('search/trending')) {
    return ok({ coins: Array.from({ length: 10 }, (_, i) => ({
      item: { name: `Coin${i}`, symbol: `C${i}`, small: '', market_cap_rank: i + 1, data: { price: 1.5 } },
    })) });
  }
  if (u.includes('alternative.me')) return ok({ data: [{ value: '54', value_classification: 'Neutral' }] });
  if (u.includes('history.json')) {
    return ok({ updatedAt: 'x', days: {}, performance: {
      '7j': { since: '2026-06-04', STRONG_BUY: { avg: 4.2, n: 8, winRate: 75 }, AVOID: { avg: -1.1, n: 5, winRate: 40 } },
    } });
  }
  if (u.includes('stocks.json')) return ok(JSON.parse(readFileSync('data/stocks.json', 'utf8')));
  if (u.includes('coins/markets')) {
    const ids = new URL(u).searchParams.get('ids').split(',');
    let p = 1;
    return ok(ids.map(id => ({
      id, symbol: id.slice(0, 3), name: id, current_price: (p += 3),
      price_change_percentage_24h: 1.2,
      sparkline_in_7d: { price: fakeKlines(168).map(k => parseFloat(k[4])) },
    })));
  }
  throw new Error('URL inattendue : ' + u);
};

// --- Globals navigateur ---
globalThis.document = doc;
globalThis.window = { devicePixelRatio: 1 };
globalThis.location = { protocol: 'https:', origin: 'https://example.test' };
Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
globalThis.WebSocket = class { constructor() { this.wsCreated = true; } close() {} };
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
};
// En mode nominal, une alerte pré-chargée doit se déclencher dès le premier cours.
if (!FAIL_BINANCE) {
  store.set('tradepilot_v1', JSON.stringify({
    capital: 10, goal: 10000, rate: 1,
    trades: [{ asset: 'BTC', amount: 10, buyPrice: 100, date: '11/06/2026' }],
    alerts: [{ id: 1, symbol: 'BTC', dir: 'above', price: 1 }],
  }));
}
globalThis.setInterval = () => 0;

let unhandled = null;
process.on('unhandledRejection', (e) => { unhandled = e; });

await import('../app.js');
await new Promise(r => setTimeout(r, 300)); // laisse les promesses se résoudre

let failures = 0;
const check = (name, cond, detail = '') => {
  if (cond) console.log(`  ✔ ${name}`);
  else { failures++; console.error(`  ✘ ${name} ${detail}`); }
};

console.log('— Vérifications après exécution complète —');
const crypto = byId.get('#crypto-list');
check('liste crypto remplie (24 actifs)', crypto.children.length === 24, `(=${crypto.children.length})`);
check('cartes triées par score décroissant', (() => {
  const scores = crypto.children.map(c => Number((c.innerHTML.match(/· (\d+)<\/span>/) || [])[1]));
  return scores.every((s, i) => Number.isFinite(s) && (!i || scores[i - 1] >= s));
})());
check('badges de signal présents', crypto.children.every(c => /ACHAT|SURVEILLER|ÉVITER/.test(c.innerHTML)));
check('décomposition de la note affichée', crypto.children.every(c => /score-parts/.test(c.innerHTML) && /Tendance/.test(c.innerHTML)));
check('bouton plan d’action sur chaque carte', crypto.children.every(c => /plan-open/.test(c.innerHTML)));
const stocks = byId.get('#stocks-list');
check('liste actions remplie', stocks.children.length >= 20, `(=${stocks.children.length})`);
check('méta actions renseignée', /Dernière analyse/.test(byId.get('#stocks-meta').textContent));
const trends = byId.get('#trends-list');
check('tendances remplies (10)', trends.children.length === 10, `(=${trends.children.length})`);
check('indice Peur & Avidité affiché', /54/.test(byId.get('#fng').innerHTML));
check('projection objectif calculée', /jours/.test(byId.get('#goal-projection').innerHTML));
check('barre de progression initialisée', byId.get('#progress-fill').style.width !== undefined);
check('mesure de progression réelle initialisée', /progression réelle|Croissance réelle/.test(byId.get('#real-progress').innerHTML));
check('journal de capital : premier point enregistré', (JSON.parse(store.get('tradepilot_v1')).capitalLog || []).length === 1);
if (FAIL_BINANCE) {
  check('repli CoinGecko signalé à l’utilisateur', /CoinGecko/.test(byId.get('#banner').textContent));
  check('statut indique la source de repli', /CoinGecko/.test(byId.get('#status-line').textContent));
} else {
  check('alerte pré-chargée déclenchée (bannière info)', /Alerte : BTC a dépassé 1/.test(byId.get('#banner').textContent));
  const saved = JSON.parse(store.get('tradepilot_v1'));
  check('alerte marquée déclenchée et persistée', saved.alerts[0].hit && Number.isFinite(saved.alerts[0].hit.price));
  check('liste des alertes rendue avec statut', byId.get('#alert-list').children.length === 1);
  check('position valorisée en direct (+23 %)', /12[,.]3[45].*\+23[,.]4/.test(byId.get('#trade-list').children[0]?.innerHTML || ''));
  check('total du portefeuille affiché avec plus-value', /\+2[,.]3[45] €/.test(byId.get('#positions-total').innerHTML));
}
const radar = byId.get('#radar-list');
check('radar rempli (6 opportunités)', radar.children.length === 6, `(=${radar.children.length})`);
check('explications en clair présentes', radar.children.every(c => /(Tendance|RSI|MACD|Momentum|tendance)/.test(c.innerHTML)));
check('niveau de risque affiché', radar.children.every(c => /risk (LOW|MED|HIGH)/.test(c.innerHTML)));
check('mélange crypto + actions dans le radar', (() => {
  const html = radar.children.map(c => c.innerHTML).join('');
  return /CRYPTO/.test(html) || /ACTIONS|ETF/.test(html);
})());
const histCard = byId.get('#history-card');
check('fiabilité des signaux affichée', /ACHAT FORT à 7j/.test(histCard.innerHTML) && /75 % gagnants/.test(histCard.innerHTML));
check('signal perdant affiché honnêtement', /ÉVITER à 7j/.test(histCard.innerHTML) && /-1\.1 %/.test(histCard.innerHTML));
check('aucune promesse non gérée', unhandled === null, unhandled ? `(${unhandled.message})` : '');
check('appels réseau émis', fetchCalls.length >= (FAIL_BINANCE ? 5 : 25), `(=${fetchCalls.length})`);

if (failures) { console.error(`\n${failures} échec(s)`); process.exit(1); }
console.log('\nTest de fumée de l’appli : tout passe ✅');
process.exit(0);
