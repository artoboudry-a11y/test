// Tests unitaires des indicateurs — exécutés en local et en CI.
import { sma, ema, rsi, macd, momentum, volumeRatio, computeScore, computeScoreFromMetrics,
  signalFromScore, volatility, riskLevel, explainFromMetrics, evaluateAlerts, valuePositions,
  filterAssets, pinFavorites, sanitizeImportedStore, buildTradePlan, measureProgress }
  from '../indicators.js';

let failures = 0;
function check(name, cond, detail = '') {
  if (cond) { console.log(`  ✔ ${name}`); }
  else { failures++; console.error(`  ✘ ${name} ${detail}`); }
}
function approx(a, b, tol = 1e-6) { return Math.abs(a - b) <= tol; }

console.log('— SMA / EMA —');
check('sma simple', approx(sma([1, 2, 3, 4, 5], 5), 3));
check('sma fenêtre', approx(sma([1, 2, 3, 4, 5], 2), 4.5));
check('sma données insuffisantes', sma([1, 2], 5) === null);
check('ema série constante', approx(ema([5, 5, 5, 5, 5, 5], 3), 5));
const e = ema([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
check('ema suit la hausse', e > 8 && e < 10, `(=${e})`);

console.log('— RSI —');
// Référence classique (Wilder) : série de 15 clôtures connues.
const up = Array.from({ length: 30 }, (_, i) => 100 + i);
check('rsi série strictement haussière = 100', rsi(up, 14) === 100);
const down = Array.from({ length: 30 }, (_, i) => 100 - i);
check('rsi série strictement baissière ≈ 0', rsi(down, 14) < 1);
const flat = Array.from({ length: 30 }, () => 100);
check('rsi série plate = 100 (pas de pertes)', rsi(flat, 14) === 100);
check('rsi données insuffisantes', rsi([1, 2, 3], 14) === null);
// Oscillation régulière → RSI proche de 50.
const osc = Array.from({ length: 60 }, (_, i) => 100 + (i % 2 ? 1 : -1));
const rOsc = rsi(osc, 14);
check('rsi oscillation ≈ 50', rOsc > 40 && rOsc < 60, `(=${rOsc})`);

console.log('— MACD —');
const trendUp = Array.from({ length: 60 }, (_, i) => 100 * Math.pow(1.01, i));
const mUp = macd(trendUp);
check('macd haussier > 0', mUp.macd > 0);
const trendDown = Array.from({ length: 60 }, (_, i) => 100 * Math.pow(0.99, i));
check('macd baissier < 0', macd(trendDown).macd < 0);
check('macd données insuffisantes', macd([1, 2, 3]) === null);

console.log('— Momentum / Volume —');
check('momentum +10%', approx(momentum([100, 105, 110], 2), 10));
check('momentum négatif', momentum([100, 90], 1) < 0);
const volsSpike = [...Array.from({ length: 20 }, () => 100), ...Array.from({ length: 5 }, () => 300)];
const vrS = volumeRatio(volsSpike);
check('volumeRatio détecte un pic (×3)', approx(vrS, 3), `(=${vrS})`);

console.log('— Score composite —');
const bullCloses = Array.from({ length: 80 }, (_, i) => 100 * Math.pow(1.004, i) * (1 + 0.002 * Math.sin(i)));
const bullVols = [...Array.from({ length: 75 }, () => 1000), ...Array.from({ length: 5 }, () => 1800)];
const bull = computeScore({ closes: bullCloses, volumes: bullVols });
check('marché haussier sain → score ≥ 55', bull.score >= 55, `(=${bull.score})`);
check('signal cohérent', ['BUY', 'STRONG_BUY'].includes(signalFromScore(bull.score).code));

const bearCloses = Array.from({ length: 80 }, (_, i) => 100 * Math.pow(0.995, i));
const bear = computeScore({ closes: bearCloses, volumes: bullVols });
check('marché baissier → score < 40', bear.score < 40, `(=${bear.score})`);
check('signal ÉVITER', signalFromScore(bear.score).code === 'AVOID');
check('score borné 0–100', bull.score <= 100 && bear.score >= 0);

const tiny = computeScore({ closes: [1, 2, 3], volumes: [1, 2, 3] });
check('données minuscules → pas de crash, score défini', Number.isFinite(tiny.score));

console.log('— Score à partir de métriques pré-calculées —');
const bullM = computeScoreFromMetrics({
  price: 110, ema20: 105, ema50: 100, rsi: 58, macd: 1.2, macdSignal: 0.8,
  perfW: 3, perf1M: 8, volume: 2e6, avgVol10: 1.5e6, avgVol30: 1e6,
});
check('métriques haussières → score ≥ 55', bullM.score >= 55, `(=${bullM.score})`);
check('histogramme MACD calculé', approx(bullM.macdHist, 0.4));
const bearM = computeScoreFromMetrics({
  price: 90, ema20: 95, ema50: 100, rsi: 28, macd: -1.5, macdSignal: -0.5,
  perfW: -6, perf1M: -15, volume: 5e5, avgVol10: 6e5, avgVol30: 1e6,
});
check('métriques baissières → score < 40', bearM.score < 40, `(=${bearM.score})`);
check('décomposition du score fournie (5 composantes)', Array.isArray(bullM.parts) && bullM.parts.length === 5);
check('somme des composantes ≈ score', Math.abs(bullM.parts.reduce((a, p) => a + p.pts, 0) - bullM.score) <= 3);
check('chaque composante bornée par son maximum', bullM.parts.every(p => p.pts >= 0 && p.pts <= p.max));
check('EMA retransmises pour le plan d\'action', bullM.ema20 === 105 && bullM.ema50 === 100);
const partial = computeScoreFromMetrics({ price: 100, rsi: 50 });
check('métriques partielles → pas de crash', Number.isFinite(partial.score));
check('cohérence des deux scoreurs (haussier sain)', (() => {
  const last = bullCloses[bullCloses.length - 1];
  const viaMetrics = computeScoreFromMetrics({
    price: last, ema20: ema(bullCloses, 20), ema50: ema(bullCloses, 50),
    rsi: rsi(bullCloses, 14), macd: macd(bullCloses).macd, macdSignal: macd(bullCloses).signal,
    perfW: momentum(bullCloses, 7), perf1M: momentum(bullCloses, 30),
    avgVol10: 1800, avgVol30: 1080,
  });
  return Math.abs(viaMetrics.score - bull.score) <= 12;
})());

console.log('— Volatilité, risque, explications —');
const calm = Array.from({ length: 60 }, (_, i) => 100 + (i % 2) * 0.2);
const wild = Array.from({ length: 60 }, (_, i) => 100 * (1 + (i % 2 ? 0.06 : -0.05)));
check('volatilité faible détectée', volatility(calm) < 0.5);
check('volatilité forte détectée', volatility(wild) > 4);
check('volatilité données insuffisantes → null', volatility([1, 2, 3]) === null);
check('risque faible', riskLevel({ vol: 0.5 }).code === 'LOW');
check('risque élevé', riskLevel({ vol: 5 }).code === 'HIGH');
check('risque estimé via momentum si pas de volatilité', riskLevel({ vol: null, mom30: 40 }).code === 'HIGH');
const exBull = explainFromMetrics({ rsi: 58, macdHist: 0.5, mom7: 3, mom30: 9, volRatio: 1.6, price: 110, ema20: 105, ema50: 100 });
check('explications haussières générées (≥5)', exBull.length >= 5, `(=${exBull.length})`);
check('majorité de points positifs en config haussière', exBull.filter(e => e.plus).length >= 4);
check('mention de la foule sur volume fort', exBull.some(e => /foule/.test(e.text)));
const exBear = explainFromMetrics({ rsi: 24, macdHist: -1, mom7: -5, mom30: -12, volRatio: 0.5, price: 90, ema20: 95, ema50: 100 });
check('explications baissières cohérentes', exBear.every(e => !e.plus));
check('métriques absentes → pas de crash', Array.isArray(explainFromMetrics({})));

console.log('— Alertes de prix —');
const prices = { BTC: 105, ETH: 20 };
const { triggered, waiting } = evaluateAlerts([
  { id: 1, symbol: 'BTC', dir: 'above', price: 100 },
  { id: 2, symbol: 'BTC', dir: 'below', price: 100 },
  { id: 3, symbol: 'ETH', dir: 'below', price: 25 },
  { id: 4, symbol: 'XXX', dir: 'above', price: 1 },
], (s) => prices[s] ?? null);
check('franchissement à la hausse déclenché', triggered.some(t => t.id === 1));
check('seuil bas non atteint → en attente', waiting.some(t => t.id === 2));
check('franchissement à la baisse déclenché', triggered.some(t => t.id === 3));
check('actif sans cours → en attente, pas de crash', waiting.some(t => t.id === 4));
check('cours constaté fourni', triggered.every(t => Number.isFinite(t.hitPrice)));
check('égalité au seuil = déclenchement', evaluateAlerts(
  [{ id: 5, symbol: 'BTC', dir: 'above', price: 105 }], (s) => prices[s]).triggered.length === 1);

console.log('— Valorisation du portefeuille —');
const pv = valuePositions([
  { asset: 'BTC', amount: 10, buyPrice: 100 },   // cours 105 → 10,50
  { asset: 'ETH', amount: 5, buyPrice: 25 },     // cours 20 → 4,00
  { asset: 'OLD', amount: 3 },                    // pas de prix d'achat
  { asset: 'ZZZ', amount: 2, buyPrice: 4 },       // pas de cours
], (s) => prices[s] ?? null);
check('plus-value calculée', approx(pv.rows[0].value, 10.5));
check('moins-value calculée', approx(pv.rows[1].value, 4));
check('% de variation correct', approx(pv.rows[0].plPct, 5));
check('position sans prix d’achat non valorisée', pv.rows[2].value === null);
check('position sans cours non valorisée', pv.rows[3].value === null);
check('totaux sur les positions valorisées uniquement', approx(pv.totals.invested, 15) && approx(pv.totals.value, 14.5));
check('P/L total cohérent', approx(pv.totals.plAbs, -0.5));
check('portefeuille vide → pas de crash', valuePositions([], () => null).totals.plPct === null);

console.log('— Recherche d’actifs —');
const univers = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'MC.FR', name: 'LVMH Moët Hennessy' },
  { symbol: 'AIR.FR', name: 'Airbus' },
];
check('recherche par symbole', filterAssets(univers, 'btc').length === 1 && filterAssets(univers, 'btc')[0].symbol === 'BTC');
check('recherche par nom partiel', filterAssets(univers, 'ether')[0]?.symbol === 'ETH');
check('insensible aux accents', filterAssets(univers, 'moet').length === 1);
check('insensible à la casse', filterAssets(univers, 'AIRBUS').length === 1);
check('requête vide → tout', filterAssets(univers, '').length === 4);
check('requête vide → copie (pas la même référence)', filterAssets(univers, '') !== univers);
check('aucun résultat → liste vide', filterAssets(univers, 'zzz').length === 0);

