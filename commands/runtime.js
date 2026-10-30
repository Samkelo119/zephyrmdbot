const botClock = require('../lib/botClock');

module.exports = {
    name: 'runtime',
    aliases: ['uptime', 'up'],
    description: 'Get bot runtime',
    execute: async (sock, remoteJid, message) => {
        try {
            await sock.sendMessage(remoteJid, {
                text: `⏳ ZᴇPʜʏʀMᴅ ʀᴜɴᴛɪᴍᴇ:\n\n🕐 *Uptime:* ${botClock.formatDuration(botClock.uptimeMs())}\n📅 *Started:* ${botClock.startedLabel()}\n🕰️ *Now:* ${botClock.nowLabel()}`
            }, { quoted: message });
        } catch (err) {
            console.error('Runtime command error:', err);
            await sock.sendMessage(remoteJid, { text: 'Error executing runtime command.' }, { quoted: message });
        }
    }
};
