function liveBotUrl() {
    return (process.env.BOT_URL || process.env.BACKEND_URL || 'https://zephyrmdbot.onrender.com').replace(/\/+$/, '');
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function wakeBot(base) {
    try {
        await fetch(base + '/', { method: 'GET', redirect: 'manual' });
    } catch (e) {}
}

async function proxyToBot(req, res, botPath) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    const search = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const target = liveBotUrl() + botPath + search;
    const opts = {
        method: req.method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        opts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    }

    await wakeBot(liveBotUrl());

    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const r = await fetch(target, opts);
            const text = await r.text();
            res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
            res.status(r.status).send(text);
            return;
        } catch (err) {
            lastErr = err;
            await wait(4000);
        }
    }

    res.status(502).json({
        ok: false,
        error: 'Live bot is waking up or offline. Wait 30 seconds and Generate Code again.'
    });
}

module.exports = { liveBotUrl, proxyToBot };
