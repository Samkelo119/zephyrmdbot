module.exports = {
    name: 'time',
    aliases: ['t'],
    description: 'Get current date and time',
    execute: async (sock, remoteJid, message) => {
        try {
            const opts = { timeZone: 'Africa/Johannesburg' };
            const now = new Date();
            const timeText = `🕐 *South Africa Time:*\n\n` +
                            `📅 *Date:* ${now.toLocaleDateString('en-ZA', opts)}\n` +
                            `🕰️ *Time:* ${now.toLocaleTimeString('en-ZA', opts)}\n` +
                            `🌍 *Timezone:* Africa/Johannesburg (SAST)`;
            await sock.sendMessage(remoteJid, { text: timeText }, { quoted: message });
        } catch (err) {
            console.error('Time command error:', err);
            await sock.sendMessage(remoteJid, { text: 'Error executing time command.' }, { quoted: message });
        }
    }
};
