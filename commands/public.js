module.exports = async function publicCommand(sock, from, msg, isOwner, session) {
    if (!isOwner) {
        return sock.sendMessage(from, { text: 'Only the owner can use this command.' }, { quoted: msg });
    }
    if (session) session.isPublic = true;
    return sock.sendMessage(from, { text: 'Bot is now PUBLIC. Everyone can use commands.' }, { quoted: msg });
};
