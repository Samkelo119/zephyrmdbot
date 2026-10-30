const fs = require('fs-extra');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'user_settings.json');

function load() {
    try {
        if (fs.existsSync(FILE)) return fs.readJsonSync(FILE);
    } catch (e) {}
    return { users: {} };
}

function save(data) {
    try {
        fs.ensureDirSync(path.dirname(FILE));
        fs.writeJsonSync(FILE, data);
    } catch (e) {}
}

let store = load();
if (!store.users) store.users = {};

const OWNER_PN = '27832573402';
const OWNER_LIDS = new Set(['271090483986468']);

function keyOf(jid) {
    const digits = String(jid || '').replace(/[^0-9]/g, '') || String(jid || 'unknown');
    if (digits === OWNER_PN || OWNER_LIDS.has(digits)) return OWNER_PN;
    return digits;
}

function getUser(jid) {
    const key = keyOf(jid);
    if (!store.users[key]) store.users[key] = { prefix: '.', menuStyle: 1 };
    if (!store.users[key].prefix) store.users[key].prefix = '.';
    if (!store.users[key].menuStyle) store.users[key].menuStyle = 1;
    return store.users[key];
}

function getPrefix(jid) {
    return getUser(jid).prefix || '.';
}

function setPrefix(jid, prefix) {
    if (typeof prefix !== 'string' || prefix.length < 1 || prefix.length > 3) {
        throw new Error('Prefix must be 1-3 characters.');
    }
    const u = getUser(jid);
    u.prefix = prefix;
    save(store);
    return prefix;
}

function getMenuStyle(jid) {
    const n = parseInt(getUser(jid).menuStyle, 10);
    return (!n || n < 1 || n > 17) ? 1 : n;
}

function setMenuStyle(jid, style) {
    const n = parseInt(style, 10);
    if (!n || n < 1 || n > 17) throw new Error('Menu style must be 1-17.');
    const u = getUser(jid);
    u.menuStyle = n;
    save(store);
    return n;
}

module.exports = { keyOf, getUser, getPrefix, setPrefix, getMenuStyle, setMenuStyle };
