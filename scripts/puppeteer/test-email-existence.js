const puppeteer = require('puppeteer');

async function testEmailExistenceFlow() {
  console.log('🧪 Testing email existence checking flow...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Capture console messages for debugging
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log(`🖥️ Console: ${text}`);
    });
    
    // Navigate to signup page
    await page.goto('http://localhost:3005/signup', { 
      waitUntil: 'networkidle2' 
    });
    
    console.log('✓ Loaded signup page');
    
    // Test 1: Check with an existing email (simulate with a test email that should exist)
    console.log('🔄 Testing with existing email...');
    
    await page.type('input[type="email"]', 'test@example.com');
    await page.waitForTimeout(1000); // Wait for debounce and API call
    
    // Check if "exists" message appears
    const existsMessage = await page.$('.bg-blue-50');
    if (existsMessage) {
      console.log('✅ Email existence message displayed correctly');
      
      // Check if "Sign in instead" link is present
      const signInLink = await page.$('a[href="/login"]');
      if (signInLink) {
        console.log('✅ "Sign in instead" link is present');
      } else {
        console.log('❌ "Sign in instead" link is missing');
      }
    } else {
      console.log('ℹ️ No email existence message (expected if email doesn\'t exist)');
    }
    
    // Test 2: Clear email and check reset behavior
    console.log('🔄 Testing email field reset...');
    
    await page.click('input[type="email"]', {clickCount: 3}); // Select all
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);
    
    // Check that message disappears
    const messageAfterClear = await page.$('.bg-blue-50');
    if (!messageAfterClear) {
      console.log('✅ Message correctly disappears when email is cleared');
    } else {
      console.log('❌ Message still visible after clearing email');
    }
    
    // Test 3: Check with invalid email
    console.log('🔄 Testing with invalid email...');
    
    await page.type('input[type="email"]', 'invalid-email');
    await page.waitForTimeout(600); // Wait for debounce
    
    const messageWithInvalidEmail = await page.$('.bg-blue-50');
    if (!messageWithInvalidEmail) {
      console.log('✅ No message shown for invalid email (correct behavior)');
    } else {
      console.log('❌ Message shown for invalid email (unexpected)');
    }
    
    // Test 4: Check loading state
    console.log('🔄 Testing loading state...');
    
    await page.click('input[type="email"]', {clickCount: 3}); // Select all
    await page.keyboard.press('Delete');
    await page.type('input[type="email"]', 'loading-test@example.com');
    
    // Look for loading spinner (should appear briefly)
    await page.waitForTimeout(200); // Quick check during loading
    const loadingSpinner = await page.$('.animate-spin');
    
    if (loadingSpinner) {
      console.log('✅ Loading spinner appeared during check');
    } else {
      console.log('ℹ️ Loading spinner not visible (may have been too fast)');
    }
    
    // Test 5: Check form submission still works
    console.log('🔄 Testing form submission...');
    
    await page.click('input[type="email"]', {clickCount: 3}); // Select all
    await page.keyboard.press('Delete');
    await page.type('input[type="email"]', 'new-user@example.com');
    await page.type('input[type="password"]', 'testpassword123');
    
    await page.waitForTimeout(1000); // Wait for any email checking to complete
    
    // Try to submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Check if we've moved to verification step or encountered expected behavior
    const verificationInput = await page.$('input[placeholder="Enter code"]');
    if (verificationInput) {
      console.log('✅ Form submission works - reached verification step');
    } else {
      console.log('ℹ️ Form submission behavior varies (may show error messages)');
    }
    
    // Take screenshot for manual review
    await page.screenshot({ 
      path: 'screenshots/email-existence-test.png',
      fullPage: true
    });
    
    console.log('✓ Screenshot saved');
    
    // Analyze console logs
    console.log('\\n📊 Console Log Analysis:');
    const apiLogs = consoleLogs.filter(log => 
      log.includes('checkEmailExists') || 
      log.includes('email') ||
      log.includes('auth')
    );
    
    console.log(`API-related logs: ${apiLogs.length}`);
    if (apiLogs.length > 0) {
      console.log('API logs:', apiLogs.slice(-3)); // Show last 3 logs
    }
    
    // Keep browser open for manual inspection
    console.log('\\n⏱️ Browser will stay open for 10 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('💥 Error during testing:', error.message);
  } finally {
    await browser.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\\n👋 Test interrupted by user');
  process.exit(0);
});

testEmailExistenceFlow();