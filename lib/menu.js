const { applyFont } = require('./menuStyles');

const SMALL = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ',
    i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ',
    q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',
    y: 'ʏ', z: 'ᴢ'
};

const WORD_PARTS = [
    'percentage', 'compliment', 'palindrome', 'broadcast', 'translate',
    'strikethrough', 'consonants', 'fibonacci', 'factorial', 'schedule',
    'telegram', 'recording', 'responder', 'validate', 'strength',
    'duplicate', 'random', 'members', 'member', 'active', 'invite',
    'unlock', 'revoke', 'create', 'admins', 'admin', 'reset', 'sticker',
    'picture', 'delete', 'status', 'typing', 'prefix', 'alive', 'chuck',
    'norris', 'world', 'domain', 'whois', 'agent', 'subnet', 'vendor',
    'check', 'format', 'regex', 'prime', 'leap', 'year', 'days', 'left',
    'html', 'escape', 'unescape', 'encode', 'decode', 'camel', 'snake',
    'kebab', 'count', 'char', 'stats', 'vowel', 'vowels', 'roman',
    'split', 'bill', 'full', 'width', 'small', 'caps', 'strike',
    'through', 'sponge', 'bob', 'title', 'morse', 'shorten', 'short',
    'emoji', 'face', 'book', 'gname', 'gdesc', 'gpic', 'name', 'girl',
    'islamic', 'telenor', 'lyrics', 'gdrive', 'tiktok', 'insta', 'img',
    'headers', 'cipher', 'cron', 'freq', 'stamp', 'pass', 'word',
    'encrypt', 'decrypt', 'gram', 'ana', 'currency', 'weather', 'define',
    'info', 'mention', 'private', 'promote', 'demote', 'accept', 'unmute',
    'filter', 'welcome', 'goodbye', 'hide', 'tag', 'chat', 'runtime',
    'uptime', 'stream', 'public', 'owner', 'menu', 'help', 'ping', 'pair',
    'kick', 'mute', 'warn', 'block', 'rules', 'poll', 'clock', 'time',
    'movie', 'video', 'song', 'meme', 'take', 'host', 'fetch', 'note',
    'remind', 'code', 'uuid', 'hash', 'leet', 'stylish', 'clap',
    'ascii', 'discount', 'zodiac', 'zalgo', 'mirror', 'shuffle', 'todo',
    'base', 'fact', 'flip', 'dice', 'love', 'ship', 'reverse', 'binary',
    'repeat', 'calc', 'advice', 'trivia', 'riddle', 'quote', 'joke',
    'animals', 'anime', 'cars', 'cat', 'dog', 'fox', 'pdf', 'url',
    'tts', 'jid', 'hack', 'cve', 'dns', 'bmi', 'age', 'tip',
     'reacts', 'warnings', 'menustyle', 'style', 'about', 'botinfo', 'sysinfo',
     'repo', 'support', 'channel', 'choose', 'yesno', 'fancy', 'weekday',
     'github', 'speed', 'pick', 'rate',
    'anti', 'auto', 'link', 'call', 'edit', 'text', 'flag', 'pak',
    'ind', 'ball', 'list', 'all', 'not', 'group', 'desc', 'pic',
    'lock', 'leave', 'join', 'mode', 'read', 'type', 'record', 'react',
    'spam', 'bad', 'set', 'keep', 'mix', 'gen', 'hex', 'rgb', 'ssl',
    'mac', 'json', 'test', 'case', 'from', 'un', 'hot', 'to', 'tab',
    'rot', 'slug', 'ud', 'del', 'tg', 'ig', 'fb', 'mf', 'vv', 'dp',
    'ai', 'qr', 'who', 'is', 'id', 'num', 'run', 'up'
].sort((a, b) => b.length - a.length);

