async function aiCommand(sock, from, msg, isAdmin, session, args) {
    const action = args[0]?.toLowerCase();
    if (action === 'on' || action === 'off') {
        if (!isAdmin) return await sock.sendMessage(from, { text: "Only owner can toggle AI auto-reply." }, { quoted: msg });
        session.aiEnabled = action === 'on';
        await sock.sendMessage(from, { text: action === 'on' ? "AI Auto-Reply Enabled." : "AI Auto-Reply Disabled." }, { quoted: msg });
        return;
    }
    if (args.length > 0) {
        const query = args.join(' ');
        try {
            const response = await session.getAIResponse(from, query);
            await sock.sendMessage(from, { text: response }, { quoted: msg });
        } catch (e) {
            await sock.sendMessage(from, { text: "AI Error: " + e.message }, { quoted: msg });
        }
        return;
    }
    await sock.sendMessage(from, { text: "Usage:\n.ai [on/off] - Toggle Auto-Reply (owner)\n.ai [query] - Ask AI something" }, { quoted: msg });
}

module.exports = aiCommand;
