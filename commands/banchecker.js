function digits(input) {
    return String(input || '').replace(/[^0-9]/g, '');
}

async function banumber(sock, from, msg, q) {
    const number = digits(q);
    if (!number) {
        return sock.sendMessage(from, {
            text: 'Usage: .banumber 27621834910\n\nExample: .banumber 27621834910'
        }, { quoted: msg });
    }
    if (number.length < 8 || number.length > 15) {
        return sock.sendMessage(from, { text: 'Invalid phone number.' }, { quoted: msg });
    }
    await sock.sendMessage(from, {
        text:
            '*WHATSAPP NUMBER REPORT CHECK*\n\n' +
            `Number: +${number}\n` +
            'Requested reports: 100\n\n' +
            'Status: NOT SUBMITTED\n\n' +
            'This bot cannot submit reports directly to WhatsApp or verify whether the number has been banned.\n\n' +
            'If the number is abusive or fraudulent, report it through WhatsApp using the chat or contact information options.'
    }, { quoted: msg });
}

async function banchecker(sock, from, msg, q) {
    const number = digits(q);
    if (!number || number.length < 8) {
        return sock.sendMessage(from, { text: 'Usage: .banchecker 27832573402' }, { quoted: msg });
    }
    try {
        const jid = number + '@s.whatsapp.net';
        const result = await sock.onWhatsApp(jid);
        const hit = Array.isArray(result) ? result[0] : result;
        if (hit && hit.exists) {
            await sock.sendMessage(from, {
                text: `✅ *Ban Checker*\nNumber: +${number}\nWhatsApp: REGISTERED\nStatus: Active on WhatsApp\nJID: ${hit.jid || jid}`
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, {
                text: `⚠️ *Ban Checker*\nNumber: +${number}\nWhatsApp: NOT FOUND\nThis number is not registered, banned, or invalid.`
            }, { quoted: msg });
        }
    } catch (e) {
        await sock.sendMessage(from, { text: 'Ban check failed: ' + (e.message || e) }, { quoted: msg });
    }
}

module.exports = { banchecker, banumber };
