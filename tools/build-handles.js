// Builds the standalone Handle Forge page (GitHub Pages / Home Screen app) into /handles
// from handles.html, and renders its icons. Usage: node tools/build-handles.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'handles');
const src = fs.readFileSync(path.join(root, 'handles.html'), 'utf8');
fs.mkdirSync(out, { recursive: true });
const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Handles">
<meta name="theme-color" content="#3390ec">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<link rel="manifest" href="manifest.webmanifest">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>
</head>
<body>
`;
fs.writeFileSync(path.join(out, 'index.html'), head + src + '\n</body>\n</html>\n');
fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify({
  name: 'Handle Forge', short_name: 'Handles', start_url: './', scope: './', display: 'standalone',
  background_color: '#0e1621', theme_color: '#3390ec',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }]
}, null, 2));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3ec1ff"/><stop offset="1" stop-color="#2a6fe8"/></linearGradient><radialGradient id="h" cx=".25" cy=".15" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="512" height="512" fill="url(#g)"/><rect width="512" height="512" fill="url(#h)"/><g fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round"><circle cx="256" cy="256" r="62"/><path d="M318 256v34c0 40 62 40 62 0v-34a124 124 0 1 0-48 98"/></g><path d="M118 430h276" stroke="#fff" stroke-opacity=".35" stroke-width="14" stroke-linecap="round"/></svg>`;
fs.writeFileSync(path.join(out, 'icon.svg'), svg);
(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  for (const s of [180, 192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${s}" height="${s}" `)}</body>`);
    await p.screenshot({ path: path.join(out, `icon-${s}.png`) });
    await p.close();
  }
  await b.close();
  console.log('built handles/');
})();
