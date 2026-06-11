// One-off generator for PWA icons. Produces solid-rounded PNGs matching the
// favicon: dark navy bg, white outer ring, cyan inner dot. Pure Node (zlib),
// no dependencies. Run: `node scripts/generate-icons.mjs`.
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const OUT = new URL("../public/icons/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const BG = [15, 23, 42, 255]; // #0f172a
const WHITE = [255, 255, 255, 255];
const CYAN = [56, 189, 248, 255];

function px(size, x, y, maskable) {
  const cx = size / 2;
  const cy = size / 2;
  const d = Math.hypot(x - cx, y - cy);
  // Shrink the art for maskable icons so it survives platform masking.
  const s = maskable ? 0.72 : 1;
  const outer = (size * 0.28) * s;
  const ring = size * 0.06 * s;
  const inner = size * 0.14 * s;
  const dot = size * 0.04 * s;
  if (Math.abs(d - outer) < ring) return WHITE;
  if (Math.abs(d - inner) < ring * 0.7) return CYAN;
  if (d < dot) return CYAN;
  return BG;
}

function makePng(size, maskable = false) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const c = px(size, x, y, maskable);
      raw[p++] = c[0];
      raw[p++] = c[1];
      raw[p++] = c[2];
      raw[p++] = c[3];
    }
  }
  const idat = deflateSync(raw);

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type, "ascii");
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// CRC32 (PNG)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

writeFileSync(new URL("icon-192.png", OUT), makePng(192));
writeFileSync(new URL("icon-512.png", OUT), makePng(512));
writeFileSync(new URL("icon-512-maskable.png", OUT), makePng(512, true));
console.log("Generated icons in public/icons/");