console.log('— Favoris épinglés —');
const scored = [{ symbol: 'A' }, { symbol: 'B' }, { symbol: 'C' }, { symbol: 'D' }];
const pinned = pinFavorites(scored, ['C', 'A']);
check('favoris remontés en tête', pinned[0].symbol === 'A' && pinned[1].symbol === 'C');
check('ordre relatif préservé (tri stable)', pinned[2].symbol === 'B' && pinned[3].symbol === 'D');
check('sans favoris → liste inchangée', pinFavorites(scored, []) === scored);
check('favori inconnu → sans effet', pinFavorites(scored, ['ZZZ']).length === 4);

console.log('— Sauvegarde importée (nettoyage) —');
const imported = sanitizeImportedStore({
  capital: 25, goal: 10000, rate: 1.5,
  trades: [
    { asset: 'btc', amount: 10, buyPrice: 100, date: '01/06/2026' },
    { asset: '', amount: 10 },               // actif vide → rejeté
    { asset: 'ETH', amount: -5 },             // montant invalide → rejeté
  ],
  alerts: [
    { id: 1, symbol: 'btc', dir: 'below', price: 90 },
    { symbol: 'ETH', dir: 'sideways', price: 50 }, // direction inconnue → normalisée
    { symbol: 'XXX', price: 0 },                   // prix invalide → rejeté
  ],
  favorites: ['btc', 'BTC', 'eth', 42],
  malicious: 'champ inconnu',
});
check('champs numériques repris', imported.capital === 25 && imported.rate === 1.5);
check('position valide normalisée en majuscules', imported.trades.length === 1 && imported.trades[0].asset === 'BTC');
check('alertes invalides écartées', imported.alerts.length === 2);
check('direction inconnue → above par défaut', imported.alerts[1].dir === 'above');
check('id généré si absent', Number.isFinite(imported.alerts[1].id));
check('favoris dédupliqués et normalisés', imported.favorites.length === 2 && imported.favorites.includes('BTC') && imported.favorites.includes('ETH'));
check('champ inconnu ignoré', !('malicious' in imported));
check('fichier étranger → null', sanitizeImportedStore({ foo: 'bar' }) === null);
check('tableau → null', sanitizeImportedStore([1, 2]) === null);
check('null → null, pas de crash', sanitizeImportedStore(null) === null);

