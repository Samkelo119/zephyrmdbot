const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const assetsDir = path.join(publicDir, 'assets');

fs.mkdirSync(assetsDir, { recursive: true });
fs.copyFileSync(path.join(root, 'pair.html'), path.join(publicDir, 'index.html'));

const srcAssets = path.join(root, 'assets');
if (fs.existsSync(srcAssets)) {
    for (const name of fs.readdirSync(srcAssets)) {
        const source = path.join(srcAssets, name);
        if (fs.statSync(source).isFile()) fs.copyFileSync(source, path.join(assetsDir, name));
    }
}
console.log('vercel-ready pairing-site');
