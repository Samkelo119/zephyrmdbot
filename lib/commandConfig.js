// lib/commandConfig.js
// 👑 AWAIS CYBER — Command control center.
// Single source of truth for: the active prefix, prefixless mode, and
// per-command enable/disable + premium-lock state. Read by index.js on
// every incoming message and written by the Admin Panel — no redeploy
// needed to change any of it.

const fs = require('fs-extra');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'data', 'command_config.json');

// Full list of every command name currently registered in index.js's
// dispatch switch. Keeping this list here (rather than scanning the
// switch at runtime) means the Admin Panel can show every command —
// including ones the bot owner has disabled — without needing the bot
// to parse its own source code.
const ALL_COMMANDS = [
    "14pak","15ind","8ball","accept","activelist","addmember","adminlist","admins","advice","age","ai","anagram",
    "animals","anime","antibadword","anticall","antidelete","antiedit","antilink","antipicture","antispam","antistatus",
    "antisticker","antitext","antivideo","apk","ascii","autoreacts","autoread","autorecording","autoresponder",
    "autostatus","autotyping","ban","base","base32","base64","binary","block","bmi","broadcast","calc",
    "camelcase","caps","cars","cat","charcount","chatid","chucknorris","cipher","clap","clock","compliment",
    "consonants","count","crontab","currency","cve","daysleft","decrypt","define","demote","dice","discount","dns",
    "dog","domainwhois","dp","duplicate","emailvalidate","emoji","emojimix","encrypt","exportmembers","facebook",
    "fact","factorial","fb","fetch","fibonacci","filter","flip","fox","fromroman","fullwidth","gdrive","gencode",
    "goodbye","groupcount","groupcreate","groupdesc","groupinfo","grouplink","groupname","hack","hash","headers",
    "hex2rgb","hidetag","host","hotgirl","ig","indflag","insta","inviteinfo","ipinfo","islamic","isprime","jid",
    "joingroup","joke","jsonformat","jsonvalidate","kebabcase","keepalive","kick","leapyear","leavegroup","leet",
    "listmembers","loaninterest","lockedit","lockgroup","love","lyrics","macvendor","membercount","members","meme",
    "menu","help","alive","mf","mirror","mode","morse","movie","mute","mutelist","mention","menustyle","note","owner","pair","pakflag","palindrome","password","prefix","about","botinfo","sysinfo","repo","support","channel","pick","choose","yesno","rate","fancy","weekday","github","speed",
    "passwordstrength","pdf","percentage","phonevalidate","ping","poll","private","promote","public","qr","quote",
    "randomname","randomnum","regextest","remind","repeat","resetwarn","reverse","revokelink","rgb2hex","riddle",
    "roman","rot13","rps","rules","runtime","s","schedule","setgdesc","setgname","setgpic","setname","ship",
    "shorturl","shuffle","simdb","slowmode","slugify","small","smallcaps","snakecase","song","play","splitbill","spongebob",
    "setprefix","sslcheck","status","statusmention","sticker","stickertelegram","stream","strikethrough","stylish","subnetcalc","tagadmins","tagall","tagnotadmin","take",
    "telenor","textstats","tg","tiktok","time","timestamp","tip","titlecase","todo","toimg","translate","trivia","tts","ud","del","delete",
    "unitconvert","unlockedit","unlockgroup","unmorse","unmute","unshorten","uptime","url","urldecode","urlencode",
    "useragent","uuid","video","vowelcount","vowels","vv","warn","warnings","weather","welcome","whois","wordcount",
    "wordfreq","worldtime","wyr","zalgo","zodiac",
    "menustyle1","menustyle2","menustyle3","menustyle4","menustyle5","menustyle6","menustyle7","menustyle8","menustyle9","menustyle10","menustyle11","menustyle12","menustyle13","menustyle14","menustyle15","menustyle16","menustyle17",
    "news","wiki","google","bible","quran","truth","dare","hug","pat","slap","kiss","cry","dance","kill","wallpaper","profile","daily","slot","coinflip","countdown","npm","pinterest","tts2","quote2","fact2",
    "crunchyroll","anime","ytdown","yt","ytdl","telesticker","tgsearch",
    "sslchecker","banchecker","banumber","update",
    "catfact","dogfact","dadjoke","jokeapi","pokemon","crypto","githubuser","country","iss","numbers","agify","genderize","nationalize","waifu","neko","coffee","duck","yesnoimg","cocktail","meal","earthquake","spacex","dogimg","catimg","kanye","holidays","university","urban","bitcoin","activity",
    "roast","fortune","tarot","horoscope","compatibility","simprate","nickname","bio","slogan","hashtag","pickup","motivation","affirm","stoic","bored","hangman","tictactoe","blackjack","roulette","lottery","wordle","guessnum","rpsls","xp","level","rank","synonym","antonym","rhymes","acronym","lorem","bubble","braille","vapor","mockcase","palette","pangram","md5","sha1","sha256","crc32","luhn","isbn","otp","token","myip","httpcode","paste","ytsearch","imdb","tvshow","sunrise","moon","aqi","isp","animequote","manga","punch","bite","wink","blush","cuddle","tickle","highfive","poke","wave"
];

