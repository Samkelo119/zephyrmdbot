async function isAdmin(sock, chatId, senderId) {
    const result = { isSenderAdmin: false, isBotAdmin: false };
    if (!chatId || !String(chatId).endsWith('@g.us')) {
        result.isSenderAdmin = true;
        result.isBotAdmin = true;
        return result;
    }
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        const senderNum = String(senderId || '').split('@')[0].split(':')[0];
        const botNum = String(sock.user?.id || '').split('@')[0].split(':')[0];
        const sender = participants.find(p => String(p.id || '').split('@')[0].split(':')[0] === senderNum);
        const bot = participants.find(p => String(p.id || '').split('@')[0].split(':')[0] === botNum);
        result.isSenderAdmin = !!(sender && (sender.admin === 'admin' || sender.admin === 'superadmin'));
        result.isBotAdmin = !!(bot && (bot.admin === 'admin' || bot.admin === 'superadmin'));
    } catch (e) {}
    return result;
}

module.exports = isAdmin;
