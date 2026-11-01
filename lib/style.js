const userSettings = require('./userSettings');
const { applyFont } = require('./menuStyles');

const TOP = '╭━━━〔 ⚡ZᴇPʜʏʀ~Mᴅ⚡ 〕━━━╮';
const BOTTOM = '╰━━━〔 Pᴏᴡᴇʀᴇᴅ Bʏ MʀDɪᴇHᴀʀᴅTᴇᴄʜX𓃵 〕━━━╯';
const MAX_LEN = 3500;
const PROTECT_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|```[\s\S]*?```|`[^`]+`|\b[\w.+-]+@[\w.-]+\.\w+|\d{8,}(?:@s\.whatsapp\.net)?)/gi;

function alreadyStyled(text) {
    return text.startsWith('╭') || text.includes('▓▓▓') || text.includes('𝗭𝗘𝗣𝗛𝗬𝗥 CYBER') || text.includes('𝗠𝗗𝗛');
}

function stylishText(text, styleId) {
    if (typeof text !== 'string' || !text) return text;
    const id = Number(styleId) || 1;
    const parts = [];
    let last = 0;
    const re = new RegExp(PROTECT_RE.source, PROTECT_RE.flags);
    let m;
    while ((m = re.exec(text))) {
        if (m.index > last) parts.push(applyFont(text.slice(last, m.index), id));
        parts.push(m[0]);
        last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(applyFont(text.slice(last), id));
    return parts.join('');
}

function heavy(text, opts = {}) {
    if (typeof text !== 'string') return text;
    const trimmed = text.trim();
    if (!trimmed) return text;
    if (trimmed.length > MAX_LEN) return stylishText(text, opts.styleId);
    const body = alreadyStyled(trimmed) ? trimmed : stylishText(trimmed, opts.styleId);
    if (alreadyStyled(trimmed)) return body;
    const boxed = body.split('\n').map(line => line.length ? `┃ ${line}` : '┃').join('\n');
    let footer = BOTTOM;
    if (opts && opts.mentionTag) {
        footer = `┃ ʀᴇǫᴜᴇsᴛᴇᴅ ʙʏ: ${opts.mentionTag}\n${BOTTOM}`;
    }
    return `${TOP}\n┃\n${boxed}\n┃\n${footer}`;
}

function applyHeavyStyle(sock) {
    if (sock.__heavyStyled) return;
    const original = sock.sendMessage.bind(sock);
    sock.sendMessage = async (jid, content, options) => {
        try {
            if (content && typeof content === 'object' && !Buffer.isBuffer(content)) {
                let mentionJid = null;
                let mentionTag = null;
                try {
                    const quoted = options && options.quoted;
                    if (quoted && quoted.key) {
                        mentionJid = quoted.participant || quoted.key.participant || quoted.key.remoteJid || null;
                        if (mentionJid && (mentionJid.endsWith('@s.whatsapp.net') || mentionJid.endsWith('@lid'))) {
                            mentionTag = '@' + String(mentionJid).split('@')[0].split(':')[0];
                        }
                    }
                } catch (e) {
                    mentionJid = null;
                    mentionTag = null;
                }

                const styleId = mentionJid ? userSettings.getMenuStyle(mentionJid) : 1;

                if (content.skipStyle) {
                    const { skipStyle, ...rest } = content;
                    content = rest;
                } else if (typeof content.text === 'string') {
                    content = { ...content, text: heavy(content.text, { mentionTag, styleId }) };
                } else if (typeof content.caption === 'string' && content.caption.length < 900) {
                    content = { ...content, caption: heavy(content.caption, { mentionTag, styleId }) };
                }

                if (mentionJid) {
                    const existing = Array.isArray(content.mentions) ? content.mentions : [];
                    if (!existing.includes(mentionJid)) {
                        content = { ...content, mentions: [...existing, mentionJid] };
                    }
                }
            }
        } catch (e) { }
        return original(jid, content, options);
    };
    sock.__heavyStyled = true;
}

module.exports = { heavy, applyHeavyStyle, stylishText };
