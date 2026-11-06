# Deployment Guide — ZEPHYR MD Bot

Works on hosts that can run a persistent Node.js process. Quick notes for each platform:

## Railway
1. Import this repository into Railway and deploy from GitHub. The checked-in `railway.json` selects Nixpacks; `nixpacks.toml` installs Node.js 24 and ffmpeg, installs the npm dependencies, then starts `node bootstrap.js`.
2. Add the required variables in Railway → Service → Variables. At minimum, set `OWNER_NUMBER` (country code, digits only) and a strong `ADMIN_PANEL_PASSWORD`. Add optional API keys only if you use those features.
3. Generate a public domain in Railway → Service → Settings → Networking. The app listens on Railway's `PORT` and serves the pairing page at `/`.
4. **Attach persistent storage before pairing.** Railway's container filesystem is ephemeral; without a persistent volume, a redeploy/restart can erase the WhatsApp credentials (`auth_info/`) and bot data (`data/`), requiring a new pairing. Use persistent storage mounted at paths that preserve both directories; do not mount a volume over the application root, because that would hide the deployed code.
5. Open the public domain, generate a pairing code, and link it from WhatsApp → Linked devices → Link with phone number. Confirm the service logs report a successful connection.

## Replit
1. Import the GitHub repo into Replit (or upload the zip).
2. `.replit` is already included — it auto-runs `node index.js`.
3. Click "Run" once to install deps + pair your number.
4. **Free Replit "Always On" was discontinued** — for 24/7 uptime you now need a **Reserved VM Deployment** (paid) from the Deploy tab, otherwise the bot sleeps when the tab closes.
5. Admin panel: `https://<your-repl-name>.<username>.repl.co/admin`

## Heroku
1. `app.json` + `Procfile` are included — use "Deploy to Heroku" or `heroku create && git push heroku main`.
2. Set config vars: `heroku config:set OWNER_NUMBER=923xxxxxxxxx ADMIN_PANEL_PASSWORD="your pass"`
3. **Heroku's filesystem is ephemeral** — every dyno restart/redeploy wipes `auth_info/` and `data/`, meaning you'd have to re-pair after every restart. For a bot you pair once and forget, Railway, a VPS, or Termux is a better fit.

## Katabump
- Startup command: `node index.js`
- Select Node.js 20+ and run `npm install` once (the panel usually does this automatically).
- Set your environment variables in the panel.

## Termux (run it on your own Android phone)
```bash
pkg install git -y
git clone <your-repo-url>
cd zephyrmdbot
bash termux-setup.sh
node bootstrap.js
```

## Any other host
- The app listens on `process.env.PORT` (falls back to 3000).
- Keep `auth_info/` and `data/` on persistent writable storage if the host uses ephemeral containers.
- Set `OWNER_NUMBER` and `ADMIN_PANEL_PASSWORD` in the host's environment rather than committing secrets.

## Vercel pairing site

The pairing website is `https://<project>.vercel.app`. Generate Code posts to that same origin (`/api/pair`). The browser never opens a Render pairing URL. Optional Vercel env for the live bot only:

```
BOT_URL = https://zephyrmdbot.onrender.com
```

Use your Railway URL if Railway is the always-on bot.

## Environment variables
| Variable | Purpose | Default |
|---|---|---|
| `OWNER_NUMBER` | Owner WhatsApp number, digits only | `27621834910` |
| `PORT` | Web server port | `3000` |
| `ADMIN_PANEL_PASSWORD` | Admin panel password | Set a strong secret |
| `OPENAI_API_KEY` | For `.ai` command | none |
