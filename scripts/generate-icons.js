import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePng(width, height, isMaskable = false) {
  // Generate RGBA buffer
  const stride = 1 + width * 4;
  const rawData = Buffer.alloc(height * stride);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.38 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    rawData[rowOffset] = 0; // Filter type: none

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      // Background gradient: deep sapphire to royal blue
      const t = (x + y) / (width + height);
      let r = Math.round(2 + t * 30);
      let g = Math.round(132 - t * 40);
      let b = Math.round(216 + t * 20);
      let a = 255;

      // Distance from center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Book icon silhouette
      const bookWidth = width * 0.44;
      const bookHeight = height * 0.32;
      const inBookX = Math.abs(dx) <= bookWidth / 2;
      const inBookY = dy >= -bookHeight * 0.3 && dy <= bookHeight * 0.7;

      if (inBookX && inBookY) {
        // Spine center
        if (Math.abs(dx) < width * 0.015) {
          r = 203; g = 213; b = 225; a = 255;
        } else {
          // White pages
          r = 255; g = 255; b = 255; a = 245;

          // Stylized 'X' in blue
          const normX = dx / (bookWidth * 0.3);
          const normY = (dy - bookHeight * 0.2) / (bookHeight * 0.4);
          const onDiag1 = Math.abs(normX - normY) < 0.25;
          const onDiag2 = Math.abs(normX + normY) < 0.25;
          if ((onDiag1 || onDiag2) && Math.abs(normX) < 1 && Math.abs(normY) < 1) {
            r = 29; g = 78; b = 216; a = 255;
          }
        }
      }

      // Cyan Dot at top of book
      const dotDy = dy + bookHeight * 0.55;
      const dotDist = Math.sqrt(dx * dx + dotDy * dotDy);
      const dotRadius = width * 0.055;
      if (dotDist <= dotRadius) {
        if (dotDist <= dotRadius * 0.4) {
          r = 255; g = 255; b = 255; a = 255;
        } else {
          r = 6; g = 182; b = 212; a = 255;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression: deflate
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace: none
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT Chunk
  const deflated = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192
const pwa192 = generatePng(192, 192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

// Generate 512x512
const pwa512 = generatePng(512, 512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

// Generate maskable 512x512
const pwaMaskable = generatePng(512, 512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);

// Generate apple-touch-icon 180x180
const appleTouch = generatePng(180, 180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

console.log('Successfully generated PWA icon assets: 192x192, 512x512, maskable-512x512, and apple-touch-icon.png');
