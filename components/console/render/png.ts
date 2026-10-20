import { deflateSync } from 'node:zlib';
import type { Surface } from '../pixel/engine';

// Encodeur PNG minimal (RGBA 8 bits, sans filtre) pour les images générées au
// build côté serveur. Les surfaces sont déjà en octets R, G, B, A en mémoire.

const SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  out.set(data, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

export function encodePng(s: Surface): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(s.w, 0);
  header.writeUInt32BE(s.h, 4);
  header[8] = 8; // 8 bits par canal
  header[9] = 6; // RGBA
  const rgba = new Uint8Array(s.data.buffer);
  const stride = s.w * 4;
  // Chaque ligne commence par l'octet de filtre 0 (aucun filtre).
  const raw = Buffer.alloc((stride + 1) * s.h);
  for (let y = 0; y < s.h; y++) raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ]);
}
