import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

function createPNG(size, r, g, b) {
  function crc32(buf) {
    let crc = 0xffffffff;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const len = Buffer.allocUnsafe(4);
    len.writeUInt32BE(data.length);
    const crcData = Buffer.concat([typeBytes, data]);
    const crcBuf = Buffer.allocUnsafe(4);
    crcBuf.writeUInt32BE(crc32(crcData));
    return Buffer.concat([len, typeBytes, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw image data: each row has a filter byte (0) then RGB pixels
  const rawRow = Buffer.allocUnsafe(1 + size * 3);
  rawRow[0] = 0; // filter type None
  for (let x = 0; x < size; x++) {
    rawRow[1 + x * 3] = r;
    rawRow[1 + x * 3 + 1] = g;
    rawRow[1 + x * 3 + 2] = b;
  }
  const rawRows = [];
  for (let y = 0; y < size; y++) rawRows.push(rawRow);
  const rawData = Buffer.concat(rawRows);
  const compressed = deflateSync(rawData);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

writeFileSync('public/icon-192x192.png', createPNG(192, 30, 64, 175));
writeFileSync('public/icon-512x512.png', createPNG(512, 30, 64, 175));
console.log('Icons generated!');
