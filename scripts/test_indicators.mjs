// Tests unitaires des indicateurs — exécutés en local et en CI.
import { sma, ema, rsi, macd, momentum, volumeRatio, computeScore, signalFromScore }
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

if (failures) { console.error(`\n${failures} test(s) en échec`); process.exit(1); }
console.log('\nTous les tests passent ✅');
