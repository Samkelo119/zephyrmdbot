## Vercel — pairing site

Vercel serves the pairing page; the WhatsApp socket and pairing-code generation run on the always-on bot backend. The pairing page and Vercel API proxy default to `https://zephyr-md-pair3.onrender.com`.

1. Deploy this repository to Vercel with the repository root as the project root and redeploy after code changes.
2. No `BACKEND_URL` variable is needed when using the default backend. If you set `BACKEND_URL` in Vercel, it overrides the default; set it to `https://zephyr-md-pair3.onrender.com` or remove the override.
3. Open the Vercel pairing page, enter a session name and WhatsApp number with country code, then generate the code.
4. If the code request fails, check that the Render service is awake and running this bot's `/api/pair` endpoint. Vercel cannot generate a WhatsApp code itself, and a configuration change cannot make an unavailable backend work.

The bot backend must stay online and its `auth_info/` and `data/` directories should be on persistent storage to keep linked sessions across restarts.