console.log('— Plan d’action —');
const calmSpark = Array.from({ length: 48 }, (_, i) => 100 * (1 + 0.004 * Math.sin(i)));
const bullAsset = { price: 110, ema20: 108, ema50: 100, rsi: 58, score: 75, mom7: 2, mom30: 8, spark: calmSpark, momUnit: 'h' };
const plan = buildTradePlan(bullAsset, { feePct: 0.5, capital: 100 });
check('signal fort et sain → ENTRER', plan.action === 'ENTER');
check('zone d’entrée cohérente (EMA20 → cours)', plan.entryLow === 108 && plan.entryHigh === 110);
check('stop sous la zone d’entrée', plan.stop < plan.entryLow);
check('objectif au-dessus du cours', plan.target > bullAsset.price);
check('2 € visés pour 1 € risqué, frais inclus', approx(plan.targetPct, 2 * plan.stopPct + plan.breakevenPct, 0.01));
check('frais aller-retour comptés', approx(plan.breakevenPct, 1));
check('stop jamais plus serré que frais + 1 %', plan.stopPct >= plan.breakevenPct + 1);
check('horizon fourni (fourchette croissante)', plan.horizonDays[0] >= 1 && plan.horizonDays[1] > plan.horizonDays[0]);
check('risque limité à 1 % du capital', approx(plan.riskEur, 1));
check('position plafonnée à 25 % du capital', plan.positionEur <= 25);
check('contribution à l’objectif quotidien estimée', Number.isFinite(plan.goalContribPctPerDay) && plan.goalContribPctPerDay > 0);

