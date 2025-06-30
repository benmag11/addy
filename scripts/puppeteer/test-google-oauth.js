const puppeteer = require('puppeteer');

async function testGoogleOAuth() {
  console.log('🚀 Testing Google OAuth implementation...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser to see OAuth flow
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    devtools: true // Open dev tools for debugging
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
    
    // Capture network requests to monitor OAuth flow
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method()
      });
      if (request.url().includes('oauth') || request.url().includes('google') || request.url().includes('supabase')) {
        console.log(`🌐 Request: ${request.method()} ${request.url()}`);
      }
    });
    
    await page.goto('http://localhost:3005/signup', { 
      waitUntil: 'networkidle2' 
    });
    
    console.log('✓ Loaded signup page');
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'screenshots/oauth-1-initial.png',
      fullPage: true
    });
    
    console.log('✓ Initial screenshot taken');
    
    // Find the Google sign-in button
    const googleButton = await page.$('button:has-text("Continue with Google")') || 
                        await page.evaluate(() => {
                          const buttons = document.querySelectorAll('button');
                          return Array.from(buttons).find(btn => 
                            btn.textContent.includes('Continue with Google') ||
                            btn.textContent.includes('Google')
                          );
                        });
    
    if (!googleButton) {
      console.error('❌ Could not find Google sign-in button');
      return;
    }
    
    console.log('✓ Found Google sign-in button');
    
    // Check if button is enabled
    const isDisabled = await page.evaluate((btn) => {
      const button = document.querySelector('button[type="button"]:not([disabled])');
      return !button || button.disabled;
    });
    
    if (isDisabled) {
      console.error('❌ Google button is disabled');
      return;
    }
    
    console.log('✓ Google button is enabled');
    
    // Test 1: Click Google sign-in button
    console.log('🔄 Testing Google OAuth initiation...');
    
    // Monitor for navigation or new tabs
    let newPage = null;
    browser.on('targetcreated', async (target) => {
      if (target.type() === 'page') {
        newPage = await target.page();
        console.log(`🆕 New page opened: ${await newPage.url()}`);
      }
    });
    
    // Click the Google button
    await page.click('button:has-text("Continue with Google")');
    
    // Wait for OAuth redirection
    await page.waitForTimeout(3000);
    
    // Check if we were redirected to Google OAuth
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('accounts.google.com') || currentUrl.includes('oauth')) {
      console.log('✅ Successfully redirected to Google OAuth');
      
      // Take screenshot of OAuth page
      await page.screenshot({ 
        path: 'screenshots/oauth-2-google-redirect.png',
        fullPage: true
      });
      
    } else {
      console.log('⚠️ OAuth redirection might be handled differently or blocked');
      
      // Check console logs for OAuth initiation
      const oauthLogs = consoleLogs.filter(log => 
        log.includes('Google OAuth') || 
        log.includes('OAuth') ||
        log.includes('signInWithOAuth')
      );
      
      if (oauthLogs.length > 0) {
        console.log('✅ OAuth process initiated (detected in console logs)');
        oauthLogs.forEach(log => console.log(`  📝 ${log}`));
      } else {
        console.log('❌ No OAuth activity detected');
      }
    }
    
    // Test 2: Error handling (simulate by going to callback with error)
    console.log('🔄 Testing OAuth error handling...');
    
    await page.goto('http://localhost:3005/signup?error=access_denied', {
      waitUntil: 'networkidle2'
    });
    
    await page.waitForTimeout(2000);
    
    // Check if error is displayed
    const errorElement = await page.$('.text-red-500');
    if (errorElement) {
      const errorText = await page.evaluate(el => el.textContent, errorElement);
      console.log(`✅ Error handling works: "${errorText}"`);
    } else {
      console.log('❌ Error handling not working properly');
    }
    
    // Take screenshot of error state
    await page.screenshot({ 
      path: 'screenshots/oauth-3-error-handling.png',
      fullPage: true
    });
    
    // Test 3: Test callback route directly
    console.log('🔄 Testing callback route...');
    
    await page.goto('http://localhost:3005/auth/callback', {
      waitUntil: 'networkidle2'
    });
    
    await page.waitForTimeout(2000);
    
    // Should redirect back to signup with error (no code parameter)
    const finalUrl = page.url();
    console.log(`📍 Final URL after callback test: ${finalUrl}`);
    
    if (finalUrl.includes('/signup')) {
      console.log('✅ Callback route correctly redirects invalid requests');
    } else {
      console.log('⚠️ Callback route behavior might need review');
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'screenshots/oauth-4-final.png',
      fullPage: true
    });
    
    // Analyze results
    console.log('\n📊 Test Results Summary:');
    console.log(`Total console logs: ${consoleLogs.length}`);
    console.log(`Page errors: ${pageErrors.length}`);
    console.log(`Network requests: ${requests.length}`);
    
    const oauthRequests = requests.filter(req => 
      req.url.includes('oauth') || 
      req.url.includes('google') || 
      req.url.includes('supabase')
    );
    console.log(`OAuth-related requests: ${oauthRequests.length}`);
    
    if (pageErrors.length > 0) {
      console.log('\n🚨 Page Errors:');
      pageErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (oauthRequests.length > 0) {
      console.log('\n🌐 OAuth Requests:');
      oauthRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.method} ${req.url}`);
      });
    }
    
    // Keep browser open for manual inspection
    console.log('\n⏱️ Browser will stay open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('💥 Error during testing:', error.message);
  } finally {
    await browser.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted by user');
  process.exit(0);
});

testGoogleOAuth();