<div align="center">

```
███████╗███████╗██████╗ ██╗  ██╗██╗   ██╗██████╗     ███╗   ███╗██████╗
╚══███╔╝██╔════╝██╔══██╗██║  ██║╚██╗ ██╔╝██╔══██╗    ████╗ ████║██╔══██╗
  ███╔╝ █████╗  ██████╔╝███████║ ╚████╔╝ ██████╔╝    ██╔████╔██║██║  ██║
 ███╔╝  ██╔══╝  ██╔═══╝ ██╔══██║  ╚██╔╝  ██╔══██╗    ██║╚██╔╝██║██║  ██║
███████╗███████╗██║     ██║  ██║   ██║   ██║  ██║    ██║ ╚═╝ ██║██████╔╝
╚══════╝╚══════╝╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚═╝     ╚═╝╚═════╝
```

# ZEPHYR MD

**Multi-device WhatsApp bot by MʀDɪᴇHᴀʀᴅTᴇᴄʜX**

[![Node](https://img.shields.io/badge/Node.js-20%2B-00ffb3?style=for-the-badge&logo=nodedotjs&logoColor=black)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-MD-7c5cff?style=for-the-badge)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/License-Private-111827?style=for-the-badge)](https://github.com/Samkelo119/zephyrmdbot)
[![Owner](https://img.shields.io/badge/Owner-27832573402-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/27832573402)

[WhatsApp Channel](https://whatsapp.com/channel/0029Vb8p6DV8aKvNTp6n8n45) · [Pairing Console](#-quick-start) · [Commands](#-command-map)

<br>

<a href="https://zephyrmdbot.onrender.com/" target="_blank" rel="noopener">
  <img src="https://img.shields.io/badge/PAIR%20NOW-Click%20to%20Connect-25D366?style=for-the-badge&logo=whatsapp&logoColor=white&labelColor=111827" alt="PAIR NOW">
</a>

<br><br>

<a href="https://zephyr-md-pair3.onrender.com/" target="_blank" rel="noopener">
  <img src="https://img.shields.io/badge/PAIR%20NOW%202-Click%20to%20Connect-7c5cff?style=for-the-badge&logo=whatsapp&logoColor=white&labelColor=111827" alt="PAIR NOW 2">
</a>

</div>

---

<p align="center">
  <b>Pair once. Stay online. Control everything from WhatsApp.</b><br>
  Stylish boxed replies · exclusive per-user prefix · 17 menu fonts · live APIs · owner lock
</p>

```
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  PAIR AT zephyrmdbot.onrender.com    ┃
┃  WhatsApp > Linked Devices           ┃
┃  Generate a live 8-character code    ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
```

---

## Why ZEPHYR MD

| | Feature | Detail |
| :---: | :--- | :--- |
| 01 | Pairing | Live 8-character WhatsApp code from the pairing site |
| 02 | 24/7 | Presence keep-alive, reconnect watchdog, crash guards |
| 03 | Prefix | Each user has their own prefix. After `.setprefix`, only that prefix works |
| 04 | Menu | Picture + full command list in one message, 17 fonts via `.menustyle` |
| 05 | Mode | `.public` / `.private` / `.mode` — public or owner-only |
| 06 | Stickers | Pack name `༒ZᴇᴘʜʏʀMᴅ༆` |
| 07 | Clock | `.time` / `.clock` use Africa/Johannesburg (SAST) |

---

## Quick Start

```bash
git clone https://github.com/Samkelo119/zephyrmdbot.git
cd zephyrmdbot
node bootstrap.js
```

`bootstrap.js` installs dependencies on first run, then starts the bot on port **3000**.

1. Open the pairing page: [zephyrmdbot.onrender.com](https://zephyrmdbot.onrender.com/)
2. Enter your WhatsApp number with country code (no `+`)
3. Tap **Generate** — a live code appears
4. Phone: **Linked Devices → Link with phone number**
5. Enter the 8-character code within about one minute

```bash
npm install
node index.js
```

---

## Pairing

The pairing console requests a real companion code from WhatsApp, so every
code is different and only valid for a short time.

| Step | Action |
| :--- | :--- |
| 1 | Open [zephyrmdbot.onrender.com](https://zephyrmdbot.onrender.com/) |
| 2 | Enter the WhatsApp number with country code |
| 3 | Tap **Generate** |
| 4 | Copy the live 8-character code |
| 5 | Phone: **Linked Devices → Link with phone number → enter the code** |

If the code expires, tap Generate again for a fresh one.

---

## Command Map

Type `.menu` in WhatsApp for the live list with your prefix and font.

| Section | Commands |
| :--- | :--- |
| Core | `menu` `help` `alive` `ping` `owner` `runtime` `uptime` `mode` `time` `clock` `jid` |
| Owner | `public` `private` `mode` `setname` `setprefix` `hack` |
| Menu styles | `menustyle` `menustyle1` … `menustyle17` |
| Downloaders | `song` `video` `tiktok` `insta` `facebook` `apk` `ytdown` `crunchyroll` |
| Stickers | `sticker` `s` `toimg` `take` `telesticker` `tts` |
| Group | `kick` `promote` `demote` `hidetag` `tagall` `welcome` `grouplink` |
| Moderation | `mute` `warn` `filter` `slowmode` `antilink` `antidelete` `anticall` |
| Fun | `quote` `joke` `dice` `ship` `8ball` `meme` |
| Network | `sslcheck` `banchecker` `banumber` `dns` `ipinfo` |
| Live API | `crypto` `githubuser` `pokemon` `iss` `weather` `translate` |

`.mode` reports PUBLIC or PRIVATE. `.public` / `.private` are owner-only.

---

## Environment

| Variable | Purpose | Default |
| :--- | :--- | :--- |
| `OWNER_NUMBER` | Owner WhatsApp (no `+`) | `27832573402` |
| `PORT` | Pairing / admin port | `3000` |
| `ADMIN_PANEL_PASSWORD` | `/admin` login | set your own |
| `OPENAI_API_KEY` | `.ai` (optional) | unset |

Never commit `auth_info/`, `data/`, or `.env`.

---

## Layout

```
zephyrmdbot/
├── bootstrap.js          auto-install + start
├── index.js              socket, pairing, command router
├── pair.html             pairing console (live codes)
├── settings.js           bot name, owner, timezone
├── commands/             command modules
├── lib/                  menu, styles, prefix, admin
├── admin-panel/          /admin dashboard
├── assets/menu.jpg       menu image
├── auth_info/            WhatsApp session (gitignored)
└── data/                 runtime state (gitignored)
```

---

## Deploy

See `DEPLOY.md` for Railway, Replit, Heroku, Termux, and VPS.

```bash
pm2 start bootstrap.js --name zephyrmd-bot
```

WhatsApp needs a **persistent** Node process. Serverless hosts cannot keep the socket open.

---

## Owner

| | |
| :--- | :--- |
| Bot | ZEPHYR MD |
| Owner | MʀDɪᴇHᴀʀᴅTᴇᴄʜX |
| Number | [27832573402](https://wa.me/27832573402) |
| Channel | [whatsapp.com/channel/0029Vb8p6DV8aKvNTp6n8n45](https://whatsapp.com/channel/0029Vb8p6DV8aKvNTp6n8n45) |
| Repo | [Samkelo119/zephyrmdbot](https://github.com/Samkelo119/zephyrmdbot) |

<div align="center">

**Pᴏᴡᴇʀᴇᴅ Bʏ MʀDɪᴇHᴀʀᴅTᴇᴄʜX𓃵**

<a href="https://zephyrmdbot.onrender.com/" target="_blank" rel="noopener">
  <img src="https://img.shields.io/badge/PAIR%20NOW-Click%20to%20Connect-25D366?style=for-the-badge&logo=whatsapp&logoColor=white&labelColor=111827" alt="PAIR NOW">
</a>

<br><br>

<a href="https://zephyr-md-pair3.onrender.com/" target="_blank" rel="noopener">
  <img src="https://img.shields.io/badge/PAIR%20NOW%202-Click%20to%20Connect-7c5cff?style=for-the-badge&logo=whatsapp&logoColor=white&labelColor=111827" alt="PAIR NOW 2">
</a>

</div>
