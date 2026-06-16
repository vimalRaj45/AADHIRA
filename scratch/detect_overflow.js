const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 900, isMobile: true, hasTouch: true });
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="password"]', 'vimal_2026');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  
  const overflowInfo = await page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const bodyScrollWidth = document.body.scrollWidth;
    const bodyClientWidth = document.body.clientWidth;
    
    // Check which elements are wider than clientWidth
    const wideElements = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > clientWidth) {
        wideElements.push({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          width: rect.width,
          rectLeft: rect.left
        });
      }
    });
    
    return {
      scrollWidth,
      clientWidth,
      bodyScrollWidth,
      bodyClientWidth,
      wideElements
    };
  });
  
  console.log('OVERFLOW INFO:', JSON.stringify(overflowInfo, null, 2));
  await browser.close();
})();
