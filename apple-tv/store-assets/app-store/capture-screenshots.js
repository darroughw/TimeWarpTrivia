// Regenerates screenshots/*.png. Same idea as the Fire TV/Google Play
// screenshot sets (headless-capture the real web app in mock/demo mode),
// but MockTvFlow needs real ArrowRight/Enter keydowns to pass the
// transition/scoreboard/block screens — only the question screens' own
// countdown timer auto-advances on its own — so this drives a real
// browser via puppeteer-core rather than a one-off CLI screenshot.
//
// Usage (needs Node >= 18.17, puppeteer-core, and `npm run dev` already
// running against a checkout with no .env.local — see
// .env.local.example — so it falls back to MockTvFlow):
//
//   npm install --no-save puppeteer-core
//   node capture-screenshots.js ./screenshots
//
// Takes ~65s: mostly real wall-clock waits for the mock question
// screens' countdown timers (20s + 15s + 15s) to fire onTimeUp.

const puppeteer = require("puppeteer-core");
const path = require("path");

const OUT_DIR = process.argv[2];
if (!OUT_DIR) {
  console.error("Usage: node capture-screenshots.js <output-dir>");
  process.exit(1);
}

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";

function shotPath(name) {
  return path.join(OUT_DIR, name);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickByText(page, text) {
  const clicked = await page.evaluate((needle) => {
    const candidates = Array.from(document.querySelectorAll("button, a"));
    const match = candidates.find((el) => el.textContent && el.textContent.includes(needle));
    if (!match) return false;
    match.click();
    return true;
  }, text);
  if (!clicked) throw new Error(`No element found with text: ${text}`);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });

  try {
    // 1. Intro screen (/tv)
    const introPage = await browser.newPage();
    await introPage.goto(`${BASE}/tv`, { waitUntil: "networkidle0" });
    await introPage.waitForSelector("a");
    await sleep(500);
    await introPage.screenshot({ path: shotPath("screenshot-1-intro.png") });
    console.log("captured intro");
    await introPage.close();

    // Rest of the flow on /host (mock mode)
    const page = await browser.newPage();
    await page.goto(`${BASE}/host`, { waitUntil: "networkidle0" });

    // 2. Lobby — wait for the mock "players joining" feed to fill in.
    await sleep(4000);
    await page.screenshot({ path: shotPath("screenshot-2-lobby.png") });
    console.log("captured lobby");

    // 3. Start the game -> question screen.
    await clickByText(page, "Start Game");
    await sleep(1500);
    await page.screenshot({ path: shotPath("screenshot-3-question.png") });
    console.log("captured question");

    // Question times out on its own (20s) -> transition screen.
    await sleep(20000);

    // 4. transition -> scoreboard (ArrowRight)
    await page.keyboard.press("ArrowRight");
    await sleep(1000);
    await page.screenshot({ path: shotPath("screenshot-4-scoreboard.png") });
    console.log("captured scoreboard");

    // scoreboard -> block -> soloQuestion
    await page.keyboard.press("ArrowRight"); // scoreboard -> block
    await sleep(800);
    await page.keyboard.press("ArrowRight"); // block -> soloQuestion
    await sleep(15500); // soloQuestion times out (15s) -> soloTransition

    await page.keyboard.press("ArrowRight"); // soloTransition -> finalQuestion
    await sleep(15500); // finalQuestion times out (15s) -> finalTransition

    await page.keyboard.press("ArrowRight"); // finalTransition -> end
    await sleep(1500);
    await page.screenshot({ path: shotPath("screenshot-5-final-results.png") });
    console.log("captured final results");

    await page.close();
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