const hot = buildTradePlan({ ...bullAsset, rsi: 78 }, { feePct: 0.5, capital: 100 });
check('surachat (RSI 78) → attendre un repli', hot.action === 'WAIT_PULLBACK');
check('zone de repli autour de l’EMA20, sous le cours', hot.entryHigh < bullAsset.price && hot.entryLow < hot.entryHigh);
const stretched = buildTradePlan({ ...bullAsset, price: 113, ema20: 108 }, {});
check('cours trop étiré (>4 % au-dessus EMA20) → attendre', stretched.action === 'WAIT_PULLBACK');
const weak = buildTradePlan({ ...bullAsset, score: 45 }, {});
check('score moyen → patienter, pas de niveaux', weak.action === 'WAIT_SIGNAL' && weak.stop === undefined);
const avoid = buildTradePlan({ ...bullAsset, score: 20 }, {});
check('score faible → éviter', avoid.action === 'AVOID');
const noFee = buildTradePlan(bullAsset, { feePct: 0, capital: 100 });
check('sans frais → objectif plus proche', noFee.targetPct < plan.targetPct);
check('prix invalide → null', buildTradePlan({ price: null, score: 80 }) === null);
const sparkless = buildTradePlan({ price: 50, ema20: 49, ema50: 45, rsi: 55, score: 70, mom30: 12, momUnit: 'j' }, {});
check('sans historique → volatilité estimée via momentum, plan complet', sparkless.action === 'ENTER' && Number.isFinite(sparkless.stop));

console.log('— Progression réelle du capital —');
const prog = measureProgress([
  { date: '2026-06-01', capital: 10 },
  { date: '2026-06-11', capital: 11 },
]);
check('période couverte correcte', prog.days === 10);
check('variation totale +10 %', approx(prog.totalPct, 10));
check('croissance moyenne géométrique ≈ 0,96 %/jour', prog.dailyPct > 0.9 && prog.dailyPct < 1.0, `(=${prog.dailyPct})`);
check('entrées non triées → triées', measureProgress([
  { date: '2026-06-11', capital: 11 }, { date: '2026-06-01', capital: 10 },
]).totalPct > 0);
check('entrées invalides filtrées', measureProgress([
  { date: '2026-06-01', capital: 10 }, { capital: 99 }, { date: '2026-06-05', capital: 0 }, { date: '2026-06-11', capital: 11 },
]).days === 10);
check('un seul jour → null', measureProgress([{ date: '2026-06-01', capital: 10 }]) === null);
check('journal absent → null, pas de crash', measureProgress(undefined) === null);

console.log('— Sauvegarde : frais et journal de capital —');
const imported2 = sanitizeImportedStore({
  feePct: 0.35,
  capitalLog: [{ date: '2026-06-01', capital: 10 }, { date: 'hier', capital: 5 }, { date: '2026-06-02', capital: -3 }],
});
check('frais de courtage repris', imported2.feePct === 0.35);
check('frais nuls acceptés', sanitizeImportedStore({ feePct: 0 }).feePct === 0);
check('frais aberrants (>20 %) rejetés', sanitizeImportedStore({ feePct: 50 }) === null);
check('journal nettoyé (dates et montants valides uniquement)', imported2.capitalLog.length === 1 && imported2.capitalLog[0].date === '2026-06-01');

if (failures) { console.error(`\n${failures} test(s) en échec`); process.exit(1); }
console.log('\nTous les tests passent ✅');
