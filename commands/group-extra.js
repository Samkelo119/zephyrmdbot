const botClock = require('../lib/botClock');

async function groupname(sock, from, msg, isGroup) {
    if (!isGroup) return sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg });
    try {
        const meta = await sock.groupMetadata(from);
        await sock.sendMessage(from, { text: `📛 *Group Name:*\n${meta.subject}` }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: '❌ Could not fetch group info.' }, { quoted: msg });
    }
}

async function groupdesc(sock, from, msg, isGroup) {
    if (!isGroup) return sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg });
    try {
        const meta = await sock.groupMetadata(from);
        await sock.sendMessage(from, { text: `📝 *Group Description:*\n${meta.desc || '_No description set._'}` }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: '❌ Could not fetch the description.' }, { quoted: msg });
    }
}

async function membercount(sock, from, msg, isGroup) {
    if (!isGroup) return sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg });
    try {
        const meta = await sock.groupMetadata(from);
        await sock.sendMessage(from, { text: `👥 *Total Members:* ${meta.participants.length}` }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: '❌ Could not fetch the member count.' }, { quoted: msg });
    }
}

async function adminlist(sock, from, msg, isGroup) {
    if (!isGroup) return sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg });
    try {
        const meta = await sock.groupMetadata(from);
        const admins = meta.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        if (!admins.length) return sock.sendMessage(from, { text: 'ℹ️ No admins found in this group.' }, { quoted: msg });
        let text = `👑 *Group Admins (${admins.length}):*\n\n`;
        admins.forEach((a, i) => { text += `${i + 1}. @${a.id.split('@')[0]}\n`; });
        await sock.sendMessage(from, { text, mentions: admins.map(a => a.id) }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: '❌ Could not fetch the admin list.' }, { quoted: msg });
    }
}

async function whois(sock, from, msg, isGroup) {
    try {
        let target = msg.message?.extendedTextMessage?.contextInfo?.participant
            || msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            || msg.key.participant || msg.key.remoteJid;

        let text = `🪪 *WHOIS*\n\n👤 *Number:* @${target.split('@')[0]}\n🔗 *JID:* ${target}`;

        if (isGroup) {
            try {
                const meta = await sock.groupMetadata(from);
                const p = meta.participants.find(x => x.id === target);
                if (p) text += `\n🛡️ *Role:* ${p.admin ? p.admin : 'member'}`;
            } catch (e) {}
        }

        await sock.sendMessage(from, { text, mentions: [target] }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: '❌ Could not fetch info.' }, { quoted: msg });
    }
}

async function chatid(sock, from, msg) {
    await sock.sendMessage(from, { text: `🆔 *Chat ID:*\n${from}` }, { quoted: msg });
}

async function runtime(sock, from, msg) {
    await sock.sendMessage(from, {
        text: `⏱️ *Bot Runtime*\nUptime: ${botClock.formatDuration(botClock.uptimeMs())}\nStarted: ${botClock.startedLabel()}\nNow: ${botClock.nowLabel()}`
    }, { quoted: msg });
}

async function rules(sock, from, msg, args, isGroup, botData, saveBotData, q) {
    if (!isGroup) return sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg });
    if (!botData.groupRules) botData.groupRules = {};
    if (args[0] === 'set' && q.slice(4).trim()) {
        botData.groupRules[from] = q.slice(4).trim();
        saveBotData();
        return sock.sendMessage(from, { text: '✅ Group rules saved.' }, { quoted: msg });
    }
    const r = botData.groupRules[from];
    await sock.sendMessage(from, { text: r ? `📜 *Group Rules:*\n\n${r}` : 'ℹ️ No rules set. Use: `.rules set <text>`' }, { quoted: msg });
}

async function welcome(sock, from, msg, args, isGroup, isAdmin, botData, saveBotData, q) {
    if (!isGroup) return sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg });
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ Only an admin can use this.' }, { quoted: msg });
    if (!botData.welcomeGroups) botData.welcomeGroups = {};
    const sub = args[0];
    if (sub === 'on') {
        botData.welcomeGroups[from] = botData.welcomeGroups[from] || {};
        saveBotData();
        return sock.sendMessage(from, { text: '✅ Welcome messages are ON.' }, { quoted: msg });
    }
    if (sub === 'off') {
        delete botData.welcomeGroups[from];
        saveBotData();
        return sock.sendMessage(from, { text: '✅ Welcome messages are OFF.' }, { quoted: msg });
    }
    if (sub === 'set') {
        const message = q.slice(4).trim();
        if (!message) return sock.sendMessage(from, { text: '⚠️ Usage: `.welcome set <text>` (you can use @user and @group)' }, { quoted: msg });
        botData.welcomeGroups[from] = { message };
        saveBotData();
        return sock.sendMessage(from, { text: '✅ Custom welcome message saved.' }, { quoted: msg });
    }
    await sock.sendMessage(from, { text: '⚙️ Usage: `.welcome on` / `.welcome off` / `.welcome set <text>`' }, { quoted: msg });
}

async function goodbye(sock, from, msg, args, isGroup, isAdmin, botData, saveBotData, q) {
    if (!isGroup) return sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg });
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ Only an admin can use this.' }, { quoted: msg });
    if (!botData.goodbyeGroups) botData.goodbyeGroups = {};
    const sub = args[0];
    if (sub === 'on') {
        botData.goodbyeGroups[from] = botData.goodbyeGroups[from] || {};
        saveBotData();
        return sock.sendMessage(from, { text: '✅ Goodbye messages are ON.' }, { quoted: msg });
    }
    if (sub === 'off') {
        delete botData.goodbyeGroups[from];
        saveBotData();
        return sock.sendMessage(from, { text: '✅ Goodbye messages are OFF.' }, { quoted: msg });
    }
    if (sub === 'set') {
        const message = q.slice(4).trim();
        if (!message) return sock.sendMessage(from, { text: '⚠️ Usage: `.goodbye set <text>` (you can use @user)' }, { quoted: msg });
        botData.goodbyeGroups[from] = { message };
        saveBotData();
        return sock.sendMessage(from, { text: '✅ Custom goodbye message saved.' }, { quoted: msg });
    }
    await sock.sendMessage(from, { text: '⚙️ Usage: `.goodbye on` / `.goodbye off` / `.goodbye set <text>`' }, { quoted: msg });
}

async function poll(sock, from, msg, q) {
    if (!q || !q.includes('|')) {
        return sock.sendMessage(from, { text: '⚠️ Usage: `.poll Question | Option1 | Option2 | Option3`' }, { quoted: msg });
    }
    const parts = q.split('|').map(s => s.trim()).filter(Boolean);
    const question = parts[0];
    const options = parts.slice(1, 13);
    if (options.length < 2) {
        return sock.sendMessage(from, { text: '⚠️ Give at least 2 options.' }, { quoted: msg });
    }
    try {
        await sock.sendMessage(from, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1
            }
        }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: '❌ Could not create the poll.' }, { quoted: msg });
    }
}

module.exports = {
    groupname, groupdesc, membercount, adminlist, whois,
    chatid, runtime, rules, welcome, goodbye, poll
};
