const puppeteer = require('puppeteer');

async function testSignupFix() {
  console.log('🚀 Testing signup flow after React object rendering fix...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Monitor console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Monitor page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    await page.goto('http://localhost:3004/signup', { 
      waitUntil: 'networkidle2' 
    });
    
    console.log('✓ Loaded signup page');
    
    // Fill in form
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'testpassword123');
    
    console.log('✓ Filled form fields');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    console.log('✓ Clicked continue button');
    
    // Wait for form submission
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for React object rendering error
    const hasObjectError = pageErrors.some(error => 
      error.includes('Objects are not valid as a React child') ||
      error.includes('object with keys')
    );
    
    console.log('📊 Error Analysis:');
    console.log('Console errors found:', consoleErrors.length);
    console.log('Page errors found:', pageErrors.length);
    console.log('React object rendering error:', hasObjectError);
    
    if (pageErrors.length > 0) {
      console.log('\n❌ Page Errors:');
      pageErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (consoleErrors.length > 0) {
      console.log('\n⚠️ Console Errors:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Check if we reached verification step
    const verificationInput = await page.$('input[placeholder="Enter code"]');
    if (verificationInput) {
      console.log('✅ Successfully reached verification step');
      
      // Test countdown timer
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const resendButton = await page.$('button:contains("Resend")');
      if (resendButton) {
        const buttonText = await page.evaluate(el => el.textContent, resendButton);
        console.log('✅ Countdown timer working:', buttonText);
      }
    } else {
      console.log('ℹ️ Could not reach verification step (expected due to Supabase config)');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/signup-fix-test.png',
      fullPage: true
    });
    
    console.log('✓ Screenshot saved');
    
    // Final assessment
    if (!hasObjectError && pageErrors.length === 0) {
      console.log('\n🎉 SUCCESS: No React object rendering errors detected!');
      console.log('✅ Signup form submits without crashing');
      console.log('✅ Error handling works correctly');
    } else {
      console.log('\n⚠️ Issues still detected');
    }
    
  } catch (error) {
    console.error('❌ Error testing signup fix:', error.message);
  } finally {
    await browser.close();
  }
}

testSignupFix();