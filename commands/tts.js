async function ttsCommand(sock, from, msg, q) {
    const text = String(q || '').trim();
    if (!text) {
        return sock.sendMessage(from, { text: 'Usage: .tts <text>' }, { quoted: msg });
    }
    const url = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=' + encodeURIComponent(text.slice(0, 180));
    try {
        await sock.sendMessage(from, { audio: { url }, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: 'TTS failed: ' + e.message }, { quoted: msg });
    }
}

module.exports = ttsCommand;
