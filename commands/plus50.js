const axios = require('axios');

const OPTS = { timeout: 12000, headers: { 'User-Agent': 'ZEPHYR-MD', Accept: 'application/json' } };

function send(sock, from, msg, text) {
    return sock.sendMessage(from, { text }, { quoted: msg });
}

async function get(url, extra = {}) {
    const res = await axios.get(url, { ...OPTS, ...extra });
    return res.data;
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function num(n, min, max) {
    const v = parseInt(n, 10);
    if (!Number.isFinite(v)) return min;
    return Math.max(min, Math.min(max, v));
}

async function wrap(sock, from, msg, fn) {
    try {
        await fn();
    } catch (e) {
        await send(sock, from, msg, 'Command failed. Try again in a moment.');
    }
}

const ROASTS = [
    'Your WiFi has better range than your personality.',
    'You bring everyone so much joy when you leave the chat.',
    'If brains were RAM, you would still be on 128MB.',
    'Your aura is buffering.',
    'Even autocorrect gives up on you.',
    'You are the reason the skip button exists.',
    'Your GPS would still get lost in a parking lot.'
];
const FORTUNES = [
    'A quiet move today becomes a loud win later.',
    'Someone notices your grind. Keep going.',
    'Do not chase. Attract.',
    'The next 24 hours favor bold decisions.',
    'Protect your energy. Not everyone deserves access.',
    'A delayed plan is still a plan. Execute.'
];
const TAROT = ['The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor', 'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit', 'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance', 'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement', 'The World'];
const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const WORDS = ['zephyr', 'cyber', 'shadow', 'voltage', 'phoenix', 'nebula', 'quantum', 'thunder', 'glacier', 'onyx', 'pulse', 'nova'];
const MOTIVES = [
    'Discipline beats motivation. Show up anyway.',
    'You do not need more time. You need more focus.',
    'Become expensive. Stay rare.',
    'Silence the noise. Build the empire.',
    'Your future self is watching this message.'
];
const AFFIRMS = ['I move with purpose.', 'I attract power, not chaos.', 'I finish what I start.', 'I am built for pressure.', 'I protect my peace.'];
const STOIC = [
    'We suffer more in imagination than in reality. — Seneca',
    'The obstacle is the way. — Marcus Aurelius',
    'If it is endurable, then endure it. — Marcus Aurelius',
    'He who fears death will never do anything worthy. — Seneca'
];
const PICKUPS = [
    'Are you WiFi? Because I feel a connection.',
    'Is your name Google? You have everything I have been searching for.',
    'If you were a song, you would be on repeat.',
    'Do you have a map? I keep getting lost in this chat.'
];
const NICKS = ['Ghost', 'Ace', 'Viper', 'Blaze', 'Zero', 'King', 'Storm', 'Rex', 'Nova', 'Wolf'];
const SLOGANS = ['Built different.', 'No mercy, no delay.', 'Stay lethal. Stay loyal.', 'Quiet money. Loud results.', 'Code. Conquer. Repeat.'];

function bubble(text) {
    const map = { a: 'ⓐ', b: 'ⓑ', c: 'ⓒ', d: 'ⓓ', e: 'ⓔ', f: 'ⓕ', g: 'ⓖ', h: 'ⓗ', i: 'ⓘ', j: 'ⓙ', k: 'ⓚ', l: 'ⓛ', m: 'ⓜ', n: 'ⓝ', o: 'ⓞ', p: 'ⓟ', q: 'ⓠ', r: 'ⓡ', s: 'ⓢ', t: 'ⓣ', u: 'ⓤ', v: 'ⓥ', w: 'ⓦ', x: 'ⓧ', y: 'ⓨ', z: 'ⓩ' };
    return String(text).split('').map(ch => map[ch.toLowerCase()] || ch).join('');
}

function brailleOf(text) {
    const map = { a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑', f: '⠋', g: '⠛', h: '⠓', i: '⠊', j: '⠚', k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕', p: '⠏', q: '⠟', r: '⠗', s: '⠎', t: '⠞', u: '⠥', v: '⠧', w: '⠺', x: '⠭', y: '⠽', z: '⠵', ' ': ' ' };
    return String(text).toLowerCase().split('').map(ch => map[ch] || ch).join('');
}

function vapor(text) {
    return String(text).split('').join(' ');
}

function mockcase(text) {
    return String(text).split('').map((ch, i) => (i % 2 ? ch.toUpperCase() : ch.toLowerCase())).join('');
}

function card() {
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suits = ['S', 'H', 'D', 'C'];
    return pick(ranks) + pick(suits);
}

function luhnCheck(numStr) {
    const s = String(numStr).replace(/\D/g, '');
    let sum = 0;
    let alt = false;
    for (let i = s.length - 1; i >= 0; i--) {
        let n = parseInt(s[i], 10);
        if (alt) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
    }
    return s.length > 1 && sum % 10 === 0;
}

function crc32(str) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ ((crc ^ str.charCodeAt(i)) & 0xff) * 0xedb88320;
        crc = crc >>> 0;
    }
    return ((crc ^ (-1)) >>> 0).toString(16).padStart(8, '0');
}

