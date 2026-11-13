// Builds the installable home-screen version of Overpaid into /overpaid
// from the single source file overpaid.html, and renders the app icons.
// Usage: node tools/build-overpaid.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'overpaid.html'), 'utf8');
const out = path.join(root, 'overpaid');
fs.mkdirSync(out, { recursive: true });

const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Overpaid">
<meta name="application-name" content="Overpaid">
<meta name="theme-color" content="#060608">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<link rel="manifest" href="manifest.webmanifest">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
<script>window.NC_PWA=true</script>
</head>
<body>
`;
fs.writeFileSync(path.join(out, 'index.html'), head + src + '\n</body>\n</html>\n');

fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify({
  name: 'Overpaid',
  short_name: 'Overpaid',
  description: 'A fake-money rich-life simulator.',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#060608',
  theme_color: '#060608',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 2));

// Pull the LOGO() function out of the game source so the icon always matches the in-game logo.
const m = src.match(/function LOGO\(rx\)\{[\s\S]*?<\/svg>`\}/);
if (!m) throw new Error('LOGO() not found');
const LOGO = new Function('let UID=0;' + m[0] + ';return LOGO;')();
const svg = LOGO(0);
fs.writeFileSync(path.join(out, 'icon.svg'), svg);

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  for (const s of [180, 192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${s}" height="${s}" `)}</body></html>`);
    await p.screenshot({ path: path.join(out, `icon-${s}.png`), omitBackground: false });
    await p.close();
  }
  await b.close();
  console.log('built overpaid/');
})();
