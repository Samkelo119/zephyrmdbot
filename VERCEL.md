## Vercel — pairing site

Vercel serves the pairing website at your Vercel URL. Generate Code posts to that same origin (`/api/pair`). The browser never opens a Render pairing website.

The WhatsApp socket still runs on the always-on bot. Vercel `/api/pair` proxies to it server-side.

1. Deploy this repository to Vercel with the repository root as the project root and redeploy after code changes.
2. Optional env (live bot only, not the pairing page):
   ```
   BOT_URL = https://zephyrmdbot.onrender.com
   ```
   Use your Railway URL if Railway is the always-on bot.
3. Open the Vercel pairing page, enter a session name and WhatsApp number with country code, then generate the code.
4. If the code request fails, wait 30 seconds for the live bot to wake and try again.

The bot backend must stay online and its `auth_info/` and `data/` directories should be on persistent storage to keep linked sessions across restarts.
