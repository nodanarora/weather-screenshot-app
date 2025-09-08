import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(helmet());

const PORT = process.env.PORT || 8080;

// Target sites and CSS selectors for the forecast region
const TARGETS = [
  {
    name: 'tenki.jp',
    url: 'https://tenki.jp/lite/forecast/3/11/4020/8223/1hour.html',
    selector: 'div.forecast-point-1h-wrap, .hourly', // try a couple selectors
  },
  {
    name: 'weathernews',
    url: 'https://weathernews.jp/onebox/tenki/ibaraki/08223/',
    selector: 'section.wx_onebox, .onebox', 
  },
  {
    name: 'nhk',
    url: 'https://www.nhk.or.jp/kishou-saigai/city/weather/08223000822300/',
    selector: 'div.weather-forecast-hourly, .hourly-forecast',
  },
  {
    name: 'yahoo',
    url: 'https://weather.yahoo.co.jp/weather/jp/8/4020/8223.html?rd=1',
    selector: 'section.forecastCity, .forecastCity',
  },
];

// Helper to attempt to find element using comma-separated selectors
async function findElement(page, selectorStr) {
  if (!selectorStr) return null;
  const selectors = selectorStr.split(',').map(s => s.trim()).filter(Boolean);
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) return el;
    } catch (e) {
      // ignore and try next
    }
  }
  return null;
}

app.get('/api/screenshot', async (req, res) => {
  // Optional query param 'sites' to limit (comma separated names), e.g. ?sites=tenki.jp,yahoo
  const q = req.query.sites ? req.query.sites.split(',').map(s=>s.trim()) : null;

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      // executablePath can be set via env var PUPPETEER_EXECUTABLE_PATH if needed
    });

    const pagePromises = TARGETS
      .filter(t => !q || q.includes(t.name))
      .map(async (t) => {
        const page = await browser.newPage();
        // set common User-Agent to reduce bot fingerprint
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36');
        await page.setViewport({ width: 1200, height: 900 });

        try {
          await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 60000 });
        } catch (e) {
          // continue to try to capture whatever loaded
          console.warn(`goto failed for ${t.url}:`, e.message);
        }

        // small wait for dynamic content
        await page.waitForTimeout(1200);

        const el = await findElement(page, t.selector);
        if (!el) {
          await page.close();
          return { site: t.name, url: t.url, error: 'selector not found' };
        }

        try {
          // capture element screenshot as buffer
          const buffer = await el.screenshot({ type: 'png' });
          const b64 = buffer.toString('base64');
          await page.close();
          return { site: t.name, url: t.url, image: `data:image/png;base64,${b64}` };
        } catch (e) {
          await page.close();
          return { site: t.name, url: t.url, error: e.message };
        }
      });

    const results = await Promise.all(pagePromises);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.json([
    { site: "error", url: "", image: null, error: err.message }
    ]);
  } finally {
    if (browser) await browser.close();
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
