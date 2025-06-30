const puppeteer = require('puppeteer');

async function testEmailDebug() {
  console.log('🚀 Testing email delivery with debug logging...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Capture all console messages
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log(`🖥️ Console: ${text}`);
    });
    
    // Capture errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
      console.log(`❌ Page Error: ${error.message}`);
    });
    
    await page.goto('http://localhost:3004/signup', { 
      waitUntil: 'networkidle2' 
    });
    
    console.log('✓ Loaded signup page');
    
    // Use a real email for testing
    const testEmail = 'test@gmail.com'; // Change this to your email
    
    await page.type('input[type="email"]', testEmail);
    await page.type('input[type="password"]', 'testpassword123');
    
    console.log(`✓ Filled form with email: ${testEmail}`);
    
    // Submit form and wait for response
    console.log('🚀 Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for signup process to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Look for verification step
    const verificationInput = await page.$('input[placeholder="Enter code"]');
    if (verificationInput) {
      console.log('✅ Reached verification step successfully');
      
      // Wait for countdown timer to appear
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to get the resend button
      const resendButton = await page.$('button:contains("Resend")') || 
                          await page.evaluate(() => {
                            const buttons = document.querySelectorAll('button');
                            return Array.from(buttons).find(btn => 
                              btn.textContent.includes('Resend') || 
                              btn.textContent.includes('send')
                            );
                          });
      
      if (resendButton) {
        console.log('🔄 Testing resend functionality...');
        
        // Wait for countdown to finish (or click if available)
        const buttonText = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          const resendBtn = Array.from(buttons).find(btn => 
            btn.textContent.includes('Resend') || btn.textContent.includes('send')
          );
          return resendBtn ? resendBtn.textContent : 'Not found';
        });
        
        console.log(`📱 Resend button text: "${buttonText}"`);
      }
    } else {
      console.log('❌ Did not reach verification step');
    }
    
    // Analyze console logs
    console.log('\n📊 Console Log Analysis:');
    const signupLogs = consoleLogs.filter(log => log.includes('🚀 Starting signup'));
    const supabaseLogs = consoleLogs.filter(log => log.includes('📊 Supabase signUp response'));
    const errorLogs = consoleLogs.filter(log => log.includes('❌') || log.includes('🚨'));
    
    console.log(`Signup attempts: ${signupLogs.length}`);
    console.log(`Supabase responses: ${supabaseLogs.length}`);
    console.log(`Error logs: ${errorLogs.length}`);
    
    if (errorLogs.length > 0) {
      console.log('\n🚨 Error Details:');
      errorLogs.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/email-debug-test.png',
      fullPage: true
    });
    
    console.log('✓ Screenshot saved');
    
    // Keep browser open for manual inspection
    console.log('\n⏱️ Browser will stay open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('💥 Error during testing:', error.message);
  } finally {
    await browser.close();
  }
}

testEmailDebug();