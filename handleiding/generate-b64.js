// Draai eenmalig via: node handleiding/generate-b64.js
// Genereert handleiding-screenshots.js met alle screenshots als base64.
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'screenshots');
const outputFile = path.join(__dirname, '..', 'handleiding-screenshots.js');

const files = fs.readdirSync(screenshotsDir)
  .filter(f => f.toLowerCase().endsWith('.png'))
  .sort();

const obj = {};
files.forEach(f => {
  const data = fs.readFileSync(path.join(screenshotsDir, f));
  const key = f.replace('.png', '');
  obj[key] = 'data:image/png;base64,' + data.toString('base64');
  console.log(`  ✓ ${f} (${Math.round(data.length / 1024)} KB)`);
});

const content = `// Gegenereerd door handleiding/generate-b64.js — niet handmatig bewerken\n// Draai opnieuw na het toevoegen van nieuwe screenshots.\nconst HANDLEIDING_SCREENSHOTS = ${JSON.stringify(obj)};\n`;
fs.writeFileSync(outputFile, content, 'utf8');
console.log(`\nKlaar — ${files.length} screenshots → handleiding-screenshots.js`);
