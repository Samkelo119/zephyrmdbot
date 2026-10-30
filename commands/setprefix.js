const userSettings = require('../lib/userSettings');

module.exports = async function setprefixCommand(sock, from, msg, args, sender) {
    const current = userSettings.getPrefix(sender);
    const next = String(args[0] || '').trim();
    if (!next) {
        return sock.sendMessage(from, {
            text: `Your prefix: *${current}*\nUsage: ${current}setprefix <symbol>\nExample: ${current}setprefix !\nThis only changes the prefix for you.`
        }, { quoted: msg });
    }
    try {
        userSettings.setPrefix(sender, next);
        await sock.sendMessage(from, {
            text: `Your prefix changed from *${current}* to *${next}*\nExample: ${next}menu\nOther numbers keep their own prefix.`
        }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: 'Failed: ' + e.message }, { quoted: msg });
    }
};
