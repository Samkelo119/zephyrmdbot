// commands/telenor.js
// The original telenor.js was missing from the project zip, but index.js requires it
// at startup (so the whole bot crashed with MODULE_NOT_FOUND). This placeholder keeps
// the bot booting; replace it with the real command if you have the original file.
module.exports = async function telenor(sock, from, msg, args) {
    await sock.sendMessage(
        from,
        { text: '⚠️ .telenor command abhi available nahi hai.' },
        { quoted: msg }
    );
};
