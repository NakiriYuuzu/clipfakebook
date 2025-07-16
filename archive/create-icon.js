const fs = require('fs');
const path = require('path');

// Create a simple 16x16 PNG icon
const width = 16;
const height = 16;

// PNG file signature
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// IHDR chunk
const ihdr = Buffer.alloc(25);
ihdr.writeUInt32BE(13, 0); // chunk length
ihdr.write('IHDR', 4);
ihdr.writeUInt32BE(width, 8);
ihdr.writeUInt32BE(height, 12);
ihdr[16] = 8; // bit depth
ihdr[17] = 6; // color type (RGBA)
ihdr[18] = 0; // compression
ihdr[19] = 0; // filter
ihdr[20] = 0; // interlace

// Calculate CRC for IHDR
const crc32 = require('buffer-crc32');
const ihdrCrc = crc32(ihdr.slice(4, 21));
ihdr.writeUInt32BE(ihdrCrc.readUInt32BE(0), 21);

// Create image data (clipboard icon pattern)
const imageData = [];
for (let y = 0; y < height; y++) {
  imageData.push(0); // filter type
  for (let x = 0; x < width; x++) {
    // Create a simple clipboard icon pattern
    if ((x >= 3 && x <= 12 && y >= 2 && y <= 13) ||
        (x >= 2 && x <= 7 && y >= 1 && y <= 5)) {
      // Dark gray for clipboard body
      imageData.push(80, 80, 80, 255);
    } else if (x >= 4 && x <= 11 && y >= 4 && y <= 12) {
      // Light gray for clipboard content area
      imageData.push(200, 200, 200, 255);
    } else {
      // Transparent
      imageData.push(0, 0, 0, 0);
    }
  }
}

// Compress with zlib
const zlib = require('zlib');
const compressed = zlib.deflateSync(Buffer.from(imageData));

// IDAT chunk
const idat = Buffer.alloc(compressed.length + 12);
idat.writeUInt32BE(compressed.length, 0);
idat.write('IDAT', 4);
compressed.copy(idat, 8);
const idatCrc = crc32(idat.slice(4, 8 + compressed.length));
idat.writeUInt32BE(idatCrc.readUInt32BE(0), 8 + compressed.length);

// IEND chunk
const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

// Combine all chunks
const png = Buffer.concat([signature, ihdr, idat, iend]);

// Write file
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.png'), png);
console.log('Icon created successfully!');