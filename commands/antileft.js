const fs = require('fs');
const path = require('path');

const FOOTER = 'Pᴏᴡᴇʀᴇᴅ Bʏ MʀDɪᴇHᴀʀᴅTᴇᴄʜX𓃵';
const dataPath = path.join(__dirname, '..', 'data', 'antileft.json');

function ensureStore() {
    try {
        fs.mkdirSync(path.dirname(dataPath), { recursive: true });
        if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));
    } catch (e) {}
}

function readStore() {
    ensureStore();
    try { return JSON.parse(fs.readFileSync(dataPath, 'utf8')); }
    catch (e) { return {}; }
}

function writeStore(data) {
    ensureStore();
    try { fs.writeFileSync(dataPath, JSON.stringify(data, null, 2)); }
    catch (e) {}
}

function idsMatch(a, b) {
    const na = String(a || '').split('@')[0].split(':')[0];
    const nb = String(b || '').split('@')[0].split(':')[0];
    return !!(na && nb && na === nb);
}

function cleanNum(j) {
    return String(j || '').split('@')[0].split(':')[0];
}

async function isBotAdmin(sock, groupId) {
    try {
        const meta = await sock.groupMetadata(groupId);
        const botId = sock.user?.id || '';
        const botLid = sock.user?.lid || '';
        const me = meta.participants.find(p => idsMatch(p.id, botId) || idsMatch(p.id, botLid) || (p.lid && (idsMatch(p.lid, botId) || idsMatch(p.lid, botLid))));
        return !!(me && (me.admin === 'admin' || me.admin === 'superadmin'));
    } catch (e) {
        return false;
    }
}

async function antileft(sock, from, msg, isGroup, isAdmin, isOwner, q) {
    if (!isGroup) {
        return sock.sendMessage(from, { text: `This command is for groups only.\n\n${FOOTER}` }, { quoted: msg });
    }
    if (!isAdmin && !isOwner) {
        return sock.sendMessage(from, { text: `Admin or owner access required.\n\n${FOOTER}` }, { quoted: msg });
    }
    if (!(await isBotAdmin(sock, from))) {
        return sock.sendMessage(from, { text: `I need to be an admin to use this feature.\n\n${FOOTER}` }, { quoted: msg });
    }

    const store = readStore();
    const choice = String(q || '').trim().toLowerCase().split(/\s+/)[0];

    if (choice === 'on') {
        store[from] = { enabled: true };
        writeStore(store);
        return sock.sendMessage(from, {
            text: `ANTI-LEFT ENABLED\n\nMembers who try to leave this group will be re-added automatically.\nAdmins can still leave.\n\n${FOOTER}`
        }, { quoted: msg });
    }

    if (choice === 'off') {
        store[from] = { enabled: false };
        writeStore(store);
        return sock.sendMessage(from, {
            text: `ANTI-LEFT DISABLED\n\nMembers can now leave freely.\n\n${FOOTER}`
        }, { quoted: msg });
    }

    const status = store[from]?.enabled ? 'ENABLED' : 'DISABLED';
    return sock.sendMessage(from, {
        text: `ANTI-LEFT PROTECTION\n\nStatus: ${status}\n\nUsage:\n  .antileft on   - prevent leaves\n  .antileft off  - allow leaves\n\n${FOOTER}`
    }, { quoted: msg });
}

async function antiLeftWatcher(sock, update) {
    try {
        const groupId = update && update.id;
        const participants = (update && update.participants) || [];
        const action = update && update.action;
        if (!groupId || !String(groupId).endsWith('@g.us')) return;
        if (action !== 'remove') return;

        const store = readStore();
        if (!store[groupId] || !store[groupId].enabled) return;
        if (!(await isBotAdmin(sock, groupId))) return;

        let meta;
        try { meta = await sock.groupMetadata(groupId); }
        catch (e) { return; }

        const adminIds = [];
        for (const p of meta.participants) {
            if (p.admin === 'admin' || p.admin === 'superadmin') {
                adminIds.push(p.id);
                if (p.lid) adminIds.push(p.lid);
            }
        }

        const botJid = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';
        const botLid = sock.user?.lid ? String(sock.user.lid).split(':')[0] : '';
        const toReAdd = [];

        for (const p of participants) {
            const jid = typeof p === 'string' ? p : (p.id || p.jid);
            if (!jid) continue;
            if (adminIds.some(a => idsMatch(a, jid))) continue;
            if (idsMatch(botJid, jid)) continue;
            if (botLid && idsMatch(botLid, jid)) continue;
            toReAdd.push(jid);
        }

        if (!toReAdd.length) return;

        let added = false;
        try {
            await sock.groupParticipantsUpdate(groupId, toReAdd, 'add');
            added = true;
        } catch (e) {}

        if (!added) {
            const altIds = toReAdd.map(jid => {
                const num = String(jid).split('@')[0].split(':')[0];
                return String(jid).includes('@lid') ? num + '@s.whatsapp.net' : num + '@lid';
            });
            try {
                await sock.groupParticipantsUpdate(groupId, altIds, 'add');
                added = true;
            } catch (e) {}
        }

        const names = toReAdd.map(j => '@' + cleanNum(j)).join(', ');
        try {
            if (added) {
                await sock.sendMessage(groupId, {
                    text: `ANTI-LEFT\n\n${names} tried to leave and was re-added.\n\n${FOOTER}`,
                    mentions: toReAdd
                });
            } else {
                await sock.sendMessage(groupId, {
                    text: `ANTI-LEFT\n\nCould not re-add ${names}.\nTheir privacy settings may block group adds.\n\n${FOOTER}`,
                    mentions: toReAdd
                });
            }
        } catch (e) {}
    } catch (e) {}
}

module.exports = { antileft, antiLeftWatcher };
