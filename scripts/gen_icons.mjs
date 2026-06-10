// Génère les icônes PWA (PNG) sans dépendance : encodeur PNG minimal + dessin
// par pixel d'un graphique haussier sur fond sombre.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(width, height, pixelFn) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 4);
    raw[row] = 0; // filtre None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const o = row + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8 bits, RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function makeIcon(size) {
  const s = size;
  // Points de la courbe haussière (proportions du carré).
  const pts = [[0.14, 0.74], [0.30, 0.58], [0.42, 0.66], [0.60, 0.42], [0.72, 0.48], [0.88, 0.24]];
  const lw = s * 0.045;
  function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }
  return png(s, s, (x, y) => {
    // Fond : dégradé bleu nuit, coins arrondis (rayon 18 %).
    const r = s * 0.18;
    const cx = Math.max(r - x, x - (s - 1 - r), 0);
    const cy = Math.max(r - y, y - (s - 1 - r), 0);
    if (cx && cy && Math.hypot(cx, cy) > r) return [0, 0, 0, 0];
    const g = y / s;
    let pr = Math.round(11 + 14 * g), pg = Math.round(16 + 19 * g), pb = Math.round(32 + 34 * g);
    // Courbe verte.
    let d = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      d = Math.min(d, distToSegment(x, y, pts[i][0] * s, pts[i][1] * s, pts[i + 1][0] * s, pts[i + 1][1] * s));
    }
    // Pointe de flèche au bout de la courbe.
    const ex = 0.88 * s, ey = 0.24 * s;
    const dArrow = Math.min(
      distToSegment(x, y, ex, ey, ex - 0.10 * s, ey + 0.015 * s),
      distToSegment(x, y, ex, ey, ex - 0.015 * s, ey + 0.10 * s),
    );
    d = Math.min(d, dArrow);
    if (d < lw) {
      const t = Math.max(0, Math.min(1, lw - d)); // anticrénelage 1 px
      pr = Math.round(pr + (43 - pr) * t); pg = Math.round(pg + (213 - pg) * t); pb = Math.round(pb + (118 - pb) * t);
    }
    return [pr, pg, pb, 255];
  });
}

mkdirSync('icons', { recursive: true });
for (const size of [192, 512]) {
  const buf = makeIcon(size);
  writeFileSync(`icons/icon-${size}.png`, buf);
  console.log(`icons/icon-${size}.png (${buf.length} octets)`);
}
