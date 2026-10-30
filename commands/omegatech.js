const axios = require('axios');

const BASE = 'https://api.omegatech.app';
const AXIOS_OPTS = {
    timeout: 90000,
    headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json, text/plain, */*'
    },
    maxRedirects: 5
};

async function getJson(url) {
    const res = await axios.get(url, AXIOS_OPTS);
    return res.data;
}

async function crunchyroll(sock, from, msg, q) {
    const query = String(q || '').trim();
    if (!query) {
        return sock.sendMessage(from, { text: 'Usage: .crunchyroll Naruto' }, { quoted: msg });
    }
    await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } });
    try {
        const data = await getJson(`${BASE}/api/Anime/Crunchyroll?action=search&q=${encodeURIComponent(query)}`);
        const results = data?.data?.results || [];
        if (!results.length) {
            return sock.sendMessage(from, { text: 'No Crunchyroll results for: ' + query }, { quoted: msg });
        }
        const lines = results.slice(0, 10).map((item, i) => {
            const title = item.title || 'Untitled';
            const type = item.type || 'series';
            const slug = item.slug ? `\nhttps://www.crunchyroll.com/${item.slug}` : '';
            const desc = item.description ? `\n${String(item.description).slice(0, 140)}` : '';
            return `${i + 1}. *${title}* (${type})${desc}${slug}`;
        });
        await sock.sendMessage(from, {
            text: `🍥 *Crunchyroll Search*\nQuery: ${query}\nResults: ${data?.data?.total || results.length}\n\n${lines.join('\n\n')}`
        }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: 'Crunchyroll search failed: ' + (e.message || e) }, { quoted: msg });
    }
}

async function ytdown(sock, from, msg, q) {
    const input = String(q || '').trim();
    if (!input) {
        return sock.sendMessage(from, { text: 'Usage: .ytdown https://youtu.be/xxxxx' }, { quoted: msg });
    }
    const urlMatch = input.match(/https?:\/\/[^\s]+/i);
    const youtubeUrl = urlMatch ? urlMatch[0] : input;
    if (!/youtu(\.be|be\.com)/i.test(youtubeUrl)) {
        return sock.sendMessage(from, { text: 'Send a YouTube link.\nExample: .ytdown https://youtu.be/xxxxx' }, { quoted: msg });
    }
    await sock.sendMessage(from, { react: { text: '📥', key: msg.key } });
    try {
        const data = await getJson(`${BASE}/api/download/YouTube?action=download&url=${encodeURIComponent(youtubeUrl)}`);
        const file = data?.data || {};
        if (!file.url) {
            return sock.sendMessage(from, { text: 'YouTube download failed. Try another link.' }, { quoted: msg });
        }
        const title = file.title || 'YouTube Video';
        const sizeMB = file.sizeMB ? `${file.sizeMB} MB` : '';
        const type = (file.type || 'mp4').toLowerCase();
        await sock.sendMessage(from, {
            text: `🎬 *YouTube Download*\n*${title}*\n${sizeMB ? 'Size: ' + sizeMB + '\n' : ''}Sending file...`
        }, { quoted: msg });
        const media = await axios.get(file.url, {
            responseType: 'arraybuffer',
            timeout: 180000,
            maxContentLength: 90 * 1024 * 1024,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const buffer = Buffer.from(media.data);
        if (type === 'mp3' || type === 'm4a' || type === 'audio') {
            await sock.sendMessage(from, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: `🎬 ${title}\n⚡ ZEPHYR MD`
            }, { quoted: msg });
        }
    } catch (e) {
        await sock.sendMessage(from, { text: 'YouTube download failed: ' + (e.message || e) }, { quoted: msg });
    }
}

async function telesticker(sock, from, msg, q) {
    const keyword = String(q || '').trim();
    if (!keyword) {
        return sock.sendMessage(from, { text: 'Usage: .telesticker Omega' }, { quoted: msg });
    }
    await sock.sendMessage(from, { react: { text: '🎭', key: msg.key } });
    try {
        const data = await getJson(`${BASE}/api/Search/Tele-sticker?action=search&keyword=${encodeURIComponent(keyword)}`);
        const packs = data?.data?.packs || [];
        if (!packs.length) {
            return sock.sendMessage(from, { text: 'No Telegram sticker packs for: ' + keyword }, { quoted: msg });
        }
        const top = packs.slice(0, 8);
        const lines = top.map((pack, i) => {
            const title = pack.title || 'Untitled';
            const author = pack.author ? `\nAuthor: ${pack.author}` : '';
            const link = pack.telegramUrl || '';
            return `${i + 1}. *${title}*${author}\n${link}`;
        });
        await sock.sendMessage(from, {
            text: `🎭 *Telegram Sticker Search*\nKeyword: ${keyword}\nPacks: ${data?.data?.total || packs.length}\n\n${lines.join('\n\n')}\n\nUse .tg <pack url> to import a pack.`
        }, { quoted: msg });
        const cover = top.find(p => p.cover && p.cover.url);
        if (cover && cover.cover.url) {
            try {
                const img = await axios.get(cover.cover.url, { responseType: 'arraybuffer', timeout: 20000 });
                await sock.sendMessage(from, {
                    image: Buffer.from(img.data),
                    caption: `Cover: ${cover.title}`
                }, { quoted: msg });
            } catch (e) {}
        }
    } catch (e) {
        await sock.sendMessage(from, { text: 'Telegram sticker search failed: ' + (e.message || e) }, { quoted: msg });
    }
}

module.exports = { crunchyroll, ytdown, telesticker };
