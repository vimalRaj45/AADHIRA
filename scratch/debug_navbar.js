const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 750, isMobile: true, hasTouch: true });
  
  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  
  console.log('Logging in...');
  await page.type('input[type="password"]', 'vimal_2026');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  
  console.log('Current URL:', page.url());
  
  const debugInfo = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const button = document.querySelector('button[onclick="toggleMobileMenu()"]');
    const icon = document.getElementById('mobileMenuIcon');
    const drawer = document.getElementById('mobileMenuDrawer');
    const panel = document.getElementById('mobileMenuPanel');
    
    return {
      nav: nav ? {
        outerHTML: nav.outerHTML,
        rect: nav.getBoundingClientRect(),
        display: window.getComputedStyle(nav).display,
        visibility: window.getComputedStyle(nav).visibility,
        opacity: window.getComputedStyle(nav).opacity,
        zIndex: window.getComputedStyle(nav).zIndex
      } : null,
      button: button ? {
        outerHTML: button.outerHTML,
        rect: button.getBoundingClientRect(),
        display: window.getComputedStyle(button).display,
        visibility: window.getComputedStyle(button).visibility,
        opacity: window.getComputedStyle(button).opacity,
        color: window.getComputedStyle(button).color
      } : null,
      icon: icon ? {
        rect: icon.getBoundingClientRect(),
        display: window.getComputedStyle(icon).display,
        fontFamily: window.getComputedStyle(icon).fontFamily,
        fontSize: window.getComputedStyle(icon).fontSize,
        beforeContent: window.getComputedStyle(icon, '::before').content
      } : null,
      drawer: drawer ? {
        display: window.getComputedStyle(drawer).display,
        rect: drawer.getBoundingClientRect()
      } : null,
      panel: panel ? {
        display: window.getComputedStyle(panel).display,
        rect: panel.getBoundingClientRect(),
        transform: window.getComputedStyle(panel).transform
      } : null
    };
  });
  
  console.log('DEBUG INFO:', JSON.stringify(debugInfo, null, 2));
  
  await browser.close();
})();
