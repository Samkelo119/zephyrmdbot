const { proxyToBot } = require('../vercel-admin/api/_liveProxy');

module.exports = async function handler(req, res) {
    return proxyToBot(req, res, '/api/pair-status');
};
