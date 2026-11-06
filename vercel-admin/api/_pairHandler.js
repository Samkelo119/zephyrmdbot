const { proxyToBot } = require('./_liveProxy');

module.exports = async function pairHandler(req, res) {
    return proxyToBot(req, res, '/api/pair');
};
