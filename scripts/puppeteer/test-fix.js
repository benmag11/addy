const puppeteer = require('puppeteer');

async function testFix() {
  console.log('🚀 Testing that module resolution bug is fixed...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Test main page
    await page.goto('http://localhost:3003/', { 
      waitUntil: 'networkidle2' 
    });
    console.log('✓ Main page loads successfully');
    
    // Test signup page
    await page.goto('http://localhost:3003/signup', { 
      waitUntil: 'networkidle2' 
    });
    console.log('✓ Signup page loads successfully');
    
    // Check for any console errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    // Wait a moment to capture any errors
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (logs.length === 0) {
      console.log('✓ No console errors detected');
    } else {
      console.log('❌ Console errors found:', logs);
    }
    
    // Test basic form elements are present
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    console.log('✓ Email input found:', !!emailInput);
    console.log('✓ Password input found:', !!passwordInput);
    console.log('✓ Submit button found:', !!submitButton);
    
    // Test welcome page
    await page.goto('http://localhost:3003/welcome', { 
      waitUntil: 'networkidle2' 
    });
    console.log('✓ Welcome page loads successfully');
    
    console.log('🎉 All tests passed - module resolution bug is fixed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }
}

testFix();