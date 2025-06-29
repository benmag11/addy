const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class TextWrapTest {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  async testTextWrapping(url = 'http://localhost:3000') {
    console.log('🔍 Testing text wrapping at critical breakpoints...\n');
    
    // Critical breakpoints where wrapping might occur
    const testBreakpoints = [
      { name: 'Laptop Standard', width: 1024, height: 768 },
      { name: 'Desktop Small', width: 1280, height: 720 },
      { name: 'Desktop Standard', width: 1440, height: 900 },
      { name: 'Desktop Large', width: 1600, height: 900 }
    ];

    await this.page.goto(url, { waitUntil: 'networkidle2' });

    for (const breakpoint of testBreakpoints) {
      console.log(`📏 Testing ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
      
      await this.page.setViewport(breakpoint);
      
      // Wait for fonts to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test both headlines for wrapping
      const h1Height = await this.page.evaluate(() => {
        const h1 = document.querySelector('h1');
        return h1 ? h1.getBoundingClientRect().height : 0;
      });
      
      const h2Height = await this.page.evaluate(() => {
        const h2 = document.querySelector('h2');
        return h2 ? h2.getBoundingClientRect().height : 0;
      });
      
      // Get computed line-height to determine if text is wrapping
      const h1LineHeight = await this.page.evaluate(() => {
        const h1 = document.querySelector('h1');
        if (!h1) return 0;
        const style = window.getComputedStyle(h1);
        return parseFloat(style.lineHeight);
      });
      
      const h2LineHeight = await this.page.evaluate(() => {
        const h2 = document.querySelector('h2');
        if (!h2) return 0;
        const style = window.getComputedStyle(h2);
        return parseFloat(style.lineHeight);
      });
      
      // Check if element height is significantly larger than line height (indicating wrapping)
      const h1Wrapped = h1Height > (h1LineHeight * 1.5);
      const h2Wrapped = h2Height > (h2LineHeight * 1.5);
      
      console.log(`  H1 ("The leaving cert is hard."): ${h1Wrapped ? '❌ WRAPPED' : '✅ Single line'}`);
      console.log(`    Height: ${h1Height.toFixed(1)}px, Line height: ${h1LineHeight.toFixed(1)}px`);
      
      console.log(`  H2 ("Addy might be able to help."): ${h2Wrapped ? '❌ WRAPPED' : '✅ Single line'}`);
      console.log(`    Height: ${h2Height.toFixed(1)}px, Line height: ${h2LineHeight.toFixed(1)}px`);
      
      // Take screenshot for this breakpoint
      const screenshotPath = path.join(__dirname, '../../screenshots', `text-wrap-${breakpoint.width}.png`);
      await this.page.screenshot({ 
        path: screenshotPath,
        fullPage: false,
        clip: { x: 0, y: 0, width: breakpoint.width, height: 600 }
      });
      
      console.log(`  📸 Screenshot saved: text-wrap-${breakpoint.width}.png\n`);
    }
    
    console.log('🎯 Text wrapping test complete!');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const test = new TextWrapTest();
  test.init()
    .then(() => test.testTextWrapping())
    .then(() => test.close())
    .then(() => console.log('✅ Test completed successfully'))
    .catch(error => {
      console.error('❌ Test failed:', error);
      test.close();
    });
}

module.exports = TextWrapTest;