const SECTIONS = [
    ['Aᴜᴛᴏᴍᴀᴛɪᴏɴ', ['autoreacts','antilink','antidelete','ai','anticall','antistatus','autoread','autotyping','autorecording','autostatus','status','keepalive','mention','setprefix','menustyle']],
    ['Mᴇɴᴜ Sᴛʏʟᴇs', ['menustyle','menustyle1','menustyle2','menustyle3','menustyle4','menustyle5','menustyle6','menustyle7','menustyle8','menustyle9','menustyle10','menustyle11','menustyle12','menustyle13','menustyle14','menustyle15','menustyle16','menustyle17']],
    ['Cᴏʀᴇ', ['menu','help','alive','ping','owner','runtime','uptime','vv','dp','jid','time','clock','stream','pair','about','botinfo','sysinfo']],
    ['Dᴏᴡɴʟᴏᴀᴅᴇʀs', ['song','video','apk','facebook','fb','tiktok','insta','ig','gdrive','mf','meme','emojimix','movie','lyrics','ytdown','yt','crunchyroll']],
    ['Sᴛɪᴄᴋᴇʀ & Mᴇᴅɪᴀ', ['sticker','s','toimg','take','tg','stickertelegram','telesticker','tts','url','pdf','host','fetch']],
    ['Gʀᴏᴜᴘ Tᴏᴏʟs', ['groupname','groupdesc','groupinfo','membercount','adminlist','whois','chatid','rules','welcome','goodbye','poll','hidetag','tagall','tagadmins','tagnotadmin','listmembers','activelist','exportmembers','inviteinfo','groupcount']],
    ['Gʀᴏᴜᴘ Aᴅᴍɪɴ', ['kick','promote','demote','addmember','setgname','setgdesc','setgpic','grouplink','revokelink','lockgroup','unlockgroup','lockedit','unlockedit','leavegroup','groupcreate','joingroup','accept','del']],
    ['Mᴏᴅᴇʀᴀᴛɪᴏɴ', ['mute','unmute','mutelist','warn','warnings','resetwarn','filter','slowmode','autoresponder','ban','block','broadcast','antisticker','antipicture','antivideo','antitext','antibadword','antiedit','statusmention','antispam']],
    ['Oᴡɴᴇʀ', ['public','private','mode','setname','hack']],
    ['Fᴜɴ & Tᴇxᴛ', ['quote','joke','fact','8ball','flip','dice','rps','love','ship','reverse','count','binary','base64','repeat','calc','hotgirl','islamic','simdb','telenor','advice','trivia','riddle','compliment','wyr','chucknorris','cat','dog','fox','animals','anime','cars']],
    ['Wᴇʙ Tᴏᴏʟs', ['qr','shorturl','unshorten','translate','weather','define','dns','ipinfo','worldtime']],
    ['Aᴅᴠᴀɴᴄᴇᴅ Tᴏᴏʟs', ['bmi','age','palindrome','password','encrypt','decrypt','hash','randomnum','randomname','anagram','vowels','caps','small','titlecase','emoji','morse','unmorse','leet','stylish','ud','clap','currency']],
    ['Eɴᴄᴏᴅᴇ / Sᴛᴀᴛs / Mᴀᴛʜ', ['rot13','urlencode','urldecode','htmlescape','htmlunescape','slugify','camelcase','snakecase','kebabcase','wordcount','charcount','textstats','vowelcount','consonants','roman','fromroman','ascii','percentage','discount','tip','splitbill','loaninterest','leapyear','daysleft','zodiac']],
    ['Tᴇxᴛ Eғғᴇᴄᴛs', ['spongebob','zalgo','fullwidth','smallcaps','strikethrough','mirror','shuffle','duplicate']],
    ['Pᴇʀsᴏɴᴀʟ', ['todo','note','remind','gencode','schedule']],
    ['Dᴇᴠ Tᴏᴏʟs', ['unitconvert','passwordstrength','emailvalidate','phonevalidate','hex2rgb','rgb2hex','base','factorial','isprime','fibonacci','uuid','timestamp','jsonformat','jsonvalidate','regextest','crontab','wordfreq']],
    ['Nᴇᴛᴡᴏʀᴋ', ['headers','domainwhois','sslcheck','sslchecker','banchecker','banumber','cve','useragent','base32','cipher','subnetcalc','macvendor']],
    ['Exᴛʀᴀ', ['pakflag','indflag','14pak','15ind','repo','support','channel','pick','choose','yesno','rate','fancy','weekday','github','speed']],
    ['Pᴏᴡᴇʀ', ['news','wiki','google','bible','quran','truth','dare','hug','pat','slap','kiss','cry','dance','kill','wallpaper','profile','daily','slot','coinflip','countdown','npm','pinterest','tts2','quote2','fact2']],
    ['Lɪᴠᴇ Aᴘɪ', ['catfact','dogfact','dadjoke','jokeapi','pokemon','crypto','githubuser','country','iss','numbers','agify','genderize','nationalize','waifu','neko','coffee','duck','yesnoimg','cocktail','meal','earthquake','spacex','dogimg','catimg','kanye','holidays','university','urban','bitcoin','activity']]
];

