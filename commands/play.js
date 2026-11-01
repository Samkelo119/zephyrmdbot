const yts = require('yt-search');
const axios = require('axios');

async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const searchQuery = text.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            return await sock.sendMessage(chatId, {
                text: 'What song do you want to download?'
            }, { quoted: message });
        }

        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return await sock.sendMessage(chatId, {
                text: 'No songs found!'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: '_Please wait your download is in progress_'
        }, { quoted: message });

        const video = videos[0];
        const urlYt = video.url;

        const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${encodeURIComponent(urlYt)}`, { timeout: 60000 });
        const data = response.data;

        if (!data || !data.status || !data.result || !data.result.downloadUrl) {
            return await sock.sendMessage(chatId, {
                text: 'Failed to fetch audio from the API. Please try again later.'
            }, { quoted: message });
        }

        const audioUrl = data.result.downloadUrl;
        const title = data.result.title || video.title || 'audio';

        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in play command:', error);
        await sock.sendMessage(chatId, {
            text: 'Download failed. Please try again later.'
        }, { quoted: message });
    }
}

module.exports = playCommand;
