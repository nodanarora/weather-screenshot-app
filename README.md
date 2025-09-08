# Weather Screenshot App (Render-ready)

This project captures only the forecast portions of four Japanese weather sites (tenki.jp, Weathernews, NHK, Yahoo) on-demand and returns the images directly (no persistent storage). It's designed to run as a single Web Service on Render.

## Features
- Single Express web service that serves the frontend and exposes `/api/screenshot`.
- `/api/screenshot` uses Puppeteer to capture the **forecast element** of each target and returns a JSON array of `{site, url, image}` where `image` is a `data:image/png;base64,...` string.
- Frontend (Vite + React) shows the four images and has an 「更新」 button to take screenshots at any time.

## Local quickstart
Requirements: Node 18+, npm.

1. Install dependencies
   ```
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

2. Build frontend
   ```
   cd frontend
   npm run build
   ```

3. Start backend
   ```
   cd ../backend
   npm start
   ```
   Then open http://localhost:8080

4. Click 「更新」 on the page to take on-demand screenshots.

## Render notes
- `render.yaml` is included for a simple Render deployment.
- Running Puppeteer in hosted environments often requires launch args `--no-sandbox --disable-setuid-sandbox` (already used).
- To shorten build time on Render, `PUPPETEER_SKIP_DOWNLOAD=true` is set in `render.yaml` so Puppeteer won't download Chromium during build. In that case you must ensure an executable Chromium is available in the runtime or set `PUPPETEER_EXECUTABLE_PATH` env var to point to it. If you prefer Puppeteer to download Chromium, remove that env var from render.yaml.

## Legal / Respectful scraping
- Please confirm each target site's terms of service and robots.txt. This project performs automated page access; use responsibly and at low frequency.
