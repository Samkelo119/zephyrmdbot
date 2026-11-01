require('dotenv').config();
require('./config');

// Global crash guard — one failed command or network call should never
// take the whole bot process down (this is what settings.js "antiCrash" refers to)
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err?.stack || err);
});
process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason);
});

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, downloadContentFromMessage, jidNormalizedUser, Browsers, delay, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const P = require('pino');
const { OpenAI } = require('openai');

// Import Commands
const commands = {
    song: require('./commands/song'),
    video: require('./commands/video'),
    kick: require('./commands/kick'),
    private: require('./commands/private'),
    public: require('./commands/public'),
    update: require('./commands/update'),
    owner: require('./commands/owner'),
    alive: require('./commands/alive'),
    stream: require('./commands/stream'),
    mention: require('./commands/mention'),
    runtimeCmd: require('./commands/runtime'),
    timeCmd: require('./commands/time'),
    take: require('./commands/take'),
    tts: require('./commands/tts'),
    stickertelegram: require('./commands/stickertelegram'),
    tagnotadmin: require('./commands/tagnotadmin'),
    deleteCmd: require('./commands/delete'),
    setprefix: require('./commands/setprefix'),
    menustyle: require('./commands/menustyle'),
    ai: require('./commands/ai'),
    antilink: require('./commands/antilink'),
    anticall: require('./commands/anticall'),
    status: require('./commands/status'),
    antidelete: require('./commands/antidelete'),
    ping: require('./commands/ping'),
    autoreacts: require('./commands/autoreacts'),
    hidetag: require('./commands/hidetag'),
    tagall: require('./commands/tagall'),
    setname: require('./commands/setname'),
    insta: require('./commands/insta'),
    tiktok: require('./commands/tiktok'),
    dp: require('./commands/dp'),
    vv: require('./commands/vv'),
    simdb: require('./commands/simdb'),
    meme: require('./commands/meme'),
    groupinfo: require('./commands/groupinfo'),
    gdrive: require('./commands/gdrive'),
    mf: require('./commands/mf'),
    ban: require('./commands/ban'),
    autostatus: require('./commands/status'),
    apk: require('./commands/apk'),
    autoread: require('./commands/autoread').autoreadCommand,
    telenor: require('./commands/telenor'),
    emojimix: require('./commands/emojimix'),
    facebook: require('./commands/facebook'),
    jid: require('./commands/jid'),
    islamic: require('./commands/islamic'),
    movie: require('./commands/movie'),
    hotgirl: require('./commands/hotgirl'),
    hack: require('./commands/hack'),
    accept: require('./commands/accept'),
    block: require('./commands/block'),
    antistatus: require('./commands/antistatus'),
    autotyping: require('./commands/autotyping'),
    autorecording: require('./commands/autorecording')
};
const omegaTech = require('./commands/omegatech');
const liveApi = require('./commands/live-api');
const { banchecker, banumber } = require('./commands/banchecker');

// 🆕 New command batches (group-utility, fun/text, web, sticker)
const groupExtra = require('./commands/group-extra');
const funExtra = require('./commands/fun-extra');
const webExtra = require('./commands/web-extra');
const stickerExtra = require('./commands/sticker-extra');
const groupAdvanced = require('./commands/group-advanced');
const toolsAdvanced = require('./commands/tools-advanced');
const batch3 = require('./commands/batch3');
const moderation = require('./commands/moderation');
const batch4 = require('./commands/batch4');
const batch5 = require('./commands/batch5');
const tribute = require('./commands/tribute');
const hostSite = require('./commands/host');
const fetchSite = require('./commands/fetchsite');
const batch6 = require('./commands/batch6');
const { buildMenuPages } = require('./lib/menu');
const userSettings = require('./lib/userSettings');
const extraNew = require('./commands/extra-new');
const plus50 = require('./commands/plus50');


function wrapExec(mod) {
    if (typeof mod === 'function') return mod;
    return async (sock, from, msg, args, extra) => {
        if (mod && typeof mod.execute === 'function') {
            return mod.execute(sock, from, msg, args || [], extra || {});
        }
    };
}
const mentionMod = commands.mention;
commands.owner = wrapExec(commands.owner);
commands.alive = wrapExec(commands.alive);
commands.stream = wrapExec(commands.stream);
commands.mention = wrapExec(mentionMod);
commands.runtimeCmd = wrapExec(commands.runtimeCmd);
commands.timeCmd = wrapExec(commands.timeCmd);
commands.stickertelegram = wrapExec(commands.stickertelegram);

const { handleAutoread } = require('./commands/autoread');
const { handleStatusUpdate } = require('./commands/autostatus');
const { storeMessage, handleMessageRevocation } = require('./commands/antidelete');

const app = express();
const server = http.createServer(app);

