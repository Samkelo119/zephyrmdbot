module.exports = {

    // ==============================
    // 🤖 ZEPHYR MD BOT CONFIG
    // ==============================

    botName: "⚡ZᴇPʜʏʀ~Mᴅ⚡",
    version: "1.0.2",
    footer: "Pᴏᴡᴇʀᴇᴅ Bʏ MʀDɪᴇHᴀʀᴅTᴇᴄʜX𓃵",

    ownerName: "MʀDɪᴇHᴀʀᴅTᴇᴄʜX",
    ownerNumber: process.env.OWNER_NUMBER || "27621834910",

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
        `▰ ZEPHYR MD ▰
  Online. Multi-device live.
  Security armed. V1.0.2
──────────────
✧ Pᴏᴡᴇʀᴇᴅ Bʏ MʀDɪᴇHᴀʀᴅTᴇᴄʜX𓃵`,

        reconnecting:
        `▰ ZEPHYR MD ▰
  Session restored. Staying online 24/7.
  V1.0.2
──────────────
✧ Pᴏᴡᴇʀᴇᴅ Bʏ MʀDɪᴇHᴀʀᴅTᴇᴄʜX𓃵`,

        pair:
        `▰ ZEPHYR MD ▰
  Pairing channel open.
──────────────
✧ Pᴏᴡᴇʀᴇᴅ Bʏ MʀDɪᴇHᴀʀᴅTᴇᴄʜX𓃵`,

        error:
        "System error. Try again."
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