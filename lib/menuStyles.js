const STYLE_META = [
    { id: 1, name: 'Mixed Caps' },
    { id: 2, name: 'Small Caps' },
    { id: 3, name: 'Bold' },
    { id: 4, name: 'Italic' },
    { id: 5, name: 'Bold Italic' },
    { id: 6, name: 'Monospace' },
    { id: 7, name: 'Bubbles' },
    { id: 8, name: 'Black Bubbles' },
    { id: 9, name: 'Squares' },
    { id: 10, name: 'Circled' },
    { id: 11, name: 'Fullwidth' },
    { id: 12, name: 'Script' },
    { id: 13, name: 'Fraktur' },
    { id: 14, name: 'Double Struck' },
    { id: 15, name: 'Underline' },
    { id: 16, name: 'Tiny' },
    { id: 17, name: 'Wide Upper' }
];

const SMALL = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ',
    i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ',
    q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',
    y: 'ʏ', z: 'ᴢ'
};

const TINY = {
    a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ',
    i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ',
    q: 'q', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ',
    y: 'ʸ', z: 'ᶻ'
};

const BUBBLE = {
    a: 'ⓐ', b: 'ⓑ', c: 'ⓒ', d: 'ⓓ', e: 'ⓔ', f: 'ⓕ', g: 'ⓖ', h: 'ⓗ',
    i: 'ⓘ', j: 'ⓙ', k: 'ⓚ', l: 'ⓛ', m: 'ⓜ', n: 'ⓝ', o: 'ⓞ', p: 'ⓟ',
    q: 'ⓠ', r: 'ⓡ', s: 'ⓢ', t: 'ⓣ', u: 'ⓤ', v: 'ⓥ', w: 'ⓦ', x: 'ⓧ',
    y: 'ⓨ', z: 'ⓩ'
};

const BLACK_BUBBLE = {
    a: '🅐', b: '🅑', c: '🅒', d: '🅓', e: '🅔', f: '🅕', g: '🅖', h: '🅗',
    i: '🅘', j: '🅙', k: '🅚', l: '🅛', m: '🅜', n: '🅝', o: '🅞', p: '🅟',
    q: '🅠', r: '🅡', s: '🅢', t: '🅣', u: '🅤', v: '🅥', w: '🅦', x: '🅧',
    y: '🅨', z: '🅩'
};

const SQUARE = {
    a: '🄰', b: '🄱', c: '🄲', d: '🄳', e: '🄴', f: '🄵', g: '🄶', h: '🄷',
    i: '🄸', j: '🄹', k: '🄺', l: '🄻', m: '🄼', n: '🄽', o: '🄾', p: '🄿',
    q: '🅀', r: '🅁', s: '🅂', t: '🅃', u: '🅄', v: '🅅', w: '🅆', x: '🅇',
    y: '🅈', z: '🅉'
};

const CIRCLED = {
    a: 'Ⓐ', b: 'Ⓑ', c: 'Ⓒ', d: 'Ⓓ', e: 'Ⓔ', f: 'Ⓕ', g: 'Ⓖ', h: 'Ⓗ',
    i: 'Ⓘ', j: 'Ⓙ', k: 'Ⓚ', l: 'Ⓛ', m: 'Ⓜ', n: 'Ⓝ', o: 'Ⓞ', p: 'Ⓟ',
    q: 'Ⓠ', r: 'Ⓡ', s: 'Ⓢ', t: 'Ⓣ', u: 'Ⓤ', v: 'Ⓥ', w: 'Ⓦ', x: 'Ⓧ',
    y: 'Ⓨ', z: 'Ⓩ'
};

function rangeMap(startUpper, startLower) {
    const map = {};
    for (let i = 0; i < 26; i++) {
        map[String.fromCharCode(65 + i)] = String.fromCodePoint(startUpper + i);
        map[String.fromCharCode(97 + i)] = String.fromCodePoint(startLower + i);
    }
    return map;
}

const BOLD = rangeMap(0x1D400, 0x1D41A);
const ITALIC = rangeMap(0x1D434, 0x1D44E);
ITALIC.h = '𝘩';
ITALIC.H = '𝐻';
const BOLD_ITALIC = rangeMap(0x1D468, 0x1D482);
const MONO = rangeMap(0x1D670, 0x1D68A);
const SCRIPT = rangeMap(0x1D4D0, 0x1D4EA);
SCRIPT.B = '𝓑'; SCRIPT.E = '𝓔'; SCRIPT.F = '𝓕'; SCRIPT.H = '𝓗';
SCRIPT.I = '𝓘'; SCRIPT.L = '𝓛'; SCRIPT.M = '𝓜'; SCRIPT.R = '𝓡';
SCRIPT.e = '𝓮'; SCRIPT.g = '𝓰'; SCRIPT.o = '𝓸';
const FRAKTUR = rangeMap(0x1D56C, 0x1D586);
const DOUBLE = rangeMap(0x1D538, 0x1D552);
DOUBLE.C = 'ℂ'; DOUBLE.H = 'ℍ'; DOUBLE.N = 'ℕ'; DOUBLE.P = 'ℙ';
DOUBLE.Q = 'ℚ'; DOUBLE.R = 'ℝ'; DOUBLE.Z = 'ℤ';

function fromMap(str, map, upperKey) {
    return String(str).split('').map(ch => {
        const lower = ch.toLowerCase();
        if (upperKey) {
            const key = ch.toLowerCase();
            return map[key] || ch;
        }
        return map[ch] || map[lower] || map[ch.toUpperCase()] || ch;
    }).join('');
}

function fullwidth(str) {
    return String(str).split('').map(ch => {
        const code = ch.charCodeAt(0);
        if (ch === ' ') return '　';
        if (code >= 33 && code <= 126) return String.fromCharCode(code + 0xFEE0);
        return ch;
    }).join('');
}

function underline(str) {
    return String(str).split('').map(ch => ch === ' ' || ch === '\n' ? ch : ch + '\u0332').join('');
}

function wideUpper(str) {
    return String(str).toUpperCase().split('').join(' ');
}

function mixedCaps(text) {
    const s = String(text || '');
    if (!s) return '';
    return s[0].toUpperCase() + fromMap(s.slice(1), SMALL, true);
}

function applyFont(text, styleId) {
    const id = Number(styleId) || 1;
    switch (id) {
        case 1: return mixedCaps(text);
        case 2: return fromMap(text, SMALL, true);
        case 3: return fromMap(text, BOLD);
        case 4: return fromMap(text, ITALIC);
        case 5: return fromMap(text, BOLD_ITALIC);
        case 6: return fromMap(text, MONO);
        case 7: return fromMap(text, BUBBLE, true);
        case 8: return fromMap(text, BLACK_BUBBLE, true);
        case 9: return fromMap(text, SQUARE, true);
        case 10: return fromMap(text, CIRCLED, true);
        case 11: return fullwidth(text);
        case 12: return fromMap(text, SCRIPT);
        case 13: return fromMap(text, FRAKTUR);
        case 14: return fromMap(text, DOUBLE);
        case 15: return underline(text);
        case 16: return fromMap(text, TINY, true);
        case 17: return wideUpper(text);
        default: return mixedCaps(text);
    }
}

function normalizeStyle(n) {
    const id = parseInt(n, 10);
    if (!id || id < 1 || id > 17) return 1;
    return id;
}

function listStyles(prefix = '.') {
    return STYLE_META.map(s => `${prefix}menustyle ${s.id}  ${applyFont('Zephyr', s.id)}  (${s.name})`).join('\n');
}

module.exports = { STYLE_META, applyFont, normalizeStyle, listStyles };
