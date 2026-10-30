const TZ = 'Africa/Johannesburg';
const STARTED_AT = Date.now();
const STARTED_UPTIME = process.uptime();

function formatDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const parts = [];
    if (d) parts.push(d + 'd');
    if (h || d) parts.push(h + 'h');
    if (m || h || d) parts.push(m + 'm');
    parts.push(s + 's');
    return parts.join(' ');
}

function uptimeMs() {
    return (process.uptime() - STARTED_UPTIME) * 1000 + (Date.now() - STARTED_AT);
}

function startedLabel() {
    return new Date(STARTED_AT).toLocaleString('en-ZA', {
        timeZone: TZ,
        dateStyle: 'medium',
        timeStyle: 'medium'
    }) + ' SAST';
}

function nowLabel() {
    return new Date().toLocaleString('en-ZA', {
        timeZone: TZ,
        dateStyle: 'full',
        timeStyle: 'medium'
    }) + ' SAST';
}

module.exports = { TZ, STARTED_AT, formatDuration, uptimeMs, startedLabel, nowLabel };
