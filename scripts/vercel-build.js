const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const assetsDir = path.join(publicDir, 'assets');
// Use the requested live bot backend by default. BACKEND_URL may override it.
const backend = (process.env.BACKEND_URL || 'https://zephyr-md-pair3.onrender.com').replace(/\/+$/, '');

let parsedBackend;
try {
    parsedBackend = new URL(backend);
} catch (error) {
    throw new Error('BACKEND_URL must be an absolute public http(s) URL for the always-on bot backend.');
}
if (!['http:', 'https:'].includes(parsedBackend.protocol)) {
    throw new Error('BACKEND_URL must use http:// or https://.');
}

fs.mkdirSync(assetsDir, { recursive: true });

let html = fs.readFileSync(path.join(root, 'pair.html'), 'utf8');
const inject = `window.ZEPHYR_BACKEND = ${JSON.stringify(backend)};`;
html = html.replace(/window\.ZEPHYR_BACKEND\s*=\s*[^;]*;/, inject);

// Surface backend errors as useful messages on the pairing page.
html = html.replace(
    ".then(r => r.json()).then(data => {",
    ".then(async r => { const data = await r.json().catch(() => ({})); if (!r.ok) throw new Error(data.error || `Backend returned HTTP ${r.status}`); return data; }).then(data => {"
);

fs.writeFileSync(path.join(publicDir, 'index.html'), html);

const srcAssets = path.join(root, 'assets');
if (fs.existsSync(srcAssets)) {
    for (const name of fs.readdirSync(srcAssets)) {
        const source = path.join(srcAssets, name);
        if (fs.statSync(source).isFile()) fs.copyFileSync(source, path.join(assetsDir, name));
    }
}
console.log('vercel-ready pairing backend=' + backend);
