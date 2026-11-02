module.exports = {

    // ==============================
    // 🤖 ZEPHYR MD BOT CONFIG
    // ==============================

    botName: "⚡ZᴇPʜʏʀ~Mᴅ⚡",
    version: "1.0.1",
    footer: "Pᴏᴡᴇʀᴇᴅ Bʏ MʀDɪᴇHᴀʀᴅTᴇᴄʜX𓃵",

    ownerName: "MʀDɪᴇHᴀʀᴅTᴇᴄʜX",
    ownerNumber: process.env.OWNER_NUMBER || "27832573402",

    // Bot Status
    prefix: ".",
    mode: "private",
    timezone: "Africa/Johannesburg",

    // API KEYS
    giphyApiKey: process.env.GIPHY_API_KEY || "dc6zaTOxFJmzC",

    // Channel
    channel: {
        name: "ZᴇPʜʏʀMᴅ",
        url: "https://whatsapp.com/channel/0029Vb8p6DV8aKvNTp6n8n45"
    },

    // Features Default
    features: {

        autoReact: true,
        autoRead: false,
        autoTyping: true,
        autoRecording: true,

        antiCall: true,
        antiDelete: true,
        antiLink: true,

        autoStatus: false,
        aiReply: false
    },


    // Messages
    messages: {

        online:
        `
╭━━━〔 ⚡ZᴇPʜʏʀ~Mᴅ⚡ 〕━━━╮

✅ System Online
🚀 Multi Device Active
🛡️ Security Enabled
📦 Version V1.0.1

Pᴏᴡᴇʀᴇᴅ Bʏ MʀDɪᴇHᴀʀᴅTᴇᴄʜX𓃵
╰━━━━━━━━━━━━━━━━╯
        `,

        reconnecting:
        `
╭━━━〔 ⚡ZᴇPʜʏʀ~Mᴅ⚡ 〕━━━╮

🔄 Reconnecting
🚀 Session restored
🛡️ Stay online 24/7
📦 Version V1.0.1

Pᴏᴡᴇʀᴇᴅ Bʏ MʀDɪᴇHᴀʀᴅTᴇᴄʜX𓃵
╰━━━━━━━━━━━━━━━━╯
        `,


        pair:
        `
🔐 Pairing System Started

⚡ Secure Connection
⚡ZᴇPʜʏʀ~Mᴅ⚡
        `,


        error:
        "❌ System Error Occurred"
    },


    // Security
    security: {

        sessionBackup: true,
        maxMessagesCache: 3000,
        reconnect: true,
        antiCrash: true
    },


    // Owner Commands
    ownerCommands: [
        "public",
        "private",
        "broadcast",
        "restart",
        "eval"
    ]

};