const axios = require('axios');
const yts = require('yt-search');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { toAudio } = require('../lib/converter');

const FOOTER = 'Pᴏᴡᴇʀᴇᴅ Bʏ MʀDɪᴇHᴀʀᴅTᴇᴄʜX𓃵';

function send(sock, from, msg, text) {
    return sock.sendMessage(from, { text: `${text}\n\n${FOOTER}` }, { quoted: msg });
}

async function downloadQuotedMedia(quoted, type) {
    const stream = await downloadContentFromMessage(quoted, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
}

async function gpt(sock, from, msg, q) {
    if (!q) return send(sock, from, msg, 'Please provide a message for the AI.\nExample: `.gpt Hello`');
    try {
        const { data } = await axios.get(`https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(q)}`, { timeout: 25000 });
        if (!data || !data.message) return send(sock, from, msg, 'AI failed to respond. Please try again later.');
        return send(sock, from, msg, `*AI Response:*\n\n${data.message}`);
    } catch (e) {
        try {
            const { data } = await axios.get(`https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(q)}`, { timeout: 25000 });
            const text = data?.result || data?.message || data?.data;
            if (text) return send(sock, from, msg, `*AI Response:*\n\n${text}`);
        } catch (e2) {}
        return send(sock, from, msg, 'An error occurred while communicating with the AI.');
    }
}

async function openai(sock, from, msg, q) {
    return gpt(sock, from, msg, q);
}

async function metaai(sock, from, msg, q) {
    if (!q) return send(sock, from, msg, 'Please provide a question to ask Meta AI.\nExample: `.metaai What is AI?`');
    try {
        const { data } = await axios.get(`https://apis.davidcyriltech.my.id/ai/metaai?text=${encodeURIComponent(q)}`, { timeout: 25000 });
        if (!data || (!data.success && !data.response)) return send(sock, from, msg, 'Meta AI failed to respond.');
        return send(sock, from, msg, `*Meta AI:* ${data.response || data.result || data.message}`);
    } catch (e) {
        return send(sock, from, msg, 'An error occurred while talking to Meta AI.');
    }
}

async function vv2(sock, from, msg) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return send(sock, from, msg, 'Please reply to a view once message.');
    const viewOnce = quoted.viewOnceMessageV2 || quoted.viewOnceMessage || quoted.viewOnceMessageV2Extension;
    const message = viewOnce ? (viewOnce.message || viewOnce) : quoted;
    const vType = Object.keys(message || {})[0];
    if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(vType)) {
        return send(sock, from, msg, 'Only image, video, and audio view-once messages are supported.');
    }
    try {
        const buffer = await downloadQuotedMedia(message[vType], vType.replace('Message', ''));
        const caption = (message[vType].caption || '') + `\n\n${FOOTER}`;
        if (vType === 'imageMessage') {
            await sock.sendMessage(from, { image: buffer, caption }, { quoted: msg });
        } else if (vType === 'videoMessage') {
            await sock.sendMessage(from, { video: buffer, caption }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mp4', ptt: !!message[vType].ptt }, { quoted: msg });
        }
    } catch (e) {
        return send(sock, from, msg, 'Could not retrieve the view once message.');
    }
}

async function channelreact(sock, from, msg, isOwner, q) {
    if (!isOwner) return send(sock, from, msg, 'Owner-only command.');
    if (!q) return send(sock, from, msg, 'Usage: `.chr https://whatsapp.com/channel/<id>/<msg-id> <text>`');
    const [link, ...textParts] = q.trim().split(' ');
    const inputText = textParts.join(' ').toLowerCase();
    if (!link || !link.includes('whatsapp.com/channel/') || !inputText) {
        return send(sock, from, msg, 'Invalid link or missing text.');
    }
    const urlSegments = link.split('/');
    const channelId = urlSegments[4];
    const messageId = urlSegments[5];
    if (!channelId || !messageId) return send(sock, from, msg, 'Link missing channel or message ID.');

    const stylizedChars = {
        a: '🅐', b: '🅑', c: '🅒', d: '🅓', e: '🅔', f: '🅕', g: '🅖',
        h: '🅗', i: '🅘', j: '🅙', k: '🅚', l: '🅛', m: '🅜', n: '🅝',
        o: '🅞', p: '🅟', q: '🅠', r: '🅡', s: '🅢', t: '🅣', u: '🅤',
        v: '🅥', w: '🅦', x: '🅧', y: '🅨', z: '🅩',
        '0': '⓿', '1': '➊', '2': '➋', '3': '➌', '4': '➍',
        '5': '➎', '6': '➏', '7': '➐', '8': '➑', '9': '➒'
    };
    const styled = inputText.split('').map(ch => stylizedChars[ch] || ch).join('');
    try {
        const newsletterJid = channelId.includes('@') ? channelId : `${channelId}@newsletter`;
        await sock.newsletterReactMessage(newsletterJid, messageId, styled);
        return send(sock, from, msg, `Reacted on channel with: ${styled}`);
    } catch (e) {
        return send(sock, from, msg, 'Could not react to that channel message.');
    }
}

