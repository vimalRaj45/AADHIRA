const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport to mobile size
  await page.setViewport({ width: 375, height: 750, isMobile: true, hasTouch: true });
  
  console.log('Navigating to login page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  
  console.log('Logging in...');
  await page.type('input[type="password"]', 'vimal_2026');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  
  console.log('Navigated to: ' + page.url());
  
  // Verify we are on /admin
  if (!page.url().includes('/admin')) {
    console.error('Login failed, still on login page');
    await browser.close();
    process.exit(1);
  }
  
  console.log('Clicking hamburger menu button...');
  await page.click('button[onclick="toggleMobileMenu()"]');
  
  console.log('Waiting for right-to-left transitions...');
  await new Promise(resolve => setTimeout(resolve, 600)); // wait for animation
  
  console.log('Taking screenshot...');
  const screenshotPath = path.join(__dirname, 'mobile_drawer.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to: ' + screenshotPath);
  
  await browser.close();
  console.log('Done.');
})();
