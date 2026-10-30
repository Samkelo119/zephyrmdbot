const webp = require('node-webpmux');
const crypto = require('crypto');

const PACK_NAME = '༒ZᴇᴘʜʏʀMᴅ༆';
const PACK_PUBLISHER = 'MʀDɪᴇHᴀʀᴅTᴇᴄʜX';

async function withPackMeta(buffer, packName = PACK_NAME, publisher = PACK_PUBLISHER) {
    const img = new webp.Image();
    await img.load(buffer);
    const json = {
        'sticker-pack-id': crypto.randomBytes(16).toString('hex'),
        'sticker-pack-name': packName,
        'sticker-pack-publisher': publisher,
        emojis: ['⚡']
    };
    const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
    const exifAttr = Buffer.from([
        0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00,
        0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);
    const exif = Buffer.concat([exifAttr, jsonBuf]);
    exif.writeUIntLE(jsonBuf.length, 14, 4);
    img.exif = exif;
    return img.save(null);
}

module.exports = { PACK_NAME, PACK_PUBLISHER, withPackMeta };
