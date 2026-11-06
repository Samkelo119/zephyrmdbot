const { proxyToBot } = require('../vercel-admin/api/_liveProxy');

async function handler(req, res) {
    return proxyToBot(req, res, '/api/pair-status');
}

handler.config = { maxDuration: 30 };
module.exports = handler;
