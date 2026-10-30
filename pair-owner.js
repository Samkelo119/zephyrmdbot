const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, delay, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const path = require('path');
const fs = require('fs-extra');

const NUMBER = String(process.argv[2] || '27832573402').replace(/\D/g, '');
const AUTH_DIR = path.join(__dirname, 'auth_info', 'owner');

let pairingCodeSent = false;
let connected = false;

async function waitForSocket(sock) {
    for (let i = 0; i < 40; i++) {
        if (sock?.ws?.isOpen) return true;
        await delay(250);
    }
    return false;
}

async function start() {
    fs.ensureDirSync(AUTH_DIR);
    console.log(`[pair] starting for ${NUMBER}`);
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    if (state.creds.registered) {
        console.log('ALREADY_REGISTERED');
    }

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'fatal' })),
        },
        printQRInTerminal: false,
        logger: P({ level: 'fatal' }),
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection) console.log(`[pair] connection: ${connection}`);
        if (connection === 'open') {
            connected = true;
            console.log('[pair] CONNECTED as ' + (sock.user?.id || ''));
        }
        if (connection === 'close') {
            const status = lastDisconnect?.error?.output?.statusCode;
            const reason = lastDisconnect?.error?.message || '';
            console.log(`[pair] closed status=${status} reason=${reason}`);
            const loggedOut = status === DisconnectReason.loggedOut || status === 401;
            if (loggedOut) {
                console.log('[pair] logged out');
                process.exit(1);
            }
            await delay(3000);
            start().catch((err) => {
                console.error('[pair] restart error:', err?.message || err);
            });
        }
    });

    if (!state.creds.registered && !pairingCodeSent) {
        const ready = await waitForSocket(sock);
        if (!ready) {
            console.log('[pair] socket not open yet, waiting extra 3s');
            await delay(3000);
        } else {
            await delay(1500);
        }
        try {
            let code = await sock.requestPairingCode(NUMBER, 'ZEPHYRMD');
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            pairingCodeSent = true;
            console.log('PAIRING_CODE=' + code);
            console.log('[pair] Enter this code now: WhatsApp > Linked Devices > Link with phone number');
        } catch (err) {
            console.error('[pair] pairing error:', err?.message || err);
        }
    }
}

if (!fs.existsSync(path.join(AUTH_DIR, 'creds.json'))) {
    fs.ensureDirSync(AUTH_DIR);
} else {
    try {
        const creds = fs.readJsonSync(path.join(AUTH_DIR, 'creds.json'));
        if (!creds.registered) {
            fs.emptyDirSync(AUTH_DIR);
            console.log('[pair] cleared incomplete session');
        }
    } catch (e) {
        fs.emptyDirSync(AUTH_DIR);
        console.log('[pair] cleared unreadable session');
    }
}

start().catch((err) => {
    console.error('[pair] error:', err?.message || err);
    process.exit(1);
});
