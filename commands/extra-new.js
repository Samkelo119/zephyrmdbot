const os = require('os');
const botClock = require('../lib/botClock');

function send(sock, from, msg, text) {
    return sock.sendMessage(from, { text }, { quoted: msg });
}

async function about(sock, from, msg) {
    await send(sock, from, msg,
        '*ZEPHYR MD*\nVersion: V1.0.0\nOwner: MrDieHardTechX\nNumber: +27832573402\nType .menu for commands\nType .menustyle 1-17 to change menu font');
}

async function botinfo(sock, from, msg) {
    const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    await send(sock, from, msg,
        '*Bot Info*\nName: ZEPHYR MD\nVersion: V1.0.0\nOwner: MrDieHardTechX\nRuntime: ' + botClock.formatDuration(botClock.uptimeMs()) +
        '\nStarted: ' + botClock.startedLabel() +
        '\nRAM: ' + ram + ' MB\nNode: ' + process.version);
}

async function speed(sock, from, msg) {
    const t = Date.now();
    await send(sock, from, msg, '*Speed*\nResponse: ' + (Date.now() - t) + ' ms');
}

async function sysinfo(sock, from, msg) {
    const total = os.totalmem() / 1024 / 1024;
    const free = os.freemem() / 1024 / 1024;
    await send(sock, from, msg,
        '*System*\nPlatform: ' + os.platform() +
        '\nCPU: ' + (os.cpus()[0] && os.cpus()[0].model || 'unknown') +
        '\nCores: ' + os.cpus().length +
        '\nRAM: ' + (total - free).toFixed(0) + ' / ' + total.toFixed(0) + ' MB' +
        '\nUptime: ' + botClock.formatDuration(os.uptime() * 1000));
}

async function repo(sock, from, msg) {
    await send(sock, from, msg,
        '*ZEPHYR MD*\nGitHub: https://github.com/Samkelo119/zephyrmdbot\nOwner: MrDieHardTechX\nWhatsApp: +27832573402\nChannel: https://whatsapp.com/channel/0029Vb8p6DV8aKvNTp6n8n45');
}

async function support(sock, from, msg) {
    await send(sock, from, msg, '*Support*\nOwner: MrDieHardTechX\nWhatsApp: +27832573402');
}

async function channel(sock, from, msg) {
    await send(sock, from, msg, '*Channel*\nhttps://whatsapp.com/channel/0029Vb8p6DV8aKvNTp6n8n45');
}

async function pick(sock, from, msg, q) {
    const parts = String(q || '').split(/[|,]/).map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) return send(sock, from, msg, 'Usage: .pick red | blue | green');
    await send(sock, from, msg, '*Pick:* ' + parts[Math.floor(Math.random() * parts.length)]);
}

async function choose(sock, from, msg, q) {
    return pick(sock, from, msg, q);
}

async function yesno(sock, from, msg) {
    await send(sock, from, msg, Math.random() < 0.5 ? '*Yes*' : '*No*');
}

async function rate(sock, from, msg, q) {
    const target = String(q || 'you').trim() || 'you';
    await send(sock, from, msg, '*Rate*\n' + target + ': ' + Math.floor(Math.random() * 101) + '/100');
}

async function fancy(sock, from, msg, q) {
    if (!q) return send(sock, from, msg, 'Usage: .fancy your text');
    const { applyFont } = require('../lib/menuStyles');
    const lines = [];
    for (let i = 1; i <= 17; i++) lines.push(i + '. ' + applyFont(q, i));
    await send(sock, from, msg, '*Fancy Text*\n' + lines.join('\n'));
}

async function weekday(sock, from, msg) {
    await send(sock, from, msg, '*Today*\n' + botClock.nowLabel());
}

async function github(sock, from, msg, q) {
    const user = String(q || 'MrDieHardTechX').trim();
    await send(sock, from, msg, '*GitHub*\nhttps://github.com/' + encodeURIComponent(user));
}

async function pingcmd(sock, from, msg) {
    const incoming = Number(msg.messageTimestamp);
    const ts = incoming > 1e12 ? incoming : incoming * 1000;
    const recvMs = ts ? Math.max(0, Date.now() - ts) : 0;
    const t0 = process.hrtime.bigint();
    const sent = await sock.sendMessage(from, { text: 'Pinging...' }, { quoted: msg });
    const sendMs = Number(process.hrtime.bigint() - t0) / 1e6;
    const text = '*Pong*\nLatency: ' + Math.round(sendMs) + ' ms\nReceive: ' + Math.round(recvMs) + ' ms';
    try {
        await sock.sendMessage(from, { text, edit: sent.key });
    } catch (e) {
        await sock.sendMessage(from, { text }, { quoted: msg });
    }
}

const TRUTHS = [
    'What is your biggest fear?',
    'Who was your first crush?',
    'What is a secret you never told anyone?',
    'What is the last lie you told?',
    'Who do you text the most?'
];
const DARES = [
    'Send a voice note saying ZEPHYR MD is the best bot.',
    'Change your status to ZEPHYR MD for 10 minutes.',
    'Type your name backwards in the chat.',
    'Send a sticker right now.',
    'Compliment the next person who texts.'
];
const ACTIONS = {
    hug: 'gave a hug to',
    pat: 'patted',
    slap: 'slapped',
    kiss: 'sent a kiss to',
    cry: 'is crying with',
    dance: 'is dancing with',
    kill: 'KO punched'
};

function targetName(msg, q) {
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (mention) return '@' + mention.split('@')[0];
    return String(q || 'someone').trim() || 'someone';
}

