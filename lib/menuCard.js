const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { fancyCommand } = require('./menu');

const SECTIONS = [
    ['AUTOMATION', ['autoreacts','antilink','antidelete','ai','anticall','antistatus','autoread','autotyping','autorecording','autostatus','status','keepalive','mention','setprefix']],
    ['CORE', ['menu','help','alive','ping','owner','runtime','uptime','vv','dp','jid','time','clock','stream','pair']],
    ['DOWNLOADERS', ['song','video','apk','facebook','fb','tiktok','insta','ig','gdrive','mf','meme','emojimix','movie','lyrics']],
    ['STICKER & MEDIA', ['sticker','s','toimg','take','tg','stickertelegram','tts','url','pdf','host','fetch']],
    ['GROUP TOOLS', ['groupname','groupdesc','groupinfo','membercount','adminlist','whois','chatid','rules','welcome','goodbye','poll','hidetag','tagall','tagadmins','tagnotadmin','listmembers','activelist','exportmembers','inviteinfo','groupcount']],
    ['GROUP ADMIN', ['kick','promote','demote','addmember','setgname','setgdesc','setgpic','grouplink','revokelink','lockgroup','unlockgroup','lockedit','unlockedit','leavegroup','groupcreate','joingroup','accept','del']],
    ['MODERATION', ['mute','unmute','mutelist','warn','warnings','resetwarn','filter','slowmode','autoresponder','ban','block','broadcast','antisticker','antipicture','antivideo','antitext','antibadword','antiedit','statusmention','antispam']],
    ['OWNER', ['public','private','setname','hack']],
    ['FUN & TEXT', ['quote','joke','fact','8ball','flip','dice','rps','love','ship','reverse','count','binary','base64','repeat','calc','hotgirl','islamic','simdb','telenor','advice','trivia','riddle','compliment','wyr','chucknorris','cat','dog','fox','animals','anime','cars']],
    ['WEB TOOLS', ['qr','shorturl','unshorten','translate','weather','define','dns','ipinfo','worldtime']],
    ['ADVANCED TOOLS', ['bmi','age','palindrome','password','encrypt','decrypt','hash','randomnum','randomname','anagram','vowels','caps','small','titlecase','emoji','morse','unmorse','leet','stylish','ud','clap','currency']],
    ['ENCODE / STATS / MATH', ['rot13','urlencode','urldecode','htmlescape','htmlunescape','slugify','camelcase','snakecase','kebabcase','wordcount','charcount','textstats','vowelcount','consonants','roman','fromroman','ascii','percentage','discount','tip','splitbill','loaninterest','leapyear','daysleft','zodiac']],
    ['TEXT EFFECTS', ['spongebob','zalgo','fullwidth','smallcaps','strikethrough','mirror','shuffle','duplicate']],
    ['PERSONAL', ['todo','note','remind','gencode','schedule']],
    ['DEV TOOLS', ['unitconvert','passwordstrength','emailvalidate','phonevalidate','hex2rgb','rgb2hex','base','factorial','isprime','fibonacci','uuid','timestamp','jsonformat','jsonvalidate','regextest','crontab','wordfreq']],
    ['NETWORK', ['headers','domainwhois','sslcheck','cve','useragent','base32','cipher','subnetcalc','macvendor']],
    ['EXTRA', ['pakflag','indflag','14pak','15ind']]
];

function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildRows(prefix) {
    const rows = [];
    for (const [title, names] of SECTIONS) {
        rows.push({ type: 'title', text: title });
        for (const name of names) rows.push({ type: 'cmd', text: prefix + fancyCommand(name) });
        rows.push({ type: 'gap', text: '' });
    }
    return rows;
}

function splitColumns(rows, cols) {
    const buckets = Array.from({ length: cols }, () => []);
    const total = rows.length;
    const per = Math.ceil(total / cols);
    for (let i = 0; i < total; i++) buckets[Math.floor(i / per)].push(rows[i]);
    return buckets;
}

async function buildCombinedMenu({ prefix = '.', userName = 'User', isPublic = true }) {
    const photoPath = fs.existsSync(path.join(__dirname, '..', 'assets', 'menu.jpg'))
        ? path.join(__dirname, '..', 'assets', 'menu.jpg')
        : path.join(__dirname, '..', 'assets', 'menu.webp');
    if (!fs.existsSync(photoPath)) return null;

    const photo = sharp(photoPath);
    const meta = await photo.metadata();
    const width = 1200;
    const photoH = Math.round((meta.height / meta.width) * width);
    const resized = await photo.resize({ width }).jpeg({ quality: 88 }).toBuffer();

    const cols = 3;
    const rows = buildRows(prefix);
    const columns = splitColumns(rows, cols);
    const lineH = 22;
    const maxRows = Math.max(...columns.map(c => c.length));
    const padTop = 86;
    const padBottom = 48;
    const listH = padTop + maxRows * lineH + padBottom;
    const height = photoH + listH;
    const colW = Math.floor(width / cols);

    let texts = '';
    columns.forEach((col, ci) => {
        const x = 28 + ci * colW;
        col.forEach((row, ri) => {
            const y = photoH + padTop + ri * lineH;
            if (row.type === 'title') {
                texts += `<text x="${x}" y="${y}" font-size="15" font-weight="700" fill="#7CFFD4">${esc(row.text)}</text>`;
            } else if (row.type === 'cmd') {
                texts += `<text x="${x}" y="${y}" font-size="13" fill="#EAF0FF">${esc(row.text)}</text>`;
            }
        });
    });

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${photoH}" width="${width}" height="${listH}" fill="#070B14"/>
      <rect x="0" y="${photoH}" width="${width}" height="54" fill="#0E1524"/>
      <text x="50%" y="${photoH + 36}" text-anchor="middle" font-size="26" font-weight="800" fill="#FFFFFF">ZEPHYR MD</text>
      <text x="24" y="${photoH + 70}" font-size="13" fill="#8B96B8">${esc(userName)}  ·  ${isPublic ? 'Public Mode' : 'Private Mode'}  ·  Owner MRDIEHARDTECHX</text>
      ${texts}
      <text x="50%" y="${height - 18}" text-anchor="middle" font-size="12" fill="#8B96B8">Powered By MRDIEHARDTECHX</text>
    </svg>`;

    return sharp({
        create: { width, height, channels: 3, background: { r: 7, g: 11, b: 20 } }
    })
        .jpeg()
        .composite([
            { input: resized, top: 0, left: 0 },
            { input: Buffer.from(svg), top: 0, left: 0 }
        ])
        .jpeg({ quality: 86 })
        .toBuffer();
}

module.exports = { buildCombinedMenu };
