const { proxyToBot } = require('./_liveProxy');

async function pairHandler(req, res) {
    return proxyToBot(req, res, '/api/pair');
}

pairHandler.config = { maxDuration: 60 };
module.exports = pairHandler;
