const fs = require('fs');
const path = require('path');

// Create a 32x32 PNG icon (macOS menu bar needs at least 22x22)
const width = 32;
const height = 32;

// Create PNG data
const { createCanvas } = require('canvas');
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Draw clipboard icon
ctx.fillStyle = '#333333';
ctx.fillRect(6, 4, 20, 24); // Main clipboard body

ctx.fillStyle = '#666666';
ctx.fillRect(10, 2, 12, 6); // Clipboard clip

ctx.fillStyle = '#ffffff';
ctx.fillRect(8, 8, 16, 18); // Paper area

// Draw lines on paper
ctx.fillStyle = '#cccccc';
for (let y = 12; y < 24; y += 4) {
  ctx.fillRect(10, y, 12, 1);
}

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.png'), buffer);
console.log('Better icon created!');