const fs = require('fs');
const path = require('path');
const botClock = require('../lib/botClock');

module.exports = {
    name: 'alive',
    aliases: ['status', 'bot', 'running'],
    description: 'Check bot status and runtime',
    execute: async (sock, remoteJid, message) => {
        try {
            const ramMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
            const text = [
                `STATUS    online`,
                `RUNTIME   ${botClock.formatDuration(botClock.uptimeMs())}`,
                `STARTED   ${botClock.startedLabel()}`,
                `NOW       ${botClock.nowLabel()}`,
                `RAM       ${ramMB} MB`,
                `OWNER     MrDieHardTechX`,
                `WHATSAPP  +27621834910`
            ].join('\n');

            const ownerImg = path.join(__dirname, '../assets/owner_image.png');
            const menuImg = path.join(__dirname, '../assets/menu.jpg');
            const imgPath = fs.existsSync(ownerImg) ? ownerImg : fs.existsSync(menuImg) ? menuImg : null;

            if (imgPath) {
                await sock.sendMessage(remoteJid, { image: fs.readFileSync(imgPath), caption: text }, { quoted: message });
            } else {
                await sock.sendMessage(remoteJid, { text }, { quoted: message });
            }
        } catch (err) {
            console.error('Alive error:', err);
            await sock.sendMessage(remoteJid, { text: 'Error executing alive command.' });
        }
    }
};