async function hashHex(algo, text) {
    const crypto = require('crypto');
    return crypto.createHash(algo).update(String(text)).digest('hex');
}

const handlers = {
    async roast(sock, from, msg, q) {
        await send(sock, from, msg, '*Roast*\n' + (q ? q + ': ' : '') + pick(ROASTS));
    },
    async fortune(sock, from, msg) {
        await send(sock, from, msg, '*Fortune*\n' + pick(FORTUNES));
    },
    async tarot(sock, from, msg) {
        await send(sock, from, msg, '*Tarot*\n' + pick(TAROT) + '\nRead it as a signal, not a sentence.');
    },
    async horoscope(sock, from, msg, q) {
        const sign = String(q || 'leo').trim().toLowerCase();
        if (!SIGNS.includes(sign)) return send(sock, from, msg, 'Usage: .horoscope leo');
        await send(sock, from, msg, '*Horoscope — ' + sign + '*\n' + pick(FORTUNES));
    },
    async compatibility(sock, from, msg, q) {
        const parts = String(q || '').split(/[|,/&]/).map(s => s.trim()).filter(Boolean);
        if (parts.length < 2) return send(sock, from, msg, 'Usage: .compatibility A | B');
        const score = Math.floor(40 + Math.random() * 60);
        await send(sock, from, msg, '*Compatibility*\n' + parts[0] + ' x ' + parts[1] + '\n' + score + '%');
    },
    async simprate(sock, from, msg, q) {
        await send(sock, from, msg, '*Simp Rate*\n' + (q || 'you') + ': ' + Math.floor(Math.random() * 101) + '%');
    },
    async nickname(sock, from, msg, q) {
        const base = String(q || 'user').trim().split(/\s+/)[0];
        await send(sock, from, msg, '*Nickname*\n' + pick(NICKS) + base.slice(0, 8));
    },
    async bio(sock, from, msg, q) {
        const name = String(q || 'ZEPHYR').trim();
        await send(sock, from, msg, '*Bio*\n' + name + ' | ' + pick(SLOGANS));
    },
    async slogan(sock, from, msg) {
        await send(sock, from, msg, '*Slogan*\n' + pick(SLOGANS));
    },
    async hashtag(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .hashtag zephyr bot');
        const tags = String(q).split(/\s+/).filter(Boolean).slice(0, 8).map(w => '#' + w.replace(/[^\w]/g, ''));
        await send(sock, from, msg, '*Hashtags*\n' + tags.join(' '));
    },
    async pickup(sock, from, msg) {
        await send(sock, from, msg, '*Pickup*\n' + pick(PICKUPS));
    },
    async motivation(sock, from, msg) {
        await send(sock, from, msg, '*Motivation*\n' + pick(MOTIVES));
    },
    async affirm(sock, from, msg) {
        await send(sock, from, msg, '*Affirmation*\n' + pick(AFFIRMS));
    },
    async stoic(sock, from, msg) {
        await send(sock, from, msg, '*Stoic*\n' + pick(STOIC));
    },
    async bored(sock, from, msg) {
        await wrap(sock, from, msg, async () => {
            const data = await get('https://www.boredapi.com/api/activity');
            await send(sock, from, msg, '*Bored*\n' + (data.activity || pick(MOTIVES)));
        });
    },
    async hangman(sock, from, msg) {
        const word = pick(WORDS);
        const shown = word[0] + word.slice(1).replace(/./g, '_');
        await send(sock, from, msg, '*Hangman*\n' + shown.split('').join(' ') + '\nHint length: ' + word.length);
    },
    async tictactoe(sock, from, msg) {
        const cells = ['1', '2', '3', '4', 'X', '6', 'O', '8', '9'];
        const row = (a, b, c) => cells[a] + ' | ' + cells[b] + ' | ' + cells[c];
        await send(sock, from, msg, '*TicTacToe*\n' + row(0, 1, 2) + '\n---------\n' + row(3, 4, 5) + '\n---------\n' + row(6, 7, 8) + '\nYou are X. Reply with a number next round.');
    },
    async blackjack(sock, from, msg) {
        const you = [card(), card()];
        const dealer = [card(), '??'];
        await send(sock, from, msg, '*Blackjack*\nYou: ' + you.join(' ') + '\nDealer: ' + dealer.join(' '));
    },
    async roulette(sock, from, msg) {
        const n = Math.floor(Math.random() * 37);
        const color = n === 0 ? 'GREEN' : (n % 2 ? 'RED' : 'BLACK');
        await send(sock, from, msg, '*Roulette*\n' + n + ' ' + color);
    },
    async lottery(sock, from, msg) {
        const nums = Array.from({ length: 6 }, () => Math.floor(1 + Math.random() * 49)).sort((a, b) => a - b);
        await send(sock, from, msg, '*Lottery*\n' + nums.join(' - '));
    },
    async wordle(sock, from, msg) {
        const word = pick(WORDS).slice(0, 5).padEnd(5, 'x');
        await send(sock, from, msg, '*Wordle*\nGuess a 5-letter word. Hidden: ' + '■'.repeat(word.length) + '\nHint: starts with ' + word[0].toUpperCase());
    },
    async guessnum(sock, from, msg, q) {
        const secret = 1 + Math.floor(Math.random() * 20);
        const guess = parseInt(q, 10);
        if (!guess) return send(sock, from, msg, 'Usage: .guessnum 1-20');
        await send(sock, from, msg, guess === secret ? '*Guess*\nCorrect. It was ' + secret : '*Guess*\nNope. It was ' + secret);
    },
    async rpsls(sock, from, msg, q) {
        const opts = ['rock', 'paper', 'scissors', 'lizard', 'spock'];
        const user = String(q || '').toLowerCase();
        if (!opts.includes(user)) return send(sock, from, msg, 'Usage: .rpsls rock|paper|scissors|lizard|spock');
        const bot = pick(opts);
        await send(sock, from, msg, '*RPSLS*\nYou: ' + user + '\nBot: ' + bot);
    },
    async xp(sock, from, msg) {
        await send(sock, from, msg, '*XP*\n+' + (50 + Math.floor(Math.random() * 250)) + ' XP');
    },
    async level(sock, from, msg) {
        await send(sock, from, msg, '*Level*\nLv.' + (1 + Math.floor(Math.random() * 50)));
    },
    async rank(sock, from, msg) {
        await send(sock, from, msg, '*Rank*\n#' + (1 + Math.floor(Math.random() * 999)) + '  |  ' + pick(['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']));
    },
    async synonym(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .synonym strong');
        await wrap(sock, from, msg, async () => {
            const data = await get('https://api.datamuse.com/words?rel_syn=' + encodeURIComponent(q) + '&max=8');
            const list = (data || []).map(x => x.word).join(', ') || 'None found';
            await send(sock, from, msg, '*Synonyms*\n' + q + '\n' + list);
        });
    },
    async antonym(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .antonym strong');
        await wrap(sock, from, msg, async () => {
            const data = await get('https://api.datamuse.com/words?rel_ant=' + encodeURIComponent(q) + '&max=8');
            const list = (data || []).map(x => x.word).join(', ') || 'None found';
            await send(sock, from, msg, '*Antonyms*\n' + q + '\n' + list);
        });
    },
    async rhymes(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .rhymes night');
        await wrap(sock, from, msg, async () => {
            const data = await get('https://api.datamuse.com/words?rel_rhy=' + encodeURIComponent(q) + '&max=8');
            const list = (data || []).map(x => x.word).join(', ') || 'None found';
            await send(sock, from, msg, '*Rhymes*\n' + q + '\n' + list);
        });
    },
    async acronym(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .acronym NASA');
        await send(sock, from, msg, '*Acronym*\n' + String(q).trim().toUpperCase().replace(/[^A-Z]/g, '').split('').join('.'));
    },
    async lorem(sock, from, msg, q) {
        const n = num(q, 1, 5);
        const para = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
        await send(sock, from, msg, '*Lorem*\n' + Array.from({ length: n }, () => para).join('\n\n'));
    },
    async bubble(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .bubble zephyr');
        await send(sock, from, msg, '*Bubble*\n' + bubble(q));
    },
    async braille(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .braille hello');
        await send(sock, from, msg, '*Braille*\n' + brailleOf(q));
    },
    async vapor(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .vapor zephyr');
        await send(sock, from, msg, '*Vapor*\n' + vapor(q));
    },
    async mockcase(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .mockcase hello');
        await send(sock, from, msg, '*Mock*\n' + mockcase(q));
    },
    async palette(sock, from, msg) {
        const hex = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
        await send(sock, from, msg, '*Palette*\n' + [hex(), hex(), hex(), hex(), hex()].join('\n'));
    },
    async pangram(sock, from, msg) {
        await send(sock, from, msg, '*Pangram*\nThe quick brown fox jumps over the lazy dog.');
    },
    async md5(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .md5 text');
        await send(sock, from, msg, '*MD5*\n' + await hashHex('md5', q));
    },
    async sha1(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .sha1 text');
        await send(sock, from, msg, '*SHA1*\n' + await hashHex('sha1', q));
    },
    async sha256(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .sha256 text');
        await send(sock, from, msg, '*SHA256*\n' + await hashHex('sha256', q));
    },
    async crc32cmd(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .crc32 text');
        await send(sock, from, msg, '*CRC32*\n' + crc32(q));
    },
    async luhn(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .luhn 79927398713');
        await send(sock, from, msg, '*Luhn*\n' + (luhnCheck(q) ? 'VALID' : 'INVALID'));
    },
    async isbn(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .isbn 9780306406157');
        const s = String(q).replace(/\D/g, '');
        await send(sock, from, msg, '*ISBN*\n' + s + '\nLength: ' + s.length + (s.length === 13 || s.length === 10 ? '\nLooks complete' : '\nExpected 10 or 13 digits'));
    },
    async otp(sock, from, msg, q) {
        const len = num(q, 4, 8);
        let out = '';
        for (let i = 0; i < len; i++) out += Math.floor(Math.random() * 10);
        await send(sock, from, msg, '*OTP*\n' + out);
    },
    async token(sock, from, msg) {
        const crypto = require('crypto');
        await send(sock, from, msg, '*Token*\n' + crypto.randomBytes(16).toString('hex'));
    },
    async myip(sock, from, msg) {
        await wrap(sock, from, msg, async () => {
            const data = await get('https://api.ipify.org?format=json');
            await send(sock, from, msg, '*My IP*\n' + (data.ip || 'unknown'));
        });
    },
    async httpcode(sock, from, msg, q) {
        const code = String(q || '404').replace(/\D/g, '') || '404';
        const map = { 200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved Permanently', 302: 'Found', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 408: 'Timeout', 429: 'Too Many Requests', 500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Unavailable' };
        await send(sock, from, msg, '*HTTP*\n' + code + ' ' + (map[code] || 'Unknown'));
    },
    async paste(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .paste your text');
        await send(sock, from, msg, '*Paste*\n```\n' + String(q).slice(0, 1500) + '\n```');
    },
    async ytsearch(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .ytsearch dre');
        await send(sock, from, msg, '*YouTube*\nhttps://www.youtube.com/results?search_query=' + encodeURIComponent(q));
    },
    async imdb(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .imdb inception');
        await wrap(sock, from, msg, async () => {
            const data = await get('https://www.omdbapi.com/?t=' + encodeURIComponent(q) + '&apikey=trilogy');
            if (data.Response === 'False') return send(sock, from, msg, 'Not found. Try another title.');
            await send(sock, from, msg, '*IMDb*\n' + data.Title + ' (' + data.Year + ')\n' + data.Genre + '\nIMDb: ' + data.imdbRating + '\n' + (data.Plot || ''));
        });
    },
    async tvshow(sock, from, msg, q) {
        if (!q) return send(sock, from, msg, 'Usage: .tvshow breaking bad');
        await wrap(sock, from, msg, async () => {
            const data = await get('https://api.tvmaze.com/singlesearch/shows?q=' + encodeURIComponent(q));
            await send(sock, from, msg, '*TV Show*\n' + data.name + '\nStatus: ' + data.status + '\nPremiered: ' + (data.premiered || '-') + '\nRating: ' + ((data.rating && data.rating.average) || '-'));
        });
    },
    async sunrise(sock, from, msg) {
        await wrap(sock, from, msg, async () => {
            const data = await get('https://api.sunrise-sunset.org/json?lat=-26.2041&lng=28.0473&formatted=1');
            const r = data.results || {};
            await send(sock, from, msg, '*Sunrise JHB*\nSunrise: ' + r.sunrise + '\nSunset: ' + r.sunset + '\nDay length: ' + r.day_length);
        });
    },
    async moon(sock, from, msg) {
        const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
        await send(sock, from, msg, '*Moon*\n' + pick(phases));
    },
    async aqi(sock, from, msg) {
        await wrap(sock, from, msg, async () => {
            const data = await get('https://api.open-meteo.com/v1/air-quality?latitude=-26.2041&longitude=28.0473&current=european_aqi');
            const v = data.current && data.current.european_aqi;
            await send(sock, from, msg, '*AQI Johannesburg*\n' + (v != null ? v : 'n/a'));
        });
    },
    async isp(sock, from, msg) {
        await wrap(sock, from, msg, async () => {
            const data = await get('https://ipapi.co/json/');
            await send(sock, from, msg, '*ISP*\n' + (data.org || '-') + '\n' + (data.city || '-') + ', ' + (data.country_name || '-'));
        });
    },
    async animequote(sock, from, msg) {
        await wrap(sock, from, msg, async () => {
            const data = await get('https://yurippe.vercel.app/api/quotes?random=1');
            const row = Array.isArray(data) ? data[0] : data;
            await send(sock, from, msg, '*Anime Quote*\n' + (row.quote || row.text || 'Stay strong.') + '\n— ' + (row.character || row.anime || 'unknown'));
        });
    },
    async manga(sock, from, msg, q) {
        const title = String(q || 'naruto').trim();
        await wrap(sock, from, msg, async () => {
            const data = await get('https://api.jikan.moe/v4/manga?q=' + encodeURIComponent(title) + '&limit=1');
            const m = data.data && data.data[0];
            if (!m) return send(sock, from, msg, 'Manga not found.');
            await send(sock, from, msg, '*Manga*\n' + m.title + '\nScore: ' + (m.score || '-') + '\nChapters: ' + (m.chapters || '-') + '\nStatus: ' + (m.status || '-'));
        });
    },
    async punch(sock, from, msg, q) {
        await send(sock, from, msg, '*Punch*\n' + (q || 'them') + ' got dropped.');
    },
    async bite(sock, from, msg, q) {
        await send(sock, from, msg, '*Bite*\nNom. ' + (q || 'target') + ' felt that.');
    },
    async wink(sock, from, msg, q) {
        await send(sock, from, msg, '*Wink*\n' + (q || 'you') + ' caught the signal.');
    },
    async blush(sock, from, msg, q) {
        await send(sock, from, msg, '*Blush*\n' + (q || 'you') + ' turned red.');
    },
    async cuddle(sock, from, msg, q) {
        await send(sock, from, msg, '*Cuddle*\nSoft hours with ' + (q || 'you') + '.');
    },
    async tickle(sock, from, msg, q) {
        await send(sock, from, msg, '*Tickle*\n' + (q || 'them') + ' cannot stop laughing.');
    },
    async highfive(sock, from, msg, q) {
        await send(sock, from, msg, '*High Five*\n' + (q || 'team') + ' — respect.');
    },
    async poke(sock, from, msg, q) {
        await send(sock, from, msg, '*Poke*\nHey ' + (q || 'you') + '.');
    },
    async wave(sock, from, msg, q) {
        await send(sock, from, msg, '*Wave*\nHello ' + (q || 'chat') + '.');
    }
};

handlers.crc32 = handlers.crc32cmd;

module.exports = handlers;
