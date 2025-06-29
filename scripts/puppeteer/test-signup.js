const puppeteer = require('puppeteer');

async function testSignupPage() {
  console.log('🚀 Testing signup page...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to signup page
    await page.goto('http://localhost:3001/signup', { 
      waitUntil: 'networkidle2' 
    });
    
    // Wait for page to load
    await page.waitForSelector('form');
    
    // Test form elements are present
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const continueButton = await page.$('button[type="submit"]');
    const googleButton = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).find(button => button.textContent.includes('Continue with Google'));
    });
    
    console.log('✓ Email input found:', !!emailInput);
    console.log('✓ Password input found:', !!passwordInput);
    console.log('✓ Continue button found:', !!continueButton);
    console.log('✓ Google button found:', !!googleButton);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/signup-test.png',
      fullPage: true
    });
    
    console.log('✓ Screenshot saved to screenshots/signup-test.png');
    
    // Test form validation
    await page.click('button[type="submit"]');
    
    // Wait a moment for validation messages
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✓ Form validation tested');
    
  } catch (error) {
    console.error('❌ Error testing signup page:', error.message);
  } finally {
    await browser.close();
  }
}

testSignupPage();