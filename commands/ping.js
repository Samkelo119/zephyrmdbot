async function pingCommand(sock, from, msg) {
    const rawTs = Number(msg.messageTimestamp);
    const msgMs = rawTs > 1e12 ? rawTs : rawTs * 1000;
    const receiveMs = msgMs ? Math.max(0, Date.now() - msgMs) : 0;
    const t0 = Date.now();
    try { await sock.sendPresenceUpdate('available'); } catch (e) {}
    const netMs = Date.now() - t0;
    const latency = Math.max(receiveMs, netMs);
    await sock.sendMessage(from, {
        text: `🏓 *Pong*\n⚡ Latency: ${latency} ms\n📥 Incoming: ${receiveMs} ms\n🌐 Network: ${netMs} ms\n🤖 ⚡ZᴇPʜʏʀ~Mᴅ⚡`
    }, { quoted: msg });
}

module.exports = pingCommand;
