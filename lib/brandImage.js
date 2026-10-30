const axios = require('axios');
const sharp = require('sharp');

const cache = new Map();

async function brandMenuImage(url) {
    if (!url) return null;
    if (cache.has(url)) return cache.get(url);
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const input = Buffer.from(res.data);
    const img = sharp(input);
    const meta = await img.metadata();
    const w = meta.width || 1080;
    const h = meta.height || 1080;
    const fontSize = Math.max(42, Math.round(w * 0.11));
    const barH = Math.round(fontSize * 2.1);
    const svg = `<svg width="${w}" height="${h}">
      <rect x="0" y="${h - barH}" width="${w}" height="${barH}" fill="rgba(0,0,0,0.58)"/>
      <text x="50%" y="${h - Math.round(barH * 0.38)}" text-anchor="middle"
        font-family="Arial Black, Arial, sans-serif" font-size="${fontSize}" font-weight="800"
        fill="#ffffff" stroke="#000000" stroke-width="${Math.max(2, Math.round(fontSize / 16))}">ZEPHYR MD</text>
    </svg>`;
    const out = await img.composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 86 }).toBuffer();
    cache.set(url, out);
    return out;
}

module.exports = { brandMenuImage };
