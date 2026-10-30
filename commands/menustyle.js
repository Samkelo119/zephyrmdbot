const userSettings = require('../lib/userSettings');
const { listStyles, normalizeStyle, STYLE_META, applyFont } = require('../lib/menuStyles');

module.exports = async function menustyleCommand(sock, from, msg, args, sender) {
    const prefix = userSettings.getPrefix(sender);
    const current = userSettings.getMenuStyle(sender);
    const raw = String(args[0] || '').trim();
    if (!raw) {
        return sock.sendMessage(from, {
            text: `Current menu style: *${current}/17* (${STYLE_META[current - 1].name})\nPreview: ${prefix}${applyFont('menu', current)}\n\nUsage: ${prefix}menustyle 1-17\nAlso: ${prefix}menustyle1 to ${prefix}menustyle17\n\n${listStyles(prefix)}`
        }, { quoted: msg });
    }
    const parsed = parseInt(raw, 10);
    if (!parsed || parsed < 1 || parsed > 17) {
        return sock.sendMessage(from, { text: `Use ${prefix}menustyle 1-17` }, { quoted: msg });
    }
    const id = normalizeStyle(parsed);
    userSettings.setMenuStyle(sender, id);
    await sock.sendMessage(from, {
        text: `Menu style set to *${id}/17* (${STYLE_META[id - 1].name})\nPreview: ${prefix}${applyFont('menu', id)}\nThis style is only for you. Type ${prefix}menu`
    }, { quoted: msg });
};