// Commands that always stay owner-only regardless of Admin Panel state —
// these control the bot itself, so exposing an on/off switch for them
// to non-owners would be a security hole, not a feature.
const ALWAYS_OWNER_ONLY = new Set(["public", "private", "broadcast", "hack"]);

function defaultConfig() {
    const commands = {};
    for (const name of ALL_COMMANDS) {
        commands[name] = { enabled: true, premium: false };
    }
    return { prefix: ".", prefixlessMode: false, commands };
}

let config = defaultConfig();

function load() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const saved = fs.readJsonSync(CONFIG_FILE);
            const merged = defaultConfig();
            if (typeof saved.prefix === 'string' && saved.prefix.length > 0) merged.prefix = saved.prefix;
            if (typeof saved.prefixlessMode === 'boolean') merged.prefixlessMode = saved.prefixlessMode;
            if (saved.commands && typeof saved.commands === 'object') {
                for (const name of Object.keys(merged.commands)) {
                    if (saved.commands[name]) {
                        merged.commands[name] = {
                            enabled: saved.commands[name].enabled !== false,
                            premium: !!saved.commands[name].premium
                        };
                    }
                }
            }
            config = merged;
        }
    } catch (e) {
        console.error('[commandConfig] failed to load, using defaults:', e.message);
        config = defaultConfig();
    }
}

function persist() {
    try {
        fs.ensureDirSync(path.dirname(CONFIG_FILE));
        fs.writeJsonSync(CONFIG_FILE, config);
    } catch (e) {
        console.error('[commandConfig] failed to save:', e.message);
    }
}

load();

function getPrefix() {
    return config.prefix || ".";
}

function setPrefix(newPrefix) {
    if (typeof newPrefix !== 'string' || newPrefix.length === 0 || newPrefix.length > 3) {
        throw new Error('Prefix must be 1-3 characters.');
    }
    config.prefix = newPrefix;
    persist();
}

function getPrefixlessMode() {
    return !!config.prefixlessMode;
}

function setPrefixlessMode(enabled) {
    config.prefixlessMode = !!enabled;
    persist();
}

function isKnownCommand(name) {
    return Object.prototype.hasOwnProperty.call(config.commands, name);
}

function isCommandEnabled(name) {
    const entry = config.commands[name];
    if (!entry) return true; // unknown/new command names fail open (never accidentally silence a real command)
    return entry.enabled !== false;
}

function setCommandEnabled(name, enabled) {
    if (!isKnownCommand(name)) throw new Error('Unknown command: ' + name);
    config.commands[name].enabled = !!enabled;
    persist();
}

function isPremium(name) {
    const entry = config.commands[name];
    return !!(entry && entry.premium);
}

function setCommandPremium(name, premium) {
    if (!isKnownCommand(name)) throw new Error('Unknown command: ' + name);
    if (ALWAYS_OWNER_ONLY.has(name)) throw new Error('This command is owner-only and cannot be made premium/public.');
    config.commands[name].premium = !!premium;
    persist();
}

function isAlwaysOwnerOnly(name) {
    return ALWAYS_OWNER_ONLY.has(name);
}

function listAll() {
    return {
        prefix: getPrefix(),
        prefixlessMode: getPrefixlessMode(),
        commands: ALL_COMMANDS.map(name => ({
            name,
            enabled: isCommandEnabled(name),
            premium: isPremium(name),
            ownerOnly: isAlwaysOwnerOnly(name)
        }))
    };
}

// Parses an incoming message's text against the current prefix /
// prefixless config. Returns { commandName, args, q } or null if the
// text isn't a recognized command invocation at all.
function extractCommand(text, userPrefix) {
    if (typeof text !== 'string' || !text.trim()) return null;
    const lower = text.toLowerCase();
    const prefix = (typeof userPrefix === 'string' && userPrefix.length)
        ? userPrefix
        : (getPrefix() || '.');
    if (!lower.startsWith(prefix.toLowerCase())) return null;
    const commandName = lower.slice(prefix.length).split(' ')[0];
    if (!commandName) return null;
    const args = text.slice(prefix.length).trim().split(' ').slice(1);
    const q = args.join(' ');
    return { commandName, args, q, prefix };
}

// Used for the various "is this message a command, so skip auto-responder /
// anti-text / AI-reply for it" checks scattered through index.js — same
// prefix/prefixless rules as extractCommand, just a boolean.
function isCommandText(text, userPrefix) {
    return extractCommand(text, userPrefix) !== null;
}

module.exports = {
    ALL_COMMANDS,
    getPrefix, setPrefix,
    getPrefixlessMode, setPrefixlessMode,
    isKnownCommand, isCommandEnabled, setCommandEnabled,
    isPremium, setCommandPremium, isAlwaysOwnerOnly,
    listAll, extractCommand, isCommandText
};
