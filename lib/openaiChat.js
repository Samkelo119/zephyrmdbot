const axios = require('axios');
const apiKeys = require('./apiKeys');

const MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-3.5-turbo'];
const SYSTEM = 'You are Zephyr MD, a helpful WhatsApp assistant created by MrDieHardTechX. Reply in the same language the user writes in. Keep answers clear and concise.';

function getKey() {
    return String(apiKeys.get('openaiApiKey') || process.env.OPENAI_API_KEY || '').trim();
}

function errorText(err) {
    const data = err && err.response && err.response.data;
    const apiMsg = data && (data.error && data.error.message || data.message);
    if (apiMsg) return String(apiMsg);
    return (err && err.message) || 'AI failed to respond.';
}

async function chat(userMessage, opts = {}) {
    const apiKey = getKey();
    if (!apiKey) throw new Error('AI is not configured. Set openaiApiKey in the admin panel.');

    const models = [];
    if (opts.model) models.push(opts.model);
    for (const m of MODELS) if (!models.includes(m)) models.push(m);

    let lastErr;
    for (const model of models) {
        try {
            const { data } = await axios.post('https://api.openai.com/v1/chat/completions', {
                model,
                messages: [
                    { role: 'system', content: opts.system || SYSTEM },
                    { role: 'user', content: String(userMessage || '').slice(0, 8000) }
                ],
                max_tokens: opts.maxTokens || 500,
                temperature: opts.temperature == null ? 0.7 : opts.temperature
            }, {
                timeout: 40000,
                headers: {
                    Authorization: 'Bearer ' + apiKey,
                    'Content-Type': 'application/json'
                }
            });
            const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
            if (text && String(text).trim()) return String(text).trim();
        } catch (err) {
            lastErr = err;
            const status = err && err.response && err.response.status;
            if (status === 401 || status === 403) throw new Error('AI key was rejected. Update openaiApiKey in the admin panel.');
            continue;
        }
    }
    throw new Error(errorText(lastErr));
}

module.exports = { chat, getKey };
