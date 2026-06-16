const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 900, isMobile: true, hasTouch: true });
  
  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  
  console.log('Logging in...');
  await page.type('input[type="password"]', 'vimal_2026');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  
  console.log('Taking overview screenshot...');
  const screenshotPath = path.join(__dirname, 'overview_mobile.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to: ' + screenshotPath);
  
  await browser.close();
  console.log('Done.');
})();