function smallRest(word) {
    if (!word) return '';
    const lower = word.toLowerCase();
    if (lower.length === 1) return SMALL[lower] || word;
    const first = lower[0].toUpperCase();
    const rest = lower.slice(1).split('').map(ch => SMALL[ch] || ch).join('');
    return first + rest;
}

function splitWords(name) {
    const raw = String(name || '');
    const lead = raw.match(/^\d+/)?.[0] || '';
    let rest = raw.slice(lead.length).toLowerCase();
    const parts = [];
    while (rest.length) {
        const hit = WORD_PARTS.find(w => rest.startsWith(w) && w.length >= 2);
        if (hit) {
            parts.push(hit);
            rest = rest.slice(hit.length);
        } else {
            parts.push(rest);
            break;
        }
    }
    return { lead, parts };
}

function fancyCommand(name) {
    const special = {
        antilink: 'AɴᴛɪLɪɴᴋ',
        password: 'PᴀssWᴏʀᴅ',
        anagram: 'AɴᴀGʀᴀᴍ',
        '8ball': '8Bᴀʟʟ',
        '14pak': '14Pᴀᴋ',
        '15ind': '15Iɴᴅ'
    };
    if (special[name]) return special[name];
    const { lead, parts } = splitWords(name);
    const body = parts.map(smallRest).join('');
    return lead + body;
}

function styleCommand(name, styleId) {
    if (!styleId || Number(styleId) === 1) return fancyCommand(name);
    return applyFont(name, styleId);
}

function buildMenuPages({ prefix = '.', userName = 'User', isPublic = true, website = '', styleId = 1 }) {
    const P = prefix;
    const style = Number(styleId) || 1;
    const header = [
        '╭─❰ ⚡ ' + applyFont('ZEPHYR MD', style) + ' ⚡ ❱─╮',
        '┃ 👤 ' + userName,
        '┃ ' + (isPublic ? '🌐 Public Mode' : '🔒 Private Mode'),
        '┃ 🎨 ' + applyFont('Menu Style', style) + ': ' + style + '/17',
        '┃ 👑 Owner: MʀDɪᴇHᴀʀᴅTᴇᴄʜX',
        '╰─❰ Powered By MʀDɪᴇHᴀʀᴅTᴇᴄʜX ❱─╯'
    ].join('\n');

    const blocks = SECTIONS.map(([title, names], i) => {
        const n = String(i + 1).padStart(2, '0');
        const lines = names.map(cmd => P + styleCommand(cmd, style)).join('\n');
        return '『 ' + n + ' ' + title + ' 』\n' + lines;
    });

    const combined = header + '\n\n' + blocks.join('\n\n') + '\n\n_Powered By MʀDɪᴇHᴀʀᴅTᴇᴄʜX_';
    return [combined];
}

function listAllCommands(prefix = '.', styleId = 1) {
    return SECTIONS.map(([title, names]) => title + '\n' + names.map(n => prefix + styleCommand(n, styleId)).join('\n')).join('\n\n');
}

module.exports = { buildMenuPages, listAllCommands, fancyCommand, styleCommand, SECTIONS };
