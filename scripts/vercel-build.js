const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const assetsDir = path.join(publicDir, 'assets');
const backend = (process.env.BACKEND_URL || 'https://zephyrmdbot.onrender.com').replace(/\/+$/, '');

fs.mkdirSync(assetsDir, { recursive: true });

let html = fs.readFileSync(path.join(root, 'pair.html'), 'utf8');
const inject = `window.ZEPHYR_BACKEND = ${JSON.stringify(backend)};`;
if (html.includes('window.ZEPHYR_BACKEND =')) {
    html = html.replace(/window\.ZEPHYR_BACKEND\s*=\s*[^;]*;/, inject);
} else {
    html = html.replace(
        'const LIVE_BACKEND = \'https://zephyrmdbot.onrender.com\';',
        inject + '\n  const LIVE_BACKEND = \'https://zephyrmdbot.onrender.com\';'
    );
}
fs.writeFileSync(path.join(publicDir, 'index.html'), html);

const srcAssets = path.join(root, 'assets');
if (fs.existsSync(srcAssets)) {
    for (const name of fs.readdirSync(srcAssets)) {
        fs.copyFileSync(path.join(srcAssets, name), path.join(assetsDir, name));
    }
}
console.log('vercel-ready backend=' + backend);
