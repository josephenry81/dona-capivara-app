const fs = require('fs');

// Create a simple SVG icon with Dona Capivara branding
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF4B82;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FF6B9D;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="20"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">DC</text>
</svg>
`;

// Ensure directory exists
if (!fs.existsSync('public/icons')) {
    fs.mkdirSync('public/icons', { recursive: true });
}

// Create SVG files
fs.writeFileSync('public/icons/icon-192x192.svg', createSVG(192));
fs.writeFileSync('public/icons/icon-512x512.svg', createSVG(512));
fs.writeFileSync('public/favicon.svg', createSVG(32));

console.log('✅ Created SVG icons successfully!');
console.log('📝 Note: Update manifest.json to use .svg files or convert to PNG using an online tool');
