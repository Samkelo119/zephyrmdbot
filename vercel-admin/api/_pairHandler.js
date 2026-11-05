// vercel-admin/api/_pairHandler.js
// Vercel cannot maintain the WhatsApp socket. Pairing is delegated to the
// always-on backend configured by BACKEND_URL (or BACKEND_SERVERS).
const { resolveBackend } = require('./_resolveBackend');

module.exports = async function pairHandler(req, res) {
    const { servers, index, url: backend } = resolveBackend(req);

    if (!backend) {
        res.status(503).json({ ok: false, error: 'No pairing backend configured. Set BACKEND_URL to the public URL of your always-on Railway bot.' });
        return;
    }

    const segments = req.query && req.query.path
        ? (Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path))
        : '';
    const targetPath = segments ? `/api/pair/${segments.replace(/^\/+/, '')}` : '/api/pair';
    const search = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const targetUrl = `${backend.replace(/\/+$/, '')}${targetPath}${search}`;

    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];
    delete headers.connection;

    const fetchOpts = { method: req.method, headers, redirect: 'manual' };
    if (!['GET', 'HEAD'].includes(req.method)) {
        fetchOpts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    }

    try {
        const backendRes = await fetch(targetUrl, fetchOpts);
        const contentType = backendRes.headers.get('content-type') || 'application/json';
        const body = await backendRes.text();
        res.status(backendRes.status);
        res.setHeader('Content-Type', contentType);
        res.send(body);
    } catch (err) {
        res.status(502).json({ ok: false, error: `Could not reach pairing backend at ${backend}. Verify BACKEND_URL and that the Railway service is running. ${err.message}` });
    }
};
