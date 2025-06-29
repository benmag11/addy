const puppeteer = require('puppeteer');

async function testCountdownTimer() {
  console.log('🚀 Testing countdown timer functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to signup page
    await page.goto('http://localhost:3003/signup', { 
      waitUntil: 'networkidle2' 
    });
    
    console.log('✓ Loaded signup page');
    
    // Fill in email and password to trigger verification step
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'testpassword123');
    
    console.log('✓ Filled in form fields');
    
    // Click continue to move to verification step
    await page.click('button[type="submit"]');
    
    // Wait for verification step to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we're in verification step
    const verificationInput = await page.$('input[placeholder="Enter code"]');
    if (verificationInput) {
      console.log('✓ Moved to verification step');
      
      // Check for countdown timer
      const resendButton = await page.$('button:contains("Resend in")');
      if (resendButton) {
        const buttonText = await page.evaluate(el => el.textContent, resendButton);
        console.log('✓ Countdown timer found:', buttonText);
        
        // Wait a few seconds and check if countdown decreases
        await new Promise(resolve => setTimeout(resolve, 3000));
        const newButtonText = await page.evaluate(el => el.textContent, resendButton);
        console.log('✓ Countdown after 3s:', newButtonText);
        
        // Check if button is disabled during countdown
        const isDisabled = await page.evaluate(el => el.disabled, resendButton);
        console.log('✓ Button disabled during countdown:', isDisabled);
      } else {
        console.log('❌ Countdown timer not found');
      }
    } else {
      console.log('❌ Could not reach verification step (expected with placeholder Supabase)');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/countdown-test.png',
      fullPage: true
    });
    
    console.log('✓ Screenshot saved to screenshots/countdown-test.png');
    
  } catch (error) {
    console.error('❌ Error testing countdown:', error.message);
  } finally {
    await browser.close();
  }
}

testCountdownTimer();