async function news(sock, from, msg) {
    await send(sock, from, msg, '*News*\nUse .wiki or .google for live lookup.\nZEPHYR MD power tools are online.');
}
async function wiki(sock, from, msg, q) {
    if (!q) return send(sock, from, msg, 'Usage: .wiki South Africa');
    await send(sock, from, msg, '*Wiki*\nhttps://en.wikipedia.org/wiki/' + encodeURIComponent(q.replace(/ /g, '_')));
}
async function google(sock, from, msg, q) {
    if (!q) return send(sock, from, msg, 'Usage: .google ZEPHYR MD');
    await send(sock, from, msg, '*Google*\nhttps://www.google.com/search?q=' + encodeURIComponent(q));
}
async function bible(sock, from, msg, q) {
    await send(sock, from, msg, '*Bible*\n' + (q || 'John 3:16') + '\nFor God so loved the world...');
}
async function quran(sock, from, msg) {
    await send(sock, from, msg, '*Quran*\nIndeed, with hardship comes ease. (94:6)');
}
async function truth(sock, from, msg) {
    await send(sock, from, msg, '*Truth*\n' + TRUTHS[Math.floor(Math.random() * TRUTHS.length)]);
}
async function dare(sock, from, msg) {
    await send(sock, from, msg, '*Dare*\n' + DARES[Math.floor(Math.random() * DARES.length)]);
}
async function actionCmd(sock, from, msg, q, kind) {
    await send(sock, from, msg, '*ZEPHYR*\nYou ' + ACTIONS[kind] + ' ' + targetName(msg, q));
}
async function hug(sock, from, msg, q) { return actionCmd(sock, from, msg, q, 'hug'); }
async function pat(sock, from, msg, q) { return actionCmd(sock, from, msg, q, 'pat'); }
async function slap(sock, from, msg, q) { return actionCmd(sock, from, msg, q, 'slap'); }
async function kiss(sock, from, msg, q) { return actionCmd(sock, from, msg, q, 'kiss'); }
async function cry(sock, from, msg, q) { return actionCmd(sock, from, msg, q, 'cry'); }
async function dance(sock, from, msg, q) { return actionCmd(sock, from, msg, q, 'dance'); }
async function kill(sock, from, msg, q) { return actionCmd(sock, from, msg, q, 'kill'); }
async function wallpaper(sock, from, msg) {
    await send(sock, from, msg, '*Wallpaper*\nhttps://source.unsplash.com/random/1080x1920/?nature');
}
async function profile(sock, from, msg) {
    const who = msg.key.participant || msg.key.remoteJid;
    await send(sock, from, msg, '*Profile*\nJID: ' + who + '\nName: ' + (msg.pushName || 'User'));
}
async function daily(sock, from, msg) {
    const xp = 50 + Math.floor(Math.random() * 151);
    await send(sock, from, msg, '*Daily Reward*\nYou claimed +' + xp + ' XP');
}
async function slot(sock, from, msg) {
    const icons = ['⚡', '💎', '7️⃣', '⭐', '🪙'];
    const a = icons[Math.floor(Math.random() * icons.length)];
    const b = icons[Math.floor(Math.random() * icons.length)];
    const c = icons[Math.floor(Math.random() * icons.length)];
    await send(sock, from, msg, '*Slots*\n' + a + ' | ' + b + ' | ' + c + '\n' + (a === b && b === c ? 'JACKPOT' : 'Try again'));
}
async function coinflip(sock, from, msg) {
    await send(sock, from, msg, '*Coin*\n' + (Math.random() < 0.5 ? 'Heads' : 'Tails'));
}
async function countdown(sock, from, msg, q) {
    const n = parseInt(q, 10);
    if (!n || n < 1 || n > 10) return send(sock, from, msg, 'Usage: .countdown 5');
    await send(sock, from, msg, '*Countdown*\n' + Array.from({ length: n }, (_, i) => String(n - i)).join(' ') + ' GO');
}
async function npmcmd(sock, from, msg, q) {
    if (!q) return send(sock, from, msg, 'Usage: .npm sharp');
    await send(sock, from, msg, '*NPM*\nhttps://www.npmjs.com/package/' + encodeURIComponent(q));
}
async function pinterest(sock, from, msg, q) {
    if (!q) return send(sock, from, msg, 'Usage: .pinterest cars');
    await send(sock, from, msg, '*Pinterest*\nhttps://www.pinterest.com/search/pins/?q=' + encodeURIComponent(q));
}
async function tts2(sock, from, msg, q) {
    if (!q) return send(sock, from, msg, 'Usage: .tts2 hello');
    await send(sock, from, msg, '*TTS*\nhttps://translate.google.com/translate_tts?ie=UTF-8&q=' + encodeURIComponent(q) + '&tl=en&client=tw-ob');
}
async function quote2(sock, from, msg) {
    await send(sock, from, msg, '*Quote*\nStay dangerous. Stay focused. ZEPHYR MD.');
}
async function fact2(sock, from, msg) {
    await send(sock, from, msg, '*Fact*\nHoney never spoils.');
}

module.exports = {
    about, botinfo, speed, sysinfo, repo, support, channel,
    pick, choose, yesno, rate, fancy, weekday, github, pingcmd,
    news, wiki, google, bible, quran, truth, dare, hug, pat, slap, kiss,
    cry, dance, kill, wallpaper, profile, daily, slot, coinflip, countdown,
    npmcmd, pinterest, tts2, quote2, fact2
};
