// scripts/takeScreenshots.js
//
// Reads scripts/urls.json and takes a screenshot of each URL,
// saving the result to images/screenshots/<name>.png
//
// Run locally with:
// npm install && npx playwright install --with-deps chromium && npm run screenshot

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const URLS_FILE = path.join(__dirname, "urls.json");
const OUTPUT_DIR = path.join(__dirname, "..", "images/screenshots");

// Tries a list of common "accept cookies" button texts/selectors, searching
// both the main page and any iframes (many consent dialogs, e.g. MAL's,
// render inside an iframe rather than the top-level document).
async function dismissCookieBanners(page) {
  const candidates = [
    'button:has-text("Accept all")',
    'button:has-text("Accept All")',
    'button:has-text("I agree")',
    'button:has-text("I Agree")',
    'button:has-text("Agree")',
    'button:has-text("AGREE")',
    'button:has-text("Accept")',
    'button:has-text("Allow all")',
    'button:has-text("Allow All")',
    'button:has-text("Got it")',
    'button:has-text("Consent")',
    '[aria-label="Accept all"]',
    '[aria-label="AGREE"]',
    '[aria-label="Agree"]',
    "#onetrust-accept-btn-handler",
    "#accept-btn", // Quantcast CMP (qc-cmp2) — used by MyAnimeList
  ];

  // Run two passes: consent iframes sometimes take a moment to load
  for (let pass = 0; pass < 2; pass++) {
    const frames = page.frames(); // includes the main frame
    for (const frame of frames) {
      for (const selector of candidates) {
        try {
          const el = frame.locator(selector).first();
          if (await el.isVisible({ timeout: 500 })) {
            await el.click({ timeout: 1000 });
            await page.waitForTimeout(500);
          }
        } catch {
          // selector not found / not clickable in this frame — ignore
        }
      }
    }
    await page.waitForTimeout(1000);
  }
}

async function main() {
  const targets = JSON.parse(fs.readFileSync(URLS_FILE, "utf-8"));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();

  for (const target of targets) {
    if (!target.name) {
      continue; // e.g. the "_comment" documentation entry in urls.json
    }

    if (!target.url || target.url.startsWith("SKIP_")) {
      console.warn(`Skipping "${target.name}" — due to SKIP_ tag being used`);
      continue;
    }

    const width = target.width || 1280;
    const height = target.height || 800;

    const context = await browser.newContext({
      viewport: { width, height },
      locale: "en-US",
      colorScheme: "dark",
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
      },
      // A normal desktop UA helps avoid some "unsupported browser" pages
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    });

    // Pre-accept Google's cookie consent (covers youtube.com / music.youtube.com),
    // force English, and nudge YouTube into dark mode.
    await context.addCookies([
      { name: "CONSENT", value: "YES+1", domain: ".youtube.com", path: "/" },
      { name: "CONSENT", value: "YES+1", domain: ".google.com", path: "/" },
      {
        name: "SOCS",
        value: "CAISHAgBEhJnd3NfMjAyNDAxMDEtMF9SQzIaAmRlIAEaBgiA_LyaBg",
        domain: ".youtube.com",
        path: "/",
      },
      {
        name: "SOCS",
        value: "CAISHAgBEhJnd3NfMjAyNDAxMDEtMF9SQzIaAmRlIAEaBgiA_LyaBg",
        domain: ".google.com",
        path: "/",
      },
      // f6=40000000 + f7=100 = dark theme; hl=en = English UI
      {
        name: "PREF",
        value: "f6=40000000&f7=100&hl=en",
        domain: ".youtube.com",
        path: "/",
      },
      {
        name: "PREF",
        value: "f6=40000000&f7=100&hl=en",
        domain: ".google.com",
        path: "/",
      },
    ]);

    const page = await context.newPage();

    console.log(`Capturing ${target.name} -> ${target.url}`);

    try {
      await page.goto(target.url, { waitUntil: "networkidle", timeout: 60000 });

      // Try to dismiss any cookie/consent banners that slipped through
      await dismissCookieBanners(page);

      // Small extra wait for lazy-loaded content (thumbnails, lists, etc.)
      await page.waitForTimeout(2000);

      const outputPath = path.join(OUTPUT_DIR, `${target.name}.png`);

      const screenshotOptions = { path: outputPath, fullPage: false };
      if (target.clip) {
        screenshotOptions.clip = target.clip;
      }

      await page.screenshot(screenshotOptions);

      console.log(`  saved ${outputPath}`);
    } catch (err) {
      console.error(`  failed to capture ${target.name}: ${err.message}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