async function tomp3(sock, from, msg) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return send(sock, from, msg, 'Reply to a video or audio with `.tomp3`.');
    const media = quoted.videoMessage || quoted.audioMessage || quoted.documentMessage;
    if (!media) return send(sock, from, msg, 'Reply to a video or audio file.');
    const type = quoted.videoMessage ? 'video' : 'audio';
    try {
        const buffer = await downloadQuotedMedia(media, type);
        const audio = await toAudio(buffer, type === 'video' ? 'mp4' : 'ogg');
        await sock.sendMessage(from, {
            audio,
            mimetype: 'audio/mpeg',
            fileName: 'zephyr.mp3'
        }, { quoted: msg });
        await send(sock, from, msg, 'Converted to MP3.');
    } catch (e) {
        return send(sock, from, msg, 'Conversion failed. Try a shorter clip.');
    }
}

async function ytsong(sock, from, msg, q) {
    if (!q) return send(sock, from, msg, 'Usage: `.ytsong <song name or YouTube URL>`');
    try {
        let videoUrl;
        let title = q;
        const isYt = /(youtube\.com|youtu\.be)/i.test(q);
        if (isYt) {
            videoUrl = q.trim();
        } else {
            const { videos } = await yts(q);
            if (!videos || !videos.length) return send(sock, from, msg, 'No songs found.');
            videoUrl = videos[0].url;
            title = videos[0].title;
        }
        await sock.sendMessage(from, { text: `_Downloading: ${title}_\n\n${FOOTER}` }, { quoted: msg });
        const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${encodeURIComponent(videoUrl)}`, { timeout: 60000 });
        const data = response.data;
        if (!data || !data.status || !data.result || !data.result.downloadUrl) {
            return send(sock, from, msg, 'Failed to fetch audio. Please try again later.');
        }
        await sock.sendMessage(from, {
            audio: { url: data.result.downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${data.result.title || title}.mp3`
        }, { quoted: msg });
    } catch (e) {
        return send(sock, from, msg, 'Download failed. Please try again later.');
    }
}

async function weatherplus(sock, from, msg, q) {
    if (!q) return send(sock, from, msg, 'Usage: `.weatherplus <city>`');
    try {
        const url = `https://wttr.in/${encodeURIComponent(q)}?format=j1`;
        const { data } = await axios.get(url, { timeout: 15000 });
        const cur = data.current_condition && data.current_condition[0];
        const area = data.nearest_area && data.nearest_area[0];
        if (!cur) return send(sock, from, msg, 'Could not fetch weather data.');
        const name = (area && area.areaName && area.areaName[0] && area.areaName[0].value) || q;
        const country = (area && area.country && area.country[0] && area.country[0].value) || '';
        const text =
            `*Weather for ${name}${country ? ', ' + country : ''}*\n\n` +
            `Temperature: ${cur.temp_C}°C (feels ${cur.FeelsLikeC}°C)\n` +
            `Condition: ${cur.weatherDesc && cur.weatherDesc[0] && cur.weatherDesc[0].value}\n` +
            `Humidity: ${cur.humidity}%\n` +
            `Wind: ${cur.windspeedKmph} km/h`;
        return send(sock, from, msg, text);
    } catch (e) {
        return send(sock, from, msg, 'Could not fetch weather data.');
    }
}

module.exports = {
    gpt, openai, metaai, vv2, channelreact, tomp3, ytsong, weatherplus
};