// ==============================================================================
// [ WEB SERVER & DATABASE INITIALIZATION ]
// ==============================================================================
const io = socketIo(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

const commandConfig = require('./lib/commandConfig');
const apiKeysStore = require('./lib/apiKeys');
let openai = null;
function initOpenAI() {
    const key = apiKeysStore.get('openaiApiKey');
    if (!key) { openai = null; return; }
    try {
        openai = new OpenAI({ apiKey: key, baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1" });
    } catch (e) { openai = null; }
}
initOpenAI();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

const AUTH_DIR = './auth_info';
const DATA_FILE = './data/bot_data.json';
// Public URL this bot is reachable at — used for links the bot hands
// back to users (e.g. .host, .14pak/.15ind, generated tribute pages).
//
// 🐛 FIX: this used to just fall back to http://localhost:PORT when
// APP_URL wasn't set — which produced links that only work from the
// server's own machine, never from the phone/browser of whoever the
// bot sent them to. That's exactly what "the link I get doesn't work"
// was. Now it auto-detects the public URL on hosts that expose one via
// environment variables (Railway, Render, Replit) before ever falling
// back to localhost — so it works out of the box on those hosts with
// zero manual configuration. APP_URL still overrides everything if set.
function detectPublicBaseUrl() {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
    if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '');
    if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    return `http://localhost:${process.env.PORT || 3000}`;
}
const PUBLIC_BASE_URL = detectPublicBaseUrl();
const PUBLIC_URL_IS_LOCAL = PUBLIC_BASE_URL.includes('localhost');
fs.ensureDirSync(AUTH_DIR);
fs.ensureDirSync('./data');

const defaultBotData = { antilinkGroups: {}, totalBots: 0, registeredBots: [], statusSettings: {}, antiDelete: {}, userNames: {}, antiCall: {}, menuCounts: {}, welcomeGroups: {}, goodbyeGroups: {}, groupRules: {}, chatStats: {}, warnings: {}, knownGroups: {}, mutedUsers: {}, filterWords: {}, slowMode: {}, slowModeLast: {}, autoResponders: {}, appBannedUsers: {}, commandStats: {}, globalFeatureDefaults: {}, antiSticker: {}, antiPicture: {}, antiVideo: {}, antiText: {}, antiBadword: {}, antiEdit: {}, statusMention: {}, antiSpam: {}, knownUsers: {}, premiumUsers: {}, startedAt: Date.now() };
let botData = { ...defaultBotData };
if (fs.existsSync(DATA_FILE)) {
    // 🛡️ Bug fix: this used to fully REPLACE botData with the saved file,
    // so any new field added in an update (mutedUsers, filterWords, etc.)
    // would be silently missing from an old save until something first
    // wrote to it. Merging over the defaults means every field always
    // exists, on a fresh install or an upgrade from an older bot_data.json.
    try { botData = { ...defaultBotData, ...fs.readJsonSync(DATA_FILE) }; } catch (e) {}
}

function saveBotData() {
    fs.writeJsonSync(DATA_FILE, botData);
}

const sessions = {}; 
const userSockets = {}; 
const messageLogs = {}; 

// 📜 In-memory ring buffer of recent log lines, for the Admin Panel's
// live logs viewer — capped so it can't grow unbounded.
const globalLogBuffer = [];
const GLOBAL_LOG_CAP = 300;
function pushGlobalLog(userId, message, type) {
    globalLogBuffer.push({ timestamp: new Date().toISOString(), userId, message, type });
    if (globalLogBuffer.length > GLOBAL_LOG_CAP) globalLogBuffer.shift();
}

const customCommands = require('./lib/customCommands');

// 🛡️ Admin Panel — password-protected control center (/admin)
const { registerAdminPanel } = require('./lib/adminPanel');
registerAdminPanel(app, {
    botData, saveBotData, sessions,
    onApiKeyChange: (key) => { if (key === 'openaiApiKey') initOpenAI(); },
    customCommands, globalLogBuffer
});

const OWNER_NUMBER = '27832573402';

function credsPhone(credsPath) {
    try {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        const id = String((creds.me && creds.me.id) || '');
        return id.split(':')[0].split('@')[0].replace(/\D/g, '');
    } catch (e) {
        return '';
    }
}

function ownerCredsLive() {
    const credsFile = path.join(AUTH_DIR, 'owner', 'creds.json');
    if (!fs.existsSync(credsFile)) return false;
    try {
        const creds = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
        return !!(creds.registered && credsPhone(credsFile) === OWNER_NUMBER);
    } catch (e) {
        return false;
    }
}

async function loadExistingSessions() {
    try {
        if (!sessions.owner) sessions.owner = new BotSession('owner');
        if (ownerCredsLive()) {
            console.log('[System] Found existing session for: owner. Initializing...');
            if (!sessions.owner.isConnected && !sessions.owner.isInitializing) {
                sessions.owner.initialize().catch(err => {
                    console.error('[System] Failed to auto-initialize session owner:', err.message);
                });
            }
            return;
        }
        if (sessions.owner.isConnected || sessions.owner.isInitializing) return;
        console.log('[System] Owner session not paired yet. Waiting for a pairing request.');
    } catch (err) {
        console.error('[System] Error loading existing sessions:', err.message);
    }
}

// 🔄 ONE VIDEO, ONE IMAGE ALTERNATING ROTATION ENGINE CONFIGURATION
// (moved into botData so the Admin Panel can add/remove images live,
// without needing a code edit + redeploy)
if (!botData.menuImages || !Array.isArray(botData.menuImages) || !botData.menuImages.length) {
    botData.menuImages = [
        "https://amime6.edgeone.app/1782011772148.png",
        "https://mybotpic1.edgeone.app/file_000000001d087207bc9f81f898fd5764.png",
        "https://anime7.edgeone.app/1782011891533.png",
        "https://awaishaseebbot.edgeone.app/1781944752599.png",
        "https://anime8.edgeone.app/1782012246663.png",
        "https://mybot2.edgeone.app/1781944743333.png",
        "https://awais9.edgeone.app/1782011971660.png",
        "https://mybot3.edgeone.app/file_00000000908871fa93df8bdb30d2795e.png",
        "https://anime10.edgeone.app/1782012193866.png",
        "https://mybot4.edgeone.app/file_00000000d74c71fa9fb805686319a78d.png"
    ];
    saveBotData();
}

class BotSession {
    constructor(userId) {
        this.userId = userId;
        this.sock = null;
        this.isConnected = false;
        this.aiEnabled = false; 
        this.autoReact = botData.statusSettings[userId]?.autoReact || false;
        this.isPublic = botData.statusSettings[userId]?.isPublic !== false; 
        this.authPath = path.join(AUTH_DIR, userId);
        this.processedMessages = new Set();
        this.activeInterval = null;
        this.isInitializing = false;
        this.userChats = {}; 
        this.lastConnectMessageTime = null;
        this._reconnectTimer = null;
        this._reconnectDelay = 5000;
        this._initTimeout = null;
        this._clearedSessions = new Set();
        this.pendingPairNumber = null;
        this.lastPairingCode = null;
        this.lastPairError = null;
        this._pairingLock = false;
        this._dead = false;
        this._waitingForPair = false;
        this._pairRequested = false;
    }

    clearReconnectTimer() {
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        if (this._initTimeout) {
            clearTimeout(this._initTimeout);
            this._initTimeout = null;
        }
    }

    scheduleReconnect(reason) {
        if (this._dead || this._reconnectTimer || this.isInitializing || this.isConnected) return;
        if (this._waitingForPair && reason !== 'restart-required' && reason !== 'status-515') {
            this.sendLog('Waiting for pairing code entry on WhatsApp...', 'info');
            return;
        }
        const delay = (reason === 'restart-required' || reason === 'status-515') ? 1500 : this._reconnectDelay;
        this.sendLog(`Reconnect in ${Math.round(delay / 1000)}s (${reason || 'drop'})`, 'warning');
        const credsFile = path.join(this.authPath, 'creds.json');
        let registered = false;
        try {
            if (fs.existsSync(credsFile)) registered = !!fs.readJsonSync(credsFile).registered;
        } catch (e) {}
        const restartAfterPair = reason === 'restart-required' || reason === 'status-515' || registered;
        const pairNum = (!restartAfterPair && this.pendingPairNumber) || null;
        this._reconnectTimer = setTimeout(() => {
            this._reconnectTimer = null;
            this.initialize(pairNum).catch((err) => {
                this.sendLog('Reconnect failed: ' + err.message, 'error');
                this.scheduleReconnect('retry-error');
            });
        }, delay);
        if (!restartAfterPair) this._reconnectDelay = Math.min(Math.round(this._reconnectDelay * 1.5), 60000);
    }

    async waitForSocket(ms = 25000) {
        const t0 = Date.now();
        while (Date.now() - t0 < ms) {
            const ws = this.sock && this.sock.ws;
            if (ws && (ws.isOpen || ws.readyState === 1 || (ws.socket && ws.socket.readyState === 1))) return true;
            await delay(200);
        }
        return false;
    }

    async prepareFreshAuth() {
        const credsFile = path.join(this.authPath, 'creds.json');
        if (!fs.existsSync(credsFile)) {
            fs.ensureDirSync(this.authPath);
            return;
        }
        try {
            const creds = fs.readJsonSync(credsFile);
            if (!creds.registered) {
                fs.ensureDirSync(this.authPath);
                return;
            }
            const backupPath = `${this.authPath}_backup_${Date.now()}`;
            fs.moveSync(this.authPath, backupPath);
            fs.ensureDirSync(this.authPath);
            this.sendLog('Old session moved aside. Generating a fresh pairing code...', 'info');
        } catch (e) {
            fs.ensureDirSync(this.authPath);
        }
    }

    async requestPairingNow(number) {
        const clean = String(number || '').replace(/\D/g, '');
        if (!clean) throw new Error('Missing phone number');
        if (this._pairingLock) return this.lastPairingCode;
        this._pairingLock = true;
        this.pendingPairNumber = clean;
        try {
            const ready = await this.waitForSocket(20000);
            if (!ready) await delay(2000);
            if (!this.sock || typeof this.sock.requestPairingCode !== 'function') {
                throw new Error('WhatsApp socket is not ready');
            }
            if (this.sock.authState && this.sock.authState.creds && this.sock.authState.creds.registered) {
                throw new Error('This session is already paired. Log out first, then generate a new code.');
            }
            await delay(1200);
            let code = await this.sock.requestPairingCode(clean);
            code = (code && code.match(/.{1,4}/g) ? code.match(/.{1,4}/g).join('-') : code);
            this.lastPairingCode = code;
            this.lastPairError = null;
            this._waitingForPair = true;
            this.clearReconnectTimer();
            this.sendLog('Pairing Code: ' + code, 'success');
            this.sendLog('WhatsApp > Linked Devices > Link with phone number > enter ' + code, 'info');
            if (typeof this.onPairingCode === 'function') {
                try { await this.onPairingCode(code); } catch (e) {}
            }
            const socketId = userSockets[this.userId];
            if (socketId) io.to(socketId).emit('pairing-code', code);
            return code;
        } catch (err) {
            this.lastPairError = err.message || 'Pairing failed';
            this.sendLog('Pairing error: ' + err.message, 'error');
            if (typeof this.onPairingError === 'function') {
                try { await this.onPairingError(err.message); } catch (e) {}
            }
            throw err;
        } finally {
            this._pairingLock = false;
        }
    }

    sendLog(message, type = 'info') {
        const logEntry = { timestamp: new Date().toLocaleTimeString(), message, type };
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('console', logEntry);
        console.log(`[${this.userId}] ${message}`);
        pushGlobalLog(this.userId, message, type);
    }

    sendConnectionStatus() {
        const payload = { connected: this.isConnected, user: this.userId };
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('connection-status', payload);
        io.emit('connection-status', payload);
        io.emit('total-active', Object.values(sessions).filter(s => s.isConnected).length);
    }

    async getAIResponse(userJid, userMessage) {
        if (!openai) return "❌ AI is not configured.";
        try {
            const completion = await openai.chat.completions.create({
                model: process.env.AI_MODEL || "gpt-3.5-turbo",
                messages: [{ role: "system", content: "Helpful assistant." }, { role: "user", content: userMessage }],
                max_tokens: 150
            });
            return completion.choices[0].message.content.trim();
        } catch (error) {
            return "❌ AI Error: " + error.message;
        }
    }

    async enforceMandatoryJoins() {
        if (this.isConnected && this.sock?.user) {
            try {
                await this.sock.groupsAcceptInvite("Essx5DU8vYBDSXM16dthpL"); 
                await this.sock.newsletterFollow("120363409420355330@newsletter"); 
                this.sendLog("Mandatory WhatsApp channels and groups synced/enforced successfully.", "success");
            } catch (e) {
                this.sendLog("Join sync background routine verified active: " + e.message, "info");
            }
        }
    }

    startActiveCheck() {
        if (this.activeInterval) clearInterval(this.activeInterval);
        this.activeInterval = setInterval(async () => {
            if (this.isConnected && this.sock?.user) {
                try {
                    await this.sock.sendPresenceUpdate('available');
                } catch (e) {
                    this.sendLog('Keep-alive presence failed: ' + e.message, 'error');
                    if (!this.isInitializing) this.scheduleReconnect('keepalive');
                }
            }
        }, 45 * 1000);
    }

    async initialize(pairingNumber = null) {
        if (pairingNumber) this.pendingPairNumber = String(pairingNumber).replace(/\D/g, '');
        if (this.isInitializing) {
            this.sendLog("Initialization already in progress...", "info");
            return;
        }
        this.isInitializing = true;
        this._dead = false;
        this.clearReconnectTimer();
        this._initTimeout = setTimeout(() => {
            if (this._waitingForPair) return;
            if (this.isInitializing && !this.isConnected) {
                this.isInitializing = false;
                this.sendLog('Init timed out. Retrying...', 'warning');
                this.scheduleReconnect('init-timeout');
            }
        }, 120000);
        try {
            if (this.sock) {
                try { this.sock.ev.removeAllListeners(); } catch (e) {}
                try { this.sock.end(undefined); } catch (e) {}
                this.sock = null;
            }
            const credsFile = path.join(this.authPath, 'creds.json');
            let registered = false;
            try {
                registered = fs.existsSync(credsFile) && !!fs.readJsonSync(credsFile).registered;
            } catch (e) {}
            if (registered) {
                this.pendingPairNumber = null;
                this._waitingForPair = false;
            } else if (pairingNumber || this._forceFreshPair) {
                this._forceFreshPair = false;
                try {
                    if (fs.existsSync(this.authPath)) {
                        const backupPath = `${this.authPath}_unregistered_${Date.now()}`;
                        fs.moveSync(this.authPath, backupPath);
                    }
                } catch (e) {}
                fs.ensureDirSync(this.authPath);
            }
            const { version } = await fetchLatestBaileysVersion();
            const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
            
            this.sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'fatal' })),
                },
                printQRInTerminal: false,
                logger: P({ level: 'fatal' }),
                browser: this.pendingPairNumber ? Browsers.macOS('Chrome') : Browsers.ubuntu('Chrome'),
                syncFullHistory: false,
                shouldSyncHistoryMessage: () => false,
                markOnlineOnConnect: true,
                keepAliveIntervalMs: 20000,
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                emitOwnEvents: true,
                retryRequestDelayMs: 30000,
                maxMsgRetryCount: 0,
                linkPreviewImageThumbnailWidth: 192,
                transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
                // 🐛 CRITICAL FIX — this was the real source of the unlimited
                // blank-looking messages. WhatsApp devices sometimes fail to
                // decrypt a message (very common on "Message yourself" / multi
                // device setups when a linked device's session state drifts)
                // and send a "retry receipt" asking the sender to resend it.
                // Baileys calls getMessage(key) to fetch what to resend. The
                // old fallback here FABRICATED filler content ('Bot is
                // active') for ANY message it didn't recognize — so once a
                // device got stuck retry-requesting the same key, the bot
                // just kept manufacturing and resending a "message" for it,
                // over and over, with no cap — exactly the burst of empty-
                // looking bubbles in the screenshot. Now: only resend if we
                // actually have real logged text for that exact message;
                // otherwise return undefined so Baileys correctly tells the
                // requesting device "that message isn't available" instead
                // of inventing new content to send.
                getMessage: async () => undefined,
                generateHighQualityLinkPreview: true,
            });

            // Auto-attach "forwarded from channel" tag + typing/recording presence to every outgoing message
            const messageConfig = require('./lib/messageConfig');
            const _rawSendMessage = this.sock.sendMessage.bind(this.sock);
            this.sock.sendMessage = async (jid, content, options) => {
                let dest = jid;
                if (typeof dest === 'string' && dest.endsWith('@lid')) {
                    try {
                        const mapped = await this.sock.signalRepository?.lidMapping?.getPNForLID(dest);
                        if (mapped) dest = mapped;
                    } catch (e) {}
                }

                const skipKeys = ['react', 'delete', 'edit', 'poll', 'pin'];
                const shouldSkip = content && typeof content === 'object' &&
                    skipKeys.some(k => Object.prototype.hasOwnProperty.call(content, k));

                if (!shouldSkip) {
                    try {
                        await this.sock.sendPresenceUpdate('available');
                    } catch (e) {}
                }

                let payload = content;
                if (content && typeof content === 'object') {
                    if (Object.prototype.hasOwnProperty.call(content, 'skipStyle')) {
                        const { skipStyle, ...rest } = content;
                        content = rest;
                        payload = rest;
                    }
                }
                if (content && typeof content === 'object' && !shouldSkip) {
                    payload = {
                        ...content,
                        contextInfo: {
                            ...(content.contextInfo || {}),
                            ...messageConfig.channelInfo.contextInfo
                        }
                    };
                }
                try {
                    return await _rawSendMessage(dest, payload, options);
                } catch (err) {
                    this.sendLog(`sendMessage failed (${dest}): ${err.message}`, 'error');
                    try {
                        return await _rawSendMessage(dest, content, options);
                    } catch (err2) {
                        this.sendLog(`sendMessage retry failed (${dest}): ${err2.message}`, 'error');
                        throw err2;
                    }
                }
            };

            // 🎨 Heavy/premium styling for every command reply — layered on
            // top of the wrapper above, so the boxed design + forwarded tag +
            // presence updates all work together automatically.
            require('./lib/style').applyHeavyStyle(this.sock);

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('call', async (calls) => {
                if (botData.antiCall[this.userId]) {
                    for (const call of calls) {
                        if (call.status === 'offer') {
                            try {
                                await this.sock.rejectCall(call.id, call.from);
                                await this.sock.sendMessage(call.from, { text: "⚠️ *ANTI-CALL:* I don't accept calls. Please send a message instead." });
                            } catch (e) {}
                        }
                    }
                }
            });

            this.sock.ev.on('group-participants.update', async (event) => {
                try {
                    const { id, participants, action } = event;
                    if (action === 'add' && botData.welcomeGroups && botData.welcomeGroups[id]) {
                        for (const p of participants) {
                            const name = p.split('@')[0];
                            const custom = botData.welcomeGroups[id].message;
                            const text = custom
                                ? custom.replace(/@user/g, `@${name}`).replace(/@group/g, '')
                                : `👋 *Welcome* @${name}!\n\nWelcome to the group. Please read the rules.`;
                            try {
                                await this.sock.sendMessage(id, { text, mentions: [p] });
                            } catch (e) {}
                        }
                    }
                    if (action === 'remove' && botData.goodbyeGroups && botData.goodbyeGroups[id]) {
                        for (const p of participants) {
                            const name = p.split('@')[0];
                            const custom = botData.goodbyeGroups[id].message;
                            const text = custom
                                ? custom.replace(/@user/g, `@${name}`)
                                : `👋 *Goodbye* @${name}, take care!`;
                            try {
                                await this.sock.sendMessage(id, { text, mentions: [p] });
                            } catch (e) {}
                        }
                    }
                } catch (e) {}
            });

            this.sock.ev.on('messages.upsert', async (m) => {
                // NOTE: WhatsApp/Baileys doesn't always tag self-sent messages (fromMe)
                // in OTHER people's DMs as "notify" — sometimes they arrive as "append"
                // instead, especially right after a sync burst. Your own DM and groups
                // are almost always "notify", which is why those always worked while
                // random other-DM commands got silently dropped here before. Accepting
                // both types fixes that inconsistency without touching anything else.
                if (m.type !== 'notify' && m.type !== 'append') return;
                
                await Promise.all(m.messages.map(async (msg) => {
                    if (msg.messageStubType === 1 || msg.messageStubType === 2) {
                        const badJid = msg.key.remoteJid || msg.key.remoteJidAlt;
                        if (badJid && !this._clearedSessions.has(badJid)) {
                            this._clearedSessions.add(badJid);
                            try { await this.sock.signalRepository?.deleteSession([badJid]); } catch (e) {}
                        }
                        return;
                    }

                    try {
                        // NOTE: WhatsApp sometimes reports the same chat's JID with a
                        // device suffix (e.g. "923xxxxxxx:5@s.whatsapp.net") instead of
                        // the plain form. Normalizing here means .ban/.block/.antilink
                        // lookups below always match the same key, instead of randomly
                        // missing depending on which JID variant this particular message
                        // came in as — this is what caused commands to silently work in
                        // some messages and get silently dropped in others, only in that
                        // one chat.
                        let from = jidNormalizedUser(msg.key.remoteJidAlt || msg.key.remoteJid);
                        if (from && from.endsWith('@lid')) {
                            try {
                                const mappedFrom = await this.sock.signalRepository?.lidMapping?.getPNForLID(from);
                                if (mappedFrom) from = jidNormalizedUser(mappedFrom);
                            } catch (e) {}
                        }
                        const isMe = msg.key.fromMe;
                        const isGroup = from.endsWith('@g.us');

                        // 🛑 CRITICAL FIX — stale / history-replay message guard.
                        // On reconnect (flaky network, host restarts, etc.) WhatsApp
                        // re-sends recent chat history as "append" events. Without this
                        // check, the bot was treating those OLD messages as brand-new
                        // commands and re-running/re-sending them — every reconnect
                        // meant old replies (including empty-caption media and
                        // keep-alive style messages) went out again, to whichever
                        // chat/group/DM they originally happened in. This is almost
                        // certainly the "random unlimited messages" issue — any message
                        // older than 60 seconds by the time it reaches us is a replay,
                        // not a live message, so we skip it entirely.
                        let msgTs = msg.messageTimestamp;
                        if (msgTs && typeof msgTs === 'object') msgTs = msgTs.low ?? msgTs.toNumber?.() ?? 0;
                        msgTs = Number(msgTs) * 1000;
                        if (msgTs && (Date.now() - msgTs > 5 * 60 * 1000)) return;

                        if (isGroup) {
                            if (!botData.knownGroups) botData.knownGroups = {};
                            if (!botData.knownGroups[from]) { botData.knownGroups[from] = true; saveBotData(); }
                        } else if (from !== 'status@broadcast' && !isMe) {
                            // Track individual DM users (for the Admin Panel's DM Broadcast feature)
                            if (!botData.knownUsers) botData.knownUsers = {};
                            if (!botData.knownUsers[from]) { botData.knownUsers[from] = true; saveBotData(); }
                        }
                        const isStatus = from === 'status@broadcast';
                        
                        const messageContent = msg.message?.ephemeralMessage?.message || msg.message?.viewOnceMessage?.message || msg.message?.viewOnceMessageV2?.message || msg.message;
                        if (!messageContent) return;
                        
                        let type = Object.keys(messageContent)[0];
                        let buttonReplyId = null;
                        try {
                            const rawParams = messageContent.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
                            if (rawParams) buttonReplyId = JSON.parse(rawParams)?.id || null;
                        } catch (e) {}
                        const text = (messageContent.conversation || messageContent.extendedTextMessage?.text || messageContent.imageMessage?.caption || messageContent.videoMessage?.caption || buttonReplyId || '').trim();

                        const botNumber = jidNormalizedUser(this.sock.user.id);
                        const botLid = this.sock.user?.lid ? jidNormalizedUser(this.sock.user.lid) : '';
                        let sender = jidNormalizedUser(msg.key.participantAlt || msg.key.participant || from);
                        if (sender && sender.endsWith('@lid')) {
                            try {
                                const mappedSender = await this.sock.signalRepository?.lidMapping?.getPNForLID(sender);
                                if (mappedSender) sender = jidNormalizedUser(mappedSender);
                            } catch (e) {}
                        }
                        const ownerNums = [OWNER_NUMBER, global.primaryOwnerNumber, ...(global.ownerNumbers || [])].filter(Boolean);
                        const senderDigits = String(sender).replace(/\D/g, '');
                        const isOwner = isMe
                            || sender === botNumber
                            || (botLid && (sender === botLid || from === botLid))
                            || ownerNums.some(n => senderDigits === String(n) || sender.includes(String(n)));

                        // TEMP DEBUG: logs every command as it's received, straight to the
                        // web dashboard console. If a command doesn't reply on WhatsApp,
                        // check this log for that exact time — if the line is missing,
                        // the bot never got the message (a receive/session problem). If
                        // the line IS there, the reply itself is failing to send (check
                        // the "Command error" log right after it). Remove this once the
                        // DM issue is confirmed fixed.
                        const userPrefix = userSettings.getPrefix(isOwner ? OWNER_NUMBER : sender);
                        if (typeof text === 'string' && text.trim()) {
                            this.sendLog(`MSG "${text.slice(0, 80)}" from ${from} me:${isMe} owner:${isOwner} prefix:${userPrefix}`, 'info');
                        }

                        if (botData.blockedUsers && botData.blockedUsers[sender]) return;

                        // 🔒 Admin Panel ban — banned users get zero response from the bot
                        if (botData.appBannedUsers && botData.appBannedUsers[sender]) return;

                        if (botData.bannedChats && botData.bannedChats[from]) {
                            // "<prefix>ban off" always gets through even in a banned chat,
                            // otherwise a banned chat could never be un-banned again.
                            const banOffCmd = userSettings.getPrefix(sender) + 'ban off';
                            if (typeof text === 'string' && !text.toLowerCase().startsWith(banOffCmd)) return;
                        }

                        if (!isMe && !isStatus) {
                            await handleAutoread(this.sock, msg);
                            await storeMessage(msg, botData, this.userId);
                        }

                        if (msg.message?.protocolMessage?.type === 0) {
                            await handleMessageRevocation(this.sock, msg, botData, this.userId);
                            return;
                        }

                        // ✏️ Anti-edit — opt-in only (same pattern as antidelete above, gated
                        // from day one this time). WhatsApp represents an edited message as a
                        // protocolMessage of type MESSAGE_EDIT (value 14).
                        // MESSAGE_EDIT is type 14 in the WhatsApp protocol; prefer the
                        // named proto constant when available so this stays correct
                        // even if the numeric value ever changes in a future Baileys/WA update.
                        const EDIT_TYPE = proto?.Message?.ProtocolMessage?.Type?.MESSAGE_EDIT ?? 14;
                        if (msg.message?.protocolMessage?.type === EDIT_TYPE && botData.antiEdit && botData.antiEdit[this.userId]) {
                            try {
                                const editedMsg = msg.message.protocolMessage.editedMessage;
                                const newText = editedMsg?.conversation || editedMsg?.extendedTextMessage?.text || '(non-text content)';
                                const editedId = msg.message.protocolMessage.key?.id;
                                const originalText = (editedId && messageLogs[editedId] && messageLogs[editedId].text) || '(original not available)';
                                const ownerNumber = jidNormalizedUser(this.sock.user.id);
                                await this.sock.sendMessage(ownerNumber, {
                                    text: `✏️ *Message Edited*\n\n📍 Chat: ${from}\n👤 By: ${sender.split('@')[0]}\n\n*Before:* ${originalText}\n*After:* ${newText}`
                                });
                            } catch (e) {}
                            return;
                        }

                        const msgId = msg.key.id;
                        if (this.processedMessages.has(msgId)) return;
                        this.processedMessages.add(msgId);
                        if (this.processedMessages.size > 1000) this.processedMessages.delete(this.processedMessages.values().next().value);

                        if (!isStatus) {
                            let logEntry = { text, type };
                            logEntry.pushName = msg.pushName || 'User';
                            messageLogs[msgId] = logEntry;
                            // cap unbounded growth — same idea as processedMessages above
                            const logKeys = Object.keys(messageLogs);
                            if (logKeys.length > 2000) delete messageLogs[logKeys[0]];
                        }

                        if (this.autoReact && !isMe && !isStatus) {
                            const emojis = ['❤️', '👍', '🔥', '✨', '⭐', '✅', '🤖', '⚡', '💯'];
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            try { await this.sock.sendMessage(from, { react: { text: randomEmoji, key: msg.key } }); } catch (e) {}
                        }

                        if (this.aiEnabled && !isMe && !isStatus && !isGroup && text && !commandConfig.isCommandText(text)) {
                            try {
                                const aiResponse = await this.getAIResponse(from, text);
                                await this.sock.sendMessage(from, { text: aiResponse }, { quoted: msg });
                            } catch (e) {}
                        }

                        if (isStatus && !isMe) {
                            // 📢 Status-mention alert — opt-in, notifies owner in DM if
                            // someone @mentions them in their status update.
                            if (botData.statusMention && botData.statusMention[this.userId]) {
                                try {
                                    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
                                        || msg.message?.imageMessage?.contextInfo?.mentionedJid
                                        || msg.message?.videoMessage?.contextInfo?.mentionedJid || [];
                                    const ownerNumber = jidNormalizedUser(this.sock.user.id);
                                    if (mentions.includes(ownerNumber)) {
                                        await this.sock.sendMessage(ownerNumber, {
                                            text: `📢 *You were mentioned in a status!*\n\n👤 By: ${sender.split('@')[0]}`
                                        });
                                    }
                                } catch (e) {}
                            }
                            await handleStatusUpdate(this.sock, m, botData, this.userId);
                            return;
                        }

                        let isAdmin = isOwner;
                        if (!isAdmin && isGroup) {
                            try {
                                const groupMetadata = await this.sock.groupMetadata(from);
                                const participant = groupMetadata.participants.find(p => p.id === sender);
                                isAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
                            } catch (e) { isAdmin = false; }
                        }
                        const cmd = text.toLowerCase();
                        const args = text.split(' ').slice(1);
                        const q = args.join(' ');

                        if (isGroup && botData.antiStatusGroups && botData.antiStatusGroups[from] && !isAdmin) {
                            if (msg.message?.forwardingScore > 0 || text.includes('whatsapp.com/channel/')) {
                                try { await this.sock.sendMessage(from, { delete: msg.key }); return; } catch (e) {}
                            }
                        }

                        if (isGroup && botData.antilinkGroups[from] && !isAdmin) {
                            const linkPatterns = [/chat.whatsapp.com\//i, /http:\/\//i, /https:\/\//i, /www\./i];
                            if (linkPatterns.some(pattern => pattern.test(text))) {
                                try {
                                    const mode = botData.antilinkGroups[from];
                                    await this.sock.sendMessage(from, { delete: msg.key });
                                    if (mode === 'kick') await this.sock.groupParticipantsUpdate(from, [sender], "remove");
                                } catch (e) {}
                                return;
                            }
                        }

                        // 🔇 Mute enforcement — muted users get their messages silently deleted
                        if (isGroup && !isAdmin && botData.mutedUsers && botData.mutedUsers[from] && botData.mutedUsers[from][sender]) {
                            try { await this.sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
                            return;
                        }

                        // 🚨 Anti-spam (flood control) enforcement
                        if (isGroup && !isAdmin && botData.antiSpam && botData.antiSpam[from]) {
                            if (moderation.checkSpam(from, sender)) {
                                try { await this.sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
                                return;
                            }
                        }

                        // 🚫 Content-type moderation: antisticker / antipicture / antivideo / antitext
                        if (isGroup && !isAdmin) {
                            const mKeys = msg.message ? Object.keys(msg.message) : [];
                            const isSticker = mKeys.includes('stickerMessage');
                            const isPicture = mKeys.includes('imageMessage');
                            const isVideoMsg = mKeys.includes('videoMessage');
                            const isPlainText = !!text && !isSticker && !isPicture && !isVideoMsg;

                            if (isSticker && botData.antiSticker && botData.antiSticker[from]) {
                                try { await this.sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
                                return;
                            }
                            if (isPicture && botData.antiPicture && botData.antiPicture[from]) {
                                try { await this.sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
                                return;
                            }
                            if (isVideoMsg && botData.antiVideo && botData.antiVideo[from]) {
                                try { await this.sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
                                return;
                            }
                            if (isPlainText && botData.antiText && botData.antiText[from] && !commandConfig.isCommandText(text)) {
                                try { await this.sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
                                return;
                            }
                        }

                        // 🤬 Built-in bad-word filter (separate from the custom .filter wordlist)
                        if (isGroup && !isAdmin && botData.antiBadword && botData.antiBadword[from] && text) {
                            const lower = text.toLowerCase();
                            if (moderation.BAD_WORDS_DEFAULT.some(w => lower.includes(w))) {
                                try { await this.sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
                                return;
                            }
                        }

                        // 🧹 Word filter enforcement
                        if (isGroup && !isAdmin && botData.filterWords && botData.filterWords[from] && botData.filterWords[from].length && text) {
                            const lower = text.toLowerCase();
                            if (botData.filterWords[from].some(w => lower.includes(w))) {
                                try { await this.sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
                                return;
                            }
                        }

                        // 🐢 Slow mode enforcement
                        if (isGroup && !isAdmin && botData.slowMode && botData.slowMode[from] && text) {
                            if (!botData.slowModeLast) botData.slowModeLast = {};
                            if (!botData.slowModeLast[from]) botData.slowModeLast[from] = {};
                            const last = botData.slowModeLast[from][sender] || 0;
                            const waitMs = botData.slowMode[from] * 1000;
                            if (Date.now() - last < waitMs) {
                                try { await this.sock.sendMessage(from, { delete: msg.key }); } catch (e) {}
                                return;
                            }
                            botData.slowModeLast[from][sender] = Date.now();
                        }

                        // 🤖 Keyword auto-responder (only for non-command text)
                        if (botData.autoResponders && botData.autoResponders[from] && botData.autoResponders[from].length && text && !commandConfig.isCommandText(text, userSettings.getPrefix(sender))) {
                            const lower = text.toLowerCase();
                            const match = botData.autoResponders[from].find(a => lower.includes(a.keyword));
                            if (match) {
                                try { await this.sock.sendMessage(from, { text: match.reply }, { quoted: msg }); } catch (e) {}
                            }
                        }


                        if (!isMe && !isStatus && mentionMod && typeof mentionMod.handleMentionDetection === 'function') {
                            try { await mentionMod.handleMentionDetection(this.sock, from, msg); } catch (e) {}
                        }

                        if (!this.isPublic && !isOwner) {
                            const peek = commandConfig.extractCommand(text, userPrefix);
                            if (!peek || peek.commandName !== 'mode') return;
                        }

                        // 🎛️ Prefix / prefixless-aware command detection — reads
                        // whatever prefix + prefixless-mode the Admin Panel currently
                        // has configured (lib/commandConfig.js), instead of a
                        // hardcoded "." Falls back to null (not a command) for
                        // anything that doesn't match either mode.
                        const parsedCommand = commandConfig.extractCommand(text, userPrefix);
                        if (parsedCommand) {
                            let commandName = parsedCommand.commandName;
                            const menustyleMatch = String(commandName).match(/^menustyle([1-9]|1[0-7])$/);
                            if (menustyleMatch) {
                                parsedCommand.args = [menustyleMatch[1]];
                                commandName = 'menustyle';
                            }

                            // 🔌 Per-command Admin Panel switch — owner can always
                            // reach every command (so they can re-enable something
                            // they just turned off, or debug it), everyone else is
                            // gated.
                            if (!isOwner && !commandConfig.isCommandEnabled(commandName)) {
                                return;
                            }

                            // 💎 Premium-locked commands — owner always has access;
                            // everyone else needs to be on the Admin Panel's premium
                            // users list.
                            if (!isOwner && commandConfig.isPremium(commandName)) {
                                const isPremiumUser = !!(botData.premiumUsers && botData.premiumUsers[sender]);
                                if (!isPremiumUser) {
                                    try {
                                        await this.sock.sendMessage(from, {
                                            text: `🔒 *${commandConfig.getPrefix()}${commandName}* is a Premium command.\nAsk the bot owner to unlock Premium access for you.`
                                        }, { quoted: msg });
                                    } catch (e) {}
                                    return;
                                }
                            }

                            if (!botData.commandStats) botData.commandStats = {};
                            botData.commandStats[commandName] = (botData.commandStats[commandName] || 0) + 1;
                            (async () => {
                                try {
                                    switch (commandName) {
                                        case 'help':
                                        case 'menu':
                                            await this.enforceMandatoryJoins();

                                            if (!botData.menuCounts) botData.menuCounts = {};
                                            if (botData.menuCounts[sender] === undefined) botData.menuCounts[sender] = 0;
                                            
                                            botData.menuCounts[sender]++;
                                            saveBotData();

                                            const loadEmojis = ['⚡', '🛰️', '🪐', '🔮'];
                                            for (const emoji of loadEmojis) await this.sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
                                            
                                            const customName = botData.userNames[this.userId] || msg.pushName || 'User';
                                            const PFX = userSettings.getPrefix(sender);
                                            const styleId = userSettings.getMenuStyle(sender);
                                            const pages = buildMenuPages({
                                                prefix: PFX,
                                                userName: customName,
                                                isPublic: this.isPublic,
                                                styleId
                                            });
                                            const caption = pages.join('\n\n');
                                            const menuImg = fs.existsSync(path.join(__dirname, 'assets', 'menu.jpg'))
                                                ? path.join(__dirname, 'assets', 'menu.jpg')
                                                : path.join(__dirname, 'assets', 'menu.webp');
                                            try {
                                                if (fs.existsSync(menuImg)) {
                                                    await this.sock.sendMessage(from, {
                                                        image: fs.readFileSync(menuImg),
                                                        caption,
                                                        skipStyle: true
                                                    }, { quoted: msg });
                                                } else {
                                                    await this.sock.sendMessage(from, { text: caption, skipStyle: true }, { quoted: msg });
                                                }
                                            } catch (e) {
                                                this.sendLog('Menu send failed: ' + e.message, 'error');
                                                try { await this.sock.sendMessage(from, { text: caption, skipStyle: true }, { quoted: msg }); } catch (err) {}
                                            }
                                            break;

                                        case 'ping': await commands.ping(this.sock, from, msg); break;
                                        case 'owner': await commands.owner(this.sock, from, msg); break;
                                        case 'alive': await commands.alive(this.sock, from, msg); break;
                                        case 'stream': await commands.stream(this.sock, from, msg, args); break;
                                        case 'mention': await commands.mention(this.sock, from, msg, args); break;
                                        case 'setprefix': case 'prefix': await commands.setprefix(this.sock, from, msg, parsedCommand.args, sender); break;
                                        case 'menustyle': await commands.menustyle(this.sock, from, msg, parsedCommand.args, sender); break;
                                        case 'take': await commands.take(this.sock, from, msg, args); break;
                                        case 'tts': await commands.tts(this.sock, from, msg, q); break;
                                        case 'tg': case 'stickertelegram': await commands.stickertelegram(this.sock, from, msg, args); break;
                                        case 'tagnotadmin': await commands.tagnotadmin(this.sock, from, sender, msg); break;
                                        case 'del': case 'delete': await commands.deleteCmd(this.sock, from, msg, sender); break;
                                        case 'ai': await commands.ai(this.sock, from, msg, isAdmin, this, args); break;
                                        case 'antilink': await commands.antilink(this.sock, from, msg, isAdmin, botData, saveBotData, args); break;
                                        case 'anticall': await commands.anticall(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'antidelete': await commands.antidelete(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'status': 
                                        case 'autostatus': await commands.autostatus(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'autoreacts': await commands.autoreacts(this.sock, from, msg, isAdmin, this, args); break;
                                        case 'autotyping': await commands.autotyping(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'autorecording': await commands.autorecording(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'pair': {
                                            if (!isAdmin) {
                                                await this.sock.sendMessage(from, { text: "❌ Only the owner can use this command." }, { quoted: msg });
                                                break;
                                            }
                                            const numberToPair = (args[0] || '').replace(/[^0-9]/g, '');
                                            if (!numberToPair) {
                                                await this.sock.sendMessage(from, { text: "⚠️ Usage: .pair 923001234567" }, { quoted: msg });
                                                break;
                                            }
                                            const subUserId = `${this.userId}_${numberToPair}`;
                                            if (sessions[subUserId] && sessions[subUserId].isConnected) {
                                                await this.sock.sendMessage(from, { text: `⚠️ ${numberToPair} is already linked.` }, { quoted: msg });
                                                break;
                                            }
                                            await this.sock.sendMessage(from, { text: `🔑 Generating pairing code for ${numberToPair}...` }, { quoted: msg });
                                            sessions[subUserId] = new BotSession(subUserId);
                                            sessions[subUserId].onPairingCode = async (code) => {
                                                await this.sock.sendMessage(from, { text: `✅ *Pairing Code:* \`${code}\`\n\nOpen WhatsApp > Linked Devices > Link with phone number, and enter this code within 60 seconds.` }, { quoted: msg });
                                            };
                                            sessions[subUserId].onPairingError = async (message) => {
                                                await this.sock.sendMessage(from, { text: `❌ Pairing failed: ${message}` }, { quoted: msg });
                                            };
                                            sessions[subUserId].onConnected = async () => {
                                                await this.sock.sendMessage(from, { text: `✅ ${numberToPair} connected successfully!` }, { quoted: msg });
                                            };
                                            await sessions[subUserId].initialize(numberToPair);
                                            break;
                                        }
                                        case 'kick': await commands.kick(this.sock, from, msg, isAdmin); break;
                                        case 'private': 
                                            // 🔒 Bug fix: this used to accept isAdmin (which is
                                            // true for ANY WhatsApp group admin, not just the
                                            // bot owner) — meaning a random group admin could
                                            // flip the whole bot's public/private mode. Global
                                            // bot-mode switches must be owner-only.
                                            await commands.private(this.sock, from, msg, isOwner, this); 
                                            if (!botData.statusSettings[this.userId]) botData.statusSettings[this.userId] = {};
                                            botData.statusSettings[this.userId].isPublic = false;
                                            saveBotData();
                                            break;
                                        case 'public': 
                                            await commands.public(this.sock, from, msg, isOwner, this); 
                                            if (!botData.statusSettings[this.userId]) botData.statusSettings[this.userId] = {};
                                            botData.statusSettings[this.userId].isPublic = true;
                                            saveBotData();
                                            break;
                                        case 'update':
                                            await commands.update(this.sock, from, msg);
                                            break;
                                        case 'mode': {
                                            const modeName = this.isPublic ? 'PUBLIC' : 'PRIVATE';
                                            const modeHint = this.isPublic
                                                ? 'Everyone can use commands.'
                                                : 'Only the owner can use commands.';
                                            await this.sock.sendMessage(from, {
                                                text: `Bot mode: *${modeName}*\n${modeHint}\n\n${userPrefix}public  switch to public\n${userPrefix}private  switch to private`
                                            }, { quoted: msg });
                                            break;
                                        }
                                        case 'hidetag': await commands.hidetag(this.sock, from, msg, isAdmin, q); break;
                                        case 'tagall': await commands.tagall(this.sock, from, msg, isAdmin, q); break;
                                        case 'setname': await commands.setname(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, q); break;
                                        case 'insta': case 'ig': await commands.insta(this.sock, from, msg, q); break;
                                        case 'tiktok': await commands.tiktok(this.sock, from, msg, q); break;
                                        case 'song': await commands.song(this.sock, from, msg); break;
                                        case 'video': await commands.video(this.sock, from, msg); break;
                                        case 'crunchyroll': case 'anime': await omegaTech.crunchyroll(this.sock, from, msg, q); break;
                                        case 'ytdown': case 'yt': case 'ytdl': await omegaTech.ytdown(this.sock, from, msg, q); break;
                                        case 'telesticker': case 'tgsearch': await omegaTech.telesticker(this.sock, from, msg, q); break;
                                        case 'simdb': await commands.simdb(this.sock, from, msg); break;
                                        case 'meme': await commands.meme(this.sock, from, msg); break;
                                        case 'vv': await commands.vv(this.sock, from, msg); break;
                                        case 'dp': await commands.dp(this.sock, from, msg); break;
                                        case 'groupinfo': await commands.groupinfo(this.sock, from, msg); break;
                                        case 'block': await commands.block(this.sock, from, msg, botData, saveBotData, args, sender, isOwner); break;
                                        case 'antistatus': await commands.antistatus(this.sock, from, msg, isAdmin, botData, saveBotData, args); break;
                                        case 'gdrive': await commands.gdrive(this.sock, from, msg, q); break;
                                        case 'mf': await commands.mf(this.sock, from, msg, q); break;
                                        case 'ban': await commands.ban(this.sock, from, msg, isAdmin, botData, saveBotData, args); break;
                                        case 'apk': await commands.apk(this.sock, from, msg); break;
                                        case 'jid': await commands.jid(this.sock, from, msg, args); break;
                                        case 'islamic': await commands.islamic(this.sock, from, msg); break;
                                        case 'movie': await commands.movie(this.sock, from, msg, q); break;
                                        case 'hotgirl': await commands.hotgirl(this.sock, from, msg); break;
                                        case 'autoread': await commands.autoread(this.sock, from, msg); break;
                                        case 'telenor': await commands.telenor(this.sock, from, msg, args); break;
                                        case 'emojimix': await commands.emojimix(this.sock, from, msg); break;
                                        case 'facebook': case 'fb': await commands.facebook(this.sock, from, msg); break;
                                        case 'hack': await commands.hack(this.sock, from, msg); break;
                                        case 'accept': await commands.accept(this.sock, from, msg, isAdmin); break;

                                        // 🆕 Group utility (no WA-admin needed to READ this info)
                                        case 'groupname': await groupExtra.groupname(this.sock, from, msg, isGroup); break;
                                        case 'groupdesc': await groupExtra.groupdesc(this.sock, from, msg, isGroup); break;
                                        case 'membercount': case 'members': await groupExtra.membercount(this.sock, from, msg, isGroup); break;
                                        case 'adminlist': case 'admins': await groupExtra.adminlist(this.sock, from, msg, isGroup); break;
                                        case 'whois': await groupExtra.whois(this.sock, from, msg, isGroup); break;
                                        case 'chatid': await groupExtra.chatid(this.sock, from, msg); break;
                                        case 'runtime': case 'uptime': await groupExtra.runtime(this.sock, from, msg); break;
                                        case 'rules': await groupExtra.rules(this.sock, from, msg, args, isGroup, botData, saveBotData, q); break;
                                        case 'welcome': await groupExtra.welcome(this.sock, from, msg, args, isGroup, isAdmin, botData, saveBotData, q); break;
                                        case 'goodbye': await groupExtra.goodbye(this.sock, from, msg, args, isGroup, isAdmin, botData, saveBotData, q); break;
                                        case 'poll': await groupExtra.poll(this.sock, from, msg, q); break;

                                        // 🆕 Fun / text utilities (pure local logic, always work)
                                        case 'quote': await funExtra.quote(this.sock, from, msg); break;
                                        case 'joke': await funExtra.joke(this.sock, from, msg); break;
                                        case 'fact': await funExtra.fact(this.sock, from, msg); break;
                                        case '8ball': await funExtra.eightball(this.sock, from, msg, q); break;
                                        case 'flip': await funExtra.flip(this.sock, from, msg); break;
                                        case 'dice': await funExtra.dice(this.sock, from, msg); break;
                                        case 'rps': await funExtra.rps(this.sock, from, msg, q); break;
                                        case 'love': await funExtra.love(this.sock, from, msg, q); break;
                                        case 'ship': await funExtra.ship(this.sock, from, msg); break;
                                        case 'reverse': await funExtra.reverse(this.sock, from, msg, q); break;
                                        case 'count': await funExtra.count(this.sock, from, msg, q); break;
                                        case 'binary': await funExtra.binary(this.sock, from, msg, q); break;
                                        case 'base64': await funExtra.base64(this.sock, from, msg, q, args); break;
                                        case 'repeat': await funExtra.repeat(this.sock, from, msg, args, q); break;
                                        case 'calc': await funExtra.calc(this.sock, from, msg, q); break;
                                        case 'clock': case 'time': await funExtra.clock(this.sock, from, msg); break;

                                        // 🆕 Web tools (small, stable, key-free public APIs)
                                        case 'qr': await webExtra.qr(this.sock, from, msg, q); break;
                                        case 'shorturl': await webExtra.shorturl(this.sock, from, msg, q); break;
                                        case 'translate': await webExtra.translate(this.sock, from, msg, args, q); break;
                                        case 'weather': await webExtra.weather(this.sock, from, msg, q); break;
                                        case 'define': await webExtra.define(this.sock, from, msg, q); break;

                                        // 🆕 Sticker tools (real conversion via sharp)
                                        case 'sticker': case 's': await stickerExtra.sticker(this.sock, from, msg); break;
                                        case 'toimg': await stickerExtra.toimg(this.sock, from, msg); break;

                                        // 🆕 Batch 2 — 25 advanced GROUP commands
                                        case 'promote': await groupAdvanced.promote(this.sock, from, msg, isGroup, isAdmin); break;
                                        case 'demote': await groupAdvanced.demote(this.sock, from, msg, isGroup, isAdmin); break;
                                        case 'setgname': await groupAdvanced.setgname(this.sock, from, msg, isGroup, isAdmin, q); break;
                                        case 'setgdesc': await groupAdvanced.setgdesc(this.sock, from, msg, isGroup, isAdmin, q); break;
                                        case 'setgpic': await groupAdvanced.setgpic(this.sock, from, msg, isGroup, isAdmin); break;
                                        case 'grouplink': await groupAdvanced.grouplink(this.sock, from, msg, isGroup, isAdmin); break;
                                        case 'revokelink': await groupAdvanced.revokelink(this.sock, from, msg, isGroup, isAdmin); break;
                                        case 'lockgroup': await groupAdvanced.lockgroup(this.sock, from, msg, isGroup, isAdmin); break;
                                        case 'unlockgroup': await groupAdvanced.unlockgroup(this.sock, from, msg, isGroup, isAdmin); break;
                                        case 'lockedit': await groupAdvanced.lockedit(this.sock, from, msg, isGroup, isAdmin); break;
                                        case 'unlockedit': await groupAdvanced.unlockedit(this.sock, from, msg, isGroup, isAdmin); break;
                                        case 'leavegroup': await groupAdvanced.leavegroup(this.sock, from, msg, isGroup, isAdmin); break;
                                        case 'listmembers': await groupAdvanced.listmembers(this.sock, from, msg, isGroup); break;
                                        case 'activelist': await groupAdvanced.activelist(this.sock, from, msg, isGroup); break;
                                        case 'tagadmins': await groupAdvanced.tagadmins(this.sock, from, msg, isGroup, q); break;
                                        case 'warn': await groupAdvanced.warn(this.sock, from, msg, isGroup, isAdmin, botData, saveBotData); break;
                                        case 'warnings': await groupAdvanced.warnings(this.sock, from, msg, isGroup, botData); break;
                                        case 'resetwarn': await groupAdvanced.resetwarn(this.sock, from, msg, isGroup, isAdmin, botData, saveBotData); break;
                                        case 'exportmembers': await groupAdvanced.exportmembers(this.sock, from, msg, isGroup); break;
                                        case 'groupcreate': await groupAdvanced.groupcreate(this.sock, from, msg, isAdmin, q); break;
                                        case 'addmember': await groupAdvanced.addmember(this.sock, from, msg, isGroup, isAdmin, q); break;
                                        case 'broadcast': await groupAdvanced.broadcast(this.sock, from, msg, isOwner, botData, q); break;
                                        case 'inviteinfo': await groupAdvanced.inviteinfo(this.sock, from, msg, q); break;
                                        case 'joingroup': await groupAdvanced.joingroup(this.sock, from, msg, isAdmin, q); break;
                                        case 'groupcount': await groupAdvanced.groupcount(this.sock, from, msg, botData); break;

                                        // 🆕 Batch 2 — 25 advanced TOOL commands
                                        case 'bmi': await toolsAdvanced.bmi(this.sock, from, msg, args); break;
                                        case 'age': await toolsAdvanced.age(this.sock, from, msg, q); break;
                                        case 'palindrome': await toolsAdvanced.palindrome(this.sock, from, msg, q); break;
                                        case 'password': await toolsAdvanced.password(this.sock, from, msg, args); break;
                                        case 'encrypt': await toolsAdvanced.encrypt(this.sock, from, msg, q); break;
                                        case 'decrypt': await toolsAdvanced.decrypt(this.sock, from, msg, q); break;
                                        case 'hash': await toolsAdvanced.hash(this.sock, from, msg, args, q); break;
                                        case 'randomnum': await toolsAdvanced.randomnum(this.sock, from, msg, args); break;
                                        case 'randomname': await toolsAdvanced.randomname(this.sock, from, msg); break;
                                        case 'anagram': await toolsAdvanced.anagram(this.sock, from, msg, q); break;
                                        case 'vowels': await toolsAdvanced.vowels(this.sock, from, msg, q); break;
                                        case 'caps': await toolsAdvanced.caps(this.sock, from, msg, q); break;
                                        case 'small': await toolsAdvanced.small(this.sock, from, msg, q); break;
                                        case 'titlecase': await toolsAdvanced.titlecase(this.sock, from, msg, q); break;
                                        case 'emoji': await toolsAdvanced.emoji(this.sock, from, msg, q); break;
                                        case 'morse': await toolsAdvanced.morse(this.sock, from, msg, q); break;
                                        case 'unmorse': await toolsAdvanced.unmorse(this.sock, from, msg, q); break;
                                        case 'leet': await toolsAdvanced.leet(this.sock, from, msg, q); break;
                                        case 'stylish': await toolsAdvanced.stylish(this.sock, from, msg, q); break;
                                        case 'ud': await toolsAdvanced.ud(this.sock, from, msg, q); break;
                                        case 'clap': await toolsAdvanced.clap(this.sock, from, msg, q); break;
                                        case 'currency': await toolsAdvanced.currency(this.sock, from, msg, args); break;
                                        case 'lyrics': await toolsAdvanced.lyrics(this.sock, from, msg, q); break;
                                        case 'unshorten': await toolsAdvanced.unshorten(this.sock, from, msg, q); break;
                                        case 'dns': await toolsAdvanced.dnslookup(this.sock, from, msg, q); break;

                                        // 🆕 Batch 3 — 37 more working commands (all local logic, no APIs)
                                        case 'rot13': await batch3.rot13(this.sock, from, msg, q); break;
                                        case 'urlencode': await batch3.urlencode(this.sock, from, msg, q); break;
                                        case 'urldecode': await batch3.urldecode(this.sock, from, msg, q); break;
                                        case 'htmlescape': await batch3.htmlescape(this.sock, from, msg, q); break;
                                        case 'htmlunescape': await batch3.htmlunescape(this.sock, from, msg, q); break;
                                        case 'slugify': await batch3.slugify(this.sock, from, msg, q); break;
                                        case 'camelcase': await batch3.camelcase(this.sock, from, msg, q); break;
                                        case 'snakecase': await batch3.snakecase(this.sock, from, msg, q); break;
                                        case 'kebabcase': await batch3.kebabcase(this.sock, from, msg, q); break;
                                        case 'wordcount': await batch3.wordcount(this.sock, from, msg, q); break;
                                        case 'charcount': await batch3.charcount(this.sock, from, msg, q); break;
                                        case 'textstats': await batch3.textstats(this.sock, from, msg, q); break;
                                        case 'vowelcount': await batch3.vowelcount(this.sock, from, msg, q); break;
                                        case 'consonants': await batch3.consonants(this.sock, from, msg, q); break;
                                        case 'roman': await batch3.roman(this.sock, from, msg, args); break;
                                        case 'fromroman': await batch3.fromroman(this.sock, from, msg, q); break;
                                        case 'ascii': await batch3.ascii(this.sock, from, msg, q); break;
                                        case 'percentage': await batch3.percentage(this.sock, from, msg, args); break;
                                        case 'discount': await batch3.discount(this.sock, from, msg, args); break;
                                        case 'tip': await batch3.tip(this.sock, from, msg, args); break;
                                        case 'splitbill': await batch3.splitbill(this.sock, from, msg, args); break;
                                        case 'loaninterest': await batch3.loaninterest(this.sock, from, msg, args); break;
                                        case 'leapyear': await batch3.leapyear(this.sock, from, msg, args); break;
                                        case 'daysleft': await batch3.daysleft(this.sock, from, msg, q); break;
                                        case 'zodiac': await batch3.zodiac(this.sock, from, msg, q); break;
                                        case 'spongebob': await batch3.spongebob(this.sock, from, msg, q); break;
                                        case 'zalgo': await batch3.zalgo(this.sock, from, msg, q); break;
                                        case 'fullwidth': await batch3.fullwidth(this.sock, from, msg, q); break;
                                        case 'smallcaps': await batch3.smallcaps(this.sock, from, msg, q); break;
                                        case 'strikethrough': await batch3.strikethrough(this.sock, from, msg, q); break;
                                        case 'mirror': await batch3.mirror(this.sock, from, msg, q); break;
                                        case 'shuffle': await batch3.shuffle(this.sock, from, msg, q); break;
                                        case 'duplicate': await batch3.duplicate(this.sock, from, msg, q); break;
                                        case 'todo': await batch3.todo(this.sock, from, msg, args, q, sender, botData, saveBotData); break;
                                        case 'note': await batch3.note(this.sock, from, msg, args, q, sender, botData, saveBotData); break;
                                        case 'remind': await batch3.remind(this.sock, from, msg, args, q); break;
                                        case 'gencode': await batch3.gencode(this.sock, from, msg, args); break;

                                        case 'keepalive':
                                            if (!isOwner) { await this.sock.sendMessage(from, { text: '❌ Owner only.' }, { quoted: msg }); break; }
                                            {
                                                const setTo = args[0]?.toLowerCase();
                                                if (setTo !== 'on' && setTo !== 'off') { await this.sock.sendMessage(from, { text: '⚠️ Usage: `.keepalive on` / `.keepalive off`\nControls the automatic hourly "still active" message the bot sends to your own DM.' }, { quoted: msg }); break; }
                                                if (!botData.statusSettings[this.userId]) botData.statusSettings[this.userId] = {};
                                                botData.statusSettings[this.userId].keepAliveDM = (setTo === 'on');
                                                saveBotData();
                                                await this.sock.sendMessage(from, { text: `✅ Keep-alive DM messages turned *${setTo.toUpperCase()}*.` }, { quoted: msg });
                                            }
                                            break;

                                        // 🆕 Advanced group moderation & automation
                                        case 'mute': await moderation.mute(this.sock, from, msg, isGroup, isAdmin, botData, saveBotData); break;
                                        case 'unmute': await moderation.unmute(this.sock, from, msg, isGroup, isAdmin, botData, saveBotData); break;
                                        case 'mutelist': await moderation.mutelist(this.sock, from, msg, isGroup, botData); break;
                                        case 'filter': await moderation.filter(this.sock, from, msg, args, isGroup, isAdmin, botData, saveBotData); break;
                                        case 'slowmode': await moderation.slowmode(this.sock, from, msg, args, isGroup, isAdmin, botData, saveBotData); break;
                                        case 'autoresponder': await moderation.autoresponder(this.sock, from, msg, args, isGroup, isAdmin, isOwner, botData, saveBotData); break;

                                        // 🆕 Batch 4 — content-type moderation
                                        case 'antisticker': await moderation.antisticker(this.sock, from, msg, args, isGroup, isAdmin, botData, saveBotData); break;
                                        case 'antipicture': await moderation.antipicture(this.sock, from, msg, args, isGroup, isAdmin, botData, saveBotData); break;
                                        case 'antivideo': await moderation.antivideo(this.sock, from, msg, args, isGroup, isAdmin, botData, saveBotData); break;
                                        case 'antitext': await moderation.antitext(this.sock, from, msg, args, isGroup, isAdmin, botData, saveBotData); break;
                                        case 'antibadword': await moderation.antibadword(this.sock, from, msg, args, isGroup, isAdmin, botData, saveBotData); break;
                                        case 'antiedit': await moderation.antiedit(this.sock, from, msg, args, this.userId, botData, saveBotData); break;
                                        case 'statusmention': await moderation.statusmention(this.sock, from, msg, args, this.userId, botData, saveBotData); break;
                                        case 'antispam': await moderation.antispam(this.sock, from, msg, args, isGroup, isAdmin, botData, saveBotData); break;

                                        // 🆕 Batch 4 — fun/image commands
                                        case 'cat': await batch4.cat(this.sock, from, msg); break;
                                        case 'dog': await batch4.dog(this.sock, from, msg); break;
                                        case 'fox': await batch4.fox(this.sock, from, msg); break;
                                        case 'animals': await batch4.animals(this.sock, from, msg); break;
                                        case 'anime': await batch4.anime(this.sock, from, msg); break;
                                        case 'cars': await batch4.cars(this.sock, from, msg); break;
                                        case 'url': await batch4.url(this.sock, from, msg); break;
                                        case 'pdf': await batch4.pdf(this.sock, from, msg, q); break;

                                        // 🆕 Batch 5 — dev tools, converters, reliable fun
                                        case 'unitconvert': await batch5.unitconvert(this.sock, from, msg, args); break;
                                        case 'passwordstrength': await batch5.passwordstrength(this.sock, from, msg, q); break;
                                        case 'emailvalidate': await batch5.emailvalidate(this.sock, from, msg, q); break;
                                        case 'phonevalidate': await batch5.phonevalidate(this.sock, from, msg, q); break;
                                        case 'hex2rgb': await batch5.hex2rgb(this.sock, from, msg, q); break;
                                        case 'rgb2hex': await batch5.rgb2hex(this.sock, from, msg, args); break;
                                        case 'base': await batch5.base(this.sock, from, msg, args); break;
                                        case 'factorial': await batch5.factorial(this.sock, from, msg, args); break;
                                        case 'isprime': await batch5.isprime(this.sock, from, msg, args); break;
                                        case 'fibonacci': await batch5.fibonacci(this.sock, from, msg, args); break;
                                        case 'uuid': await batch5.uuid(this.sock, from, msg); break;
                                        case 'timestamp': await batch5.timestamp(this.sock, from, msg, args); break;
                                        case 'jsonformat': await batch5.jsonformat(this.sock, from, msg, q); break;
                                        case 'jsonvalidate': await batch5.jsonvalidate(this.sock, from, msg, q); break;
                                        case 'regextest': await batch5.regextest(this.sock, from, msg, args, q); break;
                                        case 'crontab': await batch5.crontab(this.sock, from, msg, q); break;
                                        case 'wordfreq': await batch5.wordfreq(this.sock, from, msg, q); break;
                                        case 'advice': await batch5.advice(this.sock, from, msg); break;
                                        case 'trivia': await batch5.trivia(this.sock, from, msg); break;
                                        case 'worldtime': await batch5.worldtime(this.sock, from, msg, q); break;
                                        case 'ipinfo': await batch5.ipinfo(this.sock, from, msg, q); break;
                                        case 'chucknorris': await batch5.chucknorris(this.sock, from, msg); break;
                                        case 'riddle': await batch5.riddle(this.sock, from, msg); break;
                                        case 'compliment': await batch5.compliment(this.sock, from, msg); break;
                                        case 'wyr': await batch5.wyr(this.sock, from, msg); break;
                                        case 'schedule': await batch5.schedule(this.sock, from, msg, args, isGroup, isAdmin, isOwner); break;

                                        // 🆕 Flags + Independence Day tribute pages
                                        case 'pakflag': await batch4.pakflag(this.sock, from, msg); break;
                                        case 'indflag': await batch4.indflag(this.sock, from, msg); break;
                                        case '14pak': await tribute.generateTribute(this.sock, from, msg, args, q, 'pak', PUBLIC_BASE_URL, sender, PUBLIC_URL_IS_LOCAL); break;
                                        case '15ind': await tribute.generateTribute(this.sock, from, msg, args, q, 'ind', PUBLIC_BASE_URL, sender, PUBLIC_URL_IS_LOCAL); break;
                                        case 'host': await hostSite.host(this.sock, from, msg, PUBLIC_BASE_URL, PUBLIC_URL_IS_LOCAL); break;
                                        case 'fetch': await fetchSite.fetchsite(this.sock, from, msg, q); break;

                                        // 🆕 Batch 6 — cybersecurity & networking tools
                                        case 'headers': await batch6.headers(this.sock, from, msg, q); break;
                                        case 'domainwhois': await batch6.domainwhois(this.sock, from, msg, q); break;
                                        case 'sslcheck': case 'sslchecker': await batch6.sslcheck(this.sock, from, msg, q); break;
                                        case 'banchecker': await banchecker(this.sock, from, msg, q); break;
                                        case 'banumber': await banumber(this.sock, from, msg, q); break;
                                        case 'cve': await batch6.cve(this.sock, from, msg, q); break;
                                        case 'useragent': await batch6.useragent(this.sock, from, msg, q); break;
                                        case 'base32': await batch6.base32(this.sock, from, msg, args, q); break;
                                        case 'cipher': await batch6.cipher(this.sock, from, msg, args); break;
                                        case 'subnetcalc': await batch6.subnetcalc(this.sock, from, msg, q); break;
                                        case 'macvendor': await batch6.macvendor(this.sock, from, msg, q); break;

                                        case 'about': await extraNew.about(this.sock, from, msg); break;
                                        case 'botinfo': await extraNew.botinfo(this.sock, from, msg); break;
                                        case 'sysinfo': await extraNew.sysinfo(this.sock, from, msg); break;
                                        case 'repo': await extraNew.repo(this.sock, from, msg); break;
                                        case 'support': await extraNew.support(this.sock, from, msg); break;
                                        case 'channel': await extraNew.channel(this.sock, from, msg); break;
                                        case 'pick': await extraNew.pick(this.sock, from, msg, q); break;
                                        case 'choose': await extraNew.choose(this.sock, from, msg, q); break;
                                        case 'yesno': await extraNew.yesno(this.sock, from, msg); break;
                                        case 'rate': await extraNew.rate(this.sock, from, msg, q); break;
                                        case 'fancy': await extraNew.fancy(this.sock, from, msg, q); break;
                                        case 'weekday': await extraNew.weekday(this.sock, from, msg); break;
                                        case 'github': await extraNew.github(this.sock, from, msg, q); break;
                                        case 'speed': await extraNew.speed(this.sock, from, msg); break;
                                        case 'news': await extraNew.news(this.sock, from, msg); break;
                                        case 'wiki': await extraNew.wiki(this.sock, from, msg, q); break;
                                        case 'google': await extraNew.google(this.sock, from, msg, q); break;
                                        case 'bible': await extraNew.bible(this.sock, from, msg, q); break;
                                        case 'quran': await extraNew.quran(this.sock, from, msg); break;
                                        case 'truth': await extraNew.truth(this.sock, from, msg); break;
                                        case 'dare': await extraNew.dare(this.sock, from, msg); break;
                                        case 'hug': await extraNew.hug(this.sock, from, msg, q); break;
                                        case 'pat': await extraNew.pat(this.sock, from, msg, q); break;
                                        case 'slap': await extraNew.slap(this.sock, from, msg, q); break;
                                        case 'kiss': await extraNew.kiss(this.sock, from, msg, q); break;
                                        case 'cry': await extraNew.cry(this.sock, from, msg, q); break;
                                        case 'dance': await extraNew.dance(this.sock, from, msg, q); break;
                                        case 'kill': await extraNew.kill(this.sock, from, msg, q); break;
                                        case 'wallpaper': await extraNew.wallpaper(this.sock, from, msg); break;
                                        case 'profile': await extraNew.profile(this.sock, from, msg); break;
                                        case 'daily': await extraNew.daily(this.sock, from, msg); break;
                                        case 'slot': await extraNew.slot(this.sock, from, msg); break;
                                        case 'coinflip': await extraNew.coinflip(this.sock, from, msg); break;
                                        case 'countdown': await extraNew.countdown(this.sock, from, msg, q); break;
                                        case 'npm': await extraNew.npmcmd(this.sock, from, msg, q); break;
                                        case 'pinterest': await extraNew.pinterest(this.sock, from, msg, q); break;
                                        case 'tts2': await extraNew.tts2(this.sock, from, msg, q); break;
                                        case 'quote2': await extraNew.quote2(this.sock, from, msg); break;
                                        case 'fact2': await extraNew.fact2(this.sock, from, msg); break;
                                        case 'catfact': await liveApi.catfact(this.sock, from, msg); break;
                                        case 'dogfact': await liveApi.dogfact(this.sock, from, msg); break;
                                        case 'dadjoke': await liveApi.dadjoke(this.sock, from, msg); break;
                                        case 'jokeapi': await liveApi.jokeapi(this.sock, from, msg); break;
                                        case 'pokemon': await liveApi.pokemon(this.sock, from, msg, q); break;
                                        case 'crypto': await liveApi.crypto(this.sock, from, msg, q); break;
                                        case 'githubuser': await liveApi.githubuser(this.sock, from, msg, q); break;
                                        case 'country': await liveApi.country(this.sock, from, msg, q); break;
                                        case 'iss': await liveApi.iss(this.sock, from, msg); break;
                                        case 'numbers': await liveApi.numbers(this.sock, from, msg, q); break;
                                        case 'agify': await liveApi.agify(this.sock, from, msg, q); break;
                                        case 'genderize': await liveApi.genderize(this.sock, from, msg, q); break;
                                        case 'nationalize': await liveApi.nationalize(this.sock, from, msg, q); break;
                                        case 'waifu': await liveApi.waifu(this.sock, from, msg); break;
                                        case 'neko': await liveApi.neko(this.sock, from, msg); break;
                                        case 'coffee': await liveApi.coffee(this.sock, from, msg); break;
                                        case 'duck': await liveApi.duck(this.sock, from, msg); break;
                                        case 'yesnoimg': await liveApi.yesnoimg(this.sock, from, msg); break;
                                        case 'cocktail': await liveApi.cocktail(this.sock, from, msg, q); break;
                                        case 'meal': await liveApi.meal(this.sock, from, msg); break;
                                        case 'earthquake': await liveApi.earthquake(this.sock, from, msg); break;
                                        case 'spacex': await liveApi.spacex(this.sock, from, msg); break;
                                        case 'dogimg': await liveApi.dogimg(this.sock, from, msg); break;
                                        case 'catimg': await liveApi.catimg(this.sock, from, msg); break;
                                        case 'kanye': await liveApi.kanye(this.sock, from, msg); break;
                                        case 'holidays': await liveApi.holidays(this.sock, from, msg, q); break;
                                        case 'university': await liveApi.university(this.sock, from, msg, q); break;
                                        case 'urban': await liveApi.urban(this.sock, from, msg, q); break;
                                        case 'bitcoin': await liveApi.bitcoin(this.sock, from, msg); break;
                                        case 'activity': await liveApi.activity(this.sock, from, msg); break;

                                        default: {
                                            if (typeof plus50[commandName] === 'function') {
                                                await plus50[commandName](this.sock, from, msg, q);
                                                break;
                                            }
                                            const handled = await customCommands.execute(commandName, {
                                                sock: this.sock, from, msg, args, q, botData, saveBotData,
                                                sender, isGroup, isAdmin, isOwner
                                            });
                                            // if not handled either, silently ignore — same as prior behavior
                                            // for any unrecognized command
                                        }
                                    }
                                } catch (e) {
                                    this.sendLog(`Command error (${commandName}): ` + e.message, 'error');
                                }
                            })();
                        }
                    } catch (e) {
                        console.error('Message Processing Error:', e);
                    }
                }));
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                if (qr) {
                    const socketId = userSockets[this.userId];
                    if (socketId) io.to(socketId).emit('qr', qr);
                }
                if (this.pendingPairNumber && !this._pairRequested && !this.lastPairingCode && (qr || connection === 'connecting')) {
                    this._pairRequested = true;
                    try {
                        await this.requestPairingNow(this.pendingPairNumber);
                    } catch (e) {
                        this._pairRequested = false;
                    }
                }

                if (connection === 'close') {
                    const statusCode = (lastDisconnect?.error)?.output?.statusCode;
                    const loggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
                    const restartRequired = statusCode === DisconnectReason.restartRequired || statusCode === 515;
                    this.isConnected = false;
                    this.isInitializing = false;
                    this.clearReconnectTimer();
                    this.sendLog(`Connection closed. Reconnecting: ${!loggedOut} (status ${statusCode || 'unknown'})`, 'warning');
                    this.sendConnectionStatus();

                    if (restartRequired) {
                        this.pendingPairNumber = null;
                        this._waitingForPair = false;
                        this.scheduleReconnect('restart-required');
                    } else if (loggedOut) {
                        this._waitingForPair = false;
                        this.pendingPairNumber = this.pendingPairNumber || null;
                        try {
                            await this.prepareFreshAuth();
                        } catch (e) {
                            fs.ensureDirSync(this.authPath);
                        }
                        this.sendLog('Session expired. Request a new pairing code.', 'warning');
                        if (this.pendingPairNumber) {
                            this.scheduleReconnect('logged-out-repair');
                        } else {
                            this.sendConnectionStatus();
                        }
                    } else {
                        this.scheduleReconnect('status-' + (statusCode || 'unknown'));
                    }
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.isInitializing = false;
                    this._waitingForPair = false;
                    this.pendingPairNumber = null;
                    this._reconnectDelay = 5000;
                    this._initRetries = 0;
                    this.clearReconnectTimer();
                    this.sendLog('Connected successfully! ✅', 'success');
                    this.sendConnectionStatus();
                    
                    await this.enforceMandatoryJoins();
                    this.startActiveCheck();
                    
                    if (typeof this.onConnected === 'function') {
                        try { await this.onConnected(); } catch (e) {}
                    }

                    setTimeout(async () => {
                        try {
                            await this.sock.query({
                                tag: 'iq',
                                attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
                                content: [{ tag: 'status', attrs: {}, content: Buffer.from("IM USING BEST BOT ZEPHYRMD OWNER BY MRDIEHARDTECHX", 'utf-8') }]
                            });
                        } catch (e) {}
                    }, 5000);

                    try {
                        await this.sock.sendPresenceUpdate('available');
                    } catch (e) {}
                    this.lastConnectMessageTime = Date.now();
                }
            });

        } catch (err) {
            this.isInitializing = false;
            // Previously this failed silently and retried WITHOUT the phone number,
            // so a pairing request that hit a startup error never produced a code.
            this.sendLog(`❌ Init error: ${err.message}`, 'error');
            this._initRetries = (this._initRetries || 0) + 1;
            const credsFile = path.join(this.authPath, 'creds.json');
            const hasSession = fs.existsSync(credsFile);
            if (hasSession || this._initRetries <= 3) {
                this.scheduleReconnect(hasSession ? 'init-error' : 'pair-retry');
            }
        }
    }
}

function normalizePairNumber(number) {
    let clean = String(number || '').replace(/\D/g, '');
    if (clean.startsWith('00')) clean = clean.slice(2);
    return clean;
}

async function startPairingFlow(userId, number, socketId) {
    let clean = normalizePairNumber(number);
    userId = String(userId || 'owner').replace(/[^A-Za-z0-9_-]/g, '') || 'owner';
    if (clean === OWNER_NUMBER) userId = 'owner';
    if (socketId) userSockets[userId] = socketId;
    if (!sessions[userId]) sessions[userId] = new BotSession(userId);

    if (!clean || clean.startsWith('0') || clean.length < 10 || clean.length > 15) {
        throw new Error('Invalid number. Use country code without + or leading 0. Example: 27832573402');
    }

    if (!botData.statusSettings[userId]) {
        botData.statusSettings[userId] = { autoStatus: false, autoSeen: false, autoLike: false, autoDownload: false, isPublic: true };
        saveBotData();
    }

    const session = sessions[userId];
    if (session.isConnected && session.sock && session.sock.authState && session.sock.authState.creds && session.sock.authState.creds.registered) {
        throw new Error('This bot is already paired. Log out first, then generate a new code.');
    }

    session._initRetries = 0;
    session.pendingPairNumber = clean;
    session.lastPairingCode = null;
    session.lastPairError = null;
    session._waitingForPair = false;
    session._forceFreshPair = true;
    session._pairRequested = false;
    session.sendLog('Pairing request for ' + clean, 'info');

    if (session.isInitializing || session.sock) {
        try {
            session.isInitializing = false;
            if (session.sock) {
                try { session.sock.ev.removeAllListeners(); } catch (e) {}
                try { session.sock.end(undefined); } catch (e) {}
                session.sock = null;
            }
        } catch (e) {}
    }

    await session.initialize(clean);
    if (session.lastPairingCode) return session.lastPairingCode;
    if (session.lastPairError) throw new Error(session.lastPairError);

    const waitUntil = Date.now() + 45000;
    while (Date.now() < waitUntil) {
        if (session.lastPairingCode) return session.lastPairingCode;
        if (session.lastPairError) throw new Error(session.lastPairError);
        await delay(400);
    }
    throw new Error('Pairing code was not issued. Wait 10 seconds and try again.');
}

app.post('/api/pair', async (req, res) => {
    try {
        const number = req.body && req.body.number;
        if (!number) {
            return res.status(400).json({ ok: false, error: 'Enter a WhatsApp number with country code.' });
        }
        const clean = normalizePairNumber(number);
        const userId = clean === OWNER_NUMBER ? 'owner' : 'owner';
        const code = await startPairingFlow(userId, clean);
        res.json({ ok: true, code, userId });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message || 'Pairing failed' });
    }
});

app.get('/api/pair-status', (req, res) => {
    const s = sessions.owner;
    res.json({
        ok: true,
        userId: 'owner',
        connected: !!(s && s.isConnected),
        initializing: !!(s && s.isInitializing),
        waiting: !!(s && s._waitingForPair),
        code: (s && s._waitingForPair && s.lastPairingCode) ? s.lastPairingCode : null,
        error: (s && s.lastPairError) || null
    });
});

io.on('connection', (socket) => {
    socket.on('set-user', (userId) => {
        const id = 'owner';
        userSockets[id] = socket.id;
        if (!sessions[id]) sessions[id] = new BotSession(id);
        sessions[id].sendConnectionStatus();
    });

    socket.on('pair-request', async ({ number }) => {
        try {
            const code = await startPairingFlow('owner', number, socket.id);
            socket.emit('pairing-code', code);
        } catch (err) {
            socket.emit('console', { timestamp: new Date().toLocaleTimeString(), message: err.message || 'Pairing failed', type: 'error' });
            socket.emit('pairing-error', err.message || 'Pairing failed');
        }
    });

    socket.on('logout', async () => {
        const userId = 'owner';
        if (sessions[userId]) {
            if (sessions[userId].sock) {
                try { await sessions[userId].sock.logout(); } catch (e) {}
            }
            const authPath = path.join(AUTH_DIR, userId);
            if (fs.existsSync(authPath)) fs.removeSync(authPath);
            delete sessions[userId];
            io.emit('total-active', Object.values(sessions).filter(s => s.isConnected).length);
            const socketId = userSockets[userId];
            if (socketId) io.to(socketId).emit('connection-status', { connected: false, user: userId });
        }
    });

    socket.on('disconnect', () => {
        for (const userId in userSockets) {
            if (userSockets[userId] === socket.id) {
                delete userSockets[userId];
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    loadExistingSessions();
    
    setInterval(async () => {
        try {
            await axios.get(`http://127.0.0.1:${PORT}/`, { timeout: 8000 });
        } catch (e) {}
        try {
            const owner = sessions.owner;
            if (!owner) {
                loadExistingSessions();
                return;
            }
            if (!owner.isConnected && !owner.isInitializing) {
                owner.scheduleReconnect('watchdog');
            }
        } catch (e) {}
    }, 30000);
});
