// vercel-admin/api/forward.js
// Single reverse-proxy used for every page/asset/API that lives on the real
// bot backend (Render / Railway / Replit / VPS...). vercel.json rewrites pass
// the backend path in the `__p` query param, e.g.
//   /pair            -> /api/forward?__p=&__m=pair   (backend "/" = pair.html)
//   /api/pair        -> /api/forward?__p=api/pair
//   /admin/:path*    -> /api/forward?__p=admin/:path*
//
// The live pairing socket (socket.io) can't run through a serverless
// function, so for the pairing page we inject the real backend URL and the
// browser opens the socket straight to the backend (its socket.io allows
// any origin). Everything else (HTML, images, the pairing REST API, the
// admin panel) is forwarded here so the site works on your Vercel domain.

const { resolveBackend } = require('./_resolveBackend');

const HOP_BY_HOP = new Set([
    'host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive',
    'upgrade', 'proxy-connection', 'te', 'trailer', 'accept-encoding',
]);

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function switcherBadge(servers, currentIndex) {
    if (servers.length <= 1) return '';
    const name = escapeHtml(servers[currentIndex]?.name || 'Unknown');
    return `<div style="position:fixed;bottom:14px;right:14px;z-index:9999;font-family:monospace;font-size:11px;background:#0c0f18;border:1px solid rgba(120,150,255,0.3);color:#eaf0ff;padding:8px 12px;border-radius:20px;">${name} · <a href="/switch" style="color:#00ffb3;">switch</a></div>`;
}

function readRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

async function getBody(req) {
    if (['GET', 'HEAD'].includes(req.method)) return undefined;
    const raw = await readRawBody(req);
    if (raw.length) return raw;
    // Fallback if the runtime already consumed and parsed the stream.
    if (req.body === undefined || req.body === null) return undefined;
    if (Buffer.isBuffer(req.body) || typeof req.body === 'string') return req.body;
    const type = String(req.headers['content-type'] || '');
    if (type.includes('application/x-www-form-urlencoded')) return new URLSearchParams(req.body).toString();
    return JSON.stringify(req.body);
}

function buildSearch(query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query || {})) {
        if (key === '__p' || key === '__m') continue;
        (Array.isArray(value) ? value : [value]).forEach(v => params.append(key, v));
    }
    const s = params.toString();
    return s ? `?${s}` : '';
}

function injectPairConfig(html, backend, servers, index) {
    const config = `<script>window.ZEPHYR_BACKEND_URL=${JSON.stringify(backend)};</script>`;
    html = html.includes('</head>') ? html.replace('</head>', `${config}</head>`) : config + html;
    // Older pair.html builds hard-code the socket target to the page origin.
    html = html.replace(
        'const BACKEND_URL = window.location.origin;',
        'const BACKEND_URL = window.ZEPHYR_BACKEND_URL || window.location.origin;'
    );
    html = html.replace('const socket = io();', 'const socket = io(window.ZEPHYR_BACKEND_URL || undefined, { transports: ["websocket", "polling"] });');
    return html.replace('</body>', switcherBadge(servers, index) + '</body>');
}

module.exports = async function forward(req, res) {
    const { servers, index, url: backend } = resolveBackend(req);

    if (!backend) {
        if (servers.length === 0) {
            res.status(500).send('No backend servers configured. Set BACKEND_URL or BACKEND_SERVERS in your Vercel project\'s Environment Variables.');
        } else {
            res.writeHead(302, { Location: '/' });
            res.end();
        }
        return;
    }

    const cleanBackend = backend.replace(/\/+$/, '');
    const rawPath = Array.isArray(req.query.__p) ? req.query.__p.join('/') : (req.query.__p || '');
    const backendPath = '/' + String(rawPath).replace(/^\/+/, '');
    const isPairPage = req.query.__m === 'pair';
    const targetUrl = `${cleanBackend}${backendPath}${buildSearch(req.query)}`;

    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
        const lower = key.toLowerCase();
        if (HOP_BY_HOP.has(lower) || lower.startsWith('x-vercel-')) continue;
        headers[lower] = value;
    }

    try {
        const backendRes = await fetch(targetUrl, {
            method: req.method,
            headers,
            body: await getBody(req),
            redirect: 'manual',
        });

        res.status(backendRes.status);

        const setCookies = typeof backendRes.headers.getSetCookie === 'function'
            ? backendRes.headers.getSetCookie()
            : [backendRes.headers.get('set-cookie')].filter(Boolean);
        if (setCookies.length) res.setHeader('Set-Cookie', setCookies);

        const location = backendRes.headers.get('location');
        if (location) res.setHeader('Location', location.startsWith(cleanBackend) ? location.slice(cleanBackend.length) || '/' : location);

        for (const h of ['cache-control', 'content-disposition', 'etag', 'last-modified']) {
            const v = backendRes.headers.get(h);
            if (v) res.setHeader(h, v);
        }

        const contentType = backendRes.headers.get('content-type') || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await backendRes.text();
            if (isPairPage) html = injectPairConfig(html, cleanBackend, servers, index);
            else html = html.replace('</body>', switcherBadge(servers, index) + '</body>');
            res.send(html);
            return;
        }

        res.send(Buffer.from(await backendRes.arrayBuffer()));
    } catch (err) {
        const wantsJson = backendPath.startsWith('/api/') || backendPath.startsWith('/admin/api/');
        const message = `Could not reach the bot backend at ${cleanBackend}. Is it running? (${err.message})`;
        if (wantsJson) res.status(502).json({ ok: false, error: message });
        else res.status(502).send(escapeHtml(message));
    }
};
