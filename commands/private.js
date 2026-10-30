module.exports = async function privateCommand(sock, from, msg, isOwner, session) {
    if (!isOwner) {
        return sock.sendMessage(from, { text: 'Only the owner can use this command.' }, { quoted: msg });
    }
    if (session) session.isPublic = false;
    return sock.sendMessage(from, { text: 'Bot is now PRIVATE. Only the owner can use commands.' }, { quoted: msg });
};
