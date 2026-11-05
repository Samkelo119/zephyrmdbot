// vercel-admin/api/_servers.js
// Configures the always-on WhatsApp bot backend used by the Vercel proxy.
// BACKEND_URL can override this default in Vercel project settings.
function getServers() {
    if (process.env.BACKEND_SERVERS) {
        try {
            const parsed = JSON.parse(process.env.BACKEND_SERVERS);
            if (Array.isArray(parsed) && parsed.length) {
                return parsed
                    .filter(s => s && s.url)
                    .map((s, i) => ({ name: s.name || `Server ${i + 1}`, url: String(s.url).replace(/\/+$/, '') }));
            }
        } catch (e) { /* fall through to single-server / configured default */ }
    }
    const backendUrl = process.env.BACKEND_URL || 'https://zephyr-md-pair3.onrender.com';
    return [{ name: 'ZEPHYR MD', url: backendUrl.replace(/\/+$/, '') }];
}

module.exports = { getServers };
