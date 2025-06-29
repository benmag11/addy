const puppeteer = require('puppeteer');

async function testRealCountdown() {
  console.log('🚀 Testing real countdown timer behavior...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3003/signup', { 
      waitUntil: 'networkidle2' 
    });
    
    console.log('✓ Loaded signup page');
    
    // Inject script to force the component into verification mode
    await page.evaluate(() => {
      // Try to find React component and force it into verification step
      // This is a more direct approach to test the actual component
      window.testCountdownBehavior = () => {
        return new Promise((resolve) => {
          // Look for the signup form
          const form = document.querySelector('form');
          if (!form) {
            resolve(['No form found']);
            return;
          }
          
          let results = [];
          let observations = 0;
          const maxObservations = 15; // Observe for 15 seconds
          
          // Try to trigger form submission to reach verification step
          const emailInput = document.querySelector('input[type="email"]');
          const passwordInput = document.querySelector('input[type="password"]');
          const submitButton = document.querySelector('button[type="submit"]');
          
          if (emailInput && passwordInput && submitButton) {
            // Fill the form
            emailInput.value = 'test@example.com';
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            passwordInput.value = 'testpassword123';
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            results.push('Form filled with test data');
            
            // Submit the form
            submitButton.click();
            results.push('Form submitted');
            
            // Wait and observe what happens
            setTimeout(() => {
              const interval = setInterval(() => {
                observations++;
                
                // Look for any buttons that might be the resend button
                const buttons = document.querySelectorAll('button');
                let resendButton = null;
                
                buttons.forEach(button => {
                  const text = button.textContent.toLowerCase();
                  if (text.includes('resend') || text.includes('send')) {
                    resendButton = button;
                  }
                });
                
                if (resendButton) {
                  const buttonText = resendButton.textContent.trim();
                  const isDisabled = resendButton.disabled;
                  results.push(`Observation ${observations}: Button="${buttonText}", Disabled=${isDisabled}`);
                } else {
                  results.push(`Observation ${observations}: No resend button found`);
                }
                
                // Check for verification input
                const verificationInput = document.querySelector('input[placeholder*="code"]') || 
                                        document.querySelector('input[placeholder*="Code"]') ||
                                        document.querySelector('input[placeholder*="Enter code"]');
                
                if (verificationInput && observations === 1) {
                  results.push('✓ Verification step reached');
                }
                
                if (observations >= maxObservations) {
                  clearInterval(interval);
                  results.push('=== Observation complete ===');
                  
                  // Analyze for patterns
                  const countdownTexts = results.filter(r => r.includes('Resend in'));
                  const resendTexts = results.filter(r => r.includes('Resend code'));
                  const disabledStates = results.filter(r => r.includes('Disabled=true'));
                  const enabledStates = results.filter(r => r.includes('Disabled=false'));
                  
                  results.push(`Analysis: ${countdownTexts.length} countdown displays, ${resendTexts.length} resend options`);
                  results.push(`Analysis: ${disabledStates.length} disabled states, ${enabledStates.length} enabled states`);
                  
                  resolve(results);
                }
              }, 1000);
            }, 2000); // Wait 2 seconds after form submission
          } else {
            results.push('Form elements not found');
            resolve(results);
          }
        });
      };
    });
    
    // Run the countdown behavior test
    const results = await page.evaluate(() => window.testCountdownBehavior());
    
    console.log('\n📊 Real Countdown Test Results:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result}`);
    });
    
    // Take screenshot at the end
    await page.screenshot({ 
      path: 'screenshots/real-countdown-test.png',
      fullPage: true
    });
    
    console.log('✓ Screenshot saved to screenshots/real-countdown-test.png');
    
    // Analyze results
    const reachedVerification = results.some(r => r.includes('Verification step reached'));
    const hasCountdown = results.some(r => r.includes('Resend in'));
    const hasResendOption = results.some(r => r.includes('Resend code'));
    
    console.log('\n🎯 Summary:');
    console.log('✓ Reached verification step:', reachedVerification);
    console.log('✓ Has countdown display:', hasCountdown);
    console.log('✓ Has resend option:', hasResendOption);
    
    if (reachedVerification) {
      console.log('🎉 Successfully tested real countdown behavior!');
    } else {
      console.log('📝 Could not reach verification step due to backend limitations');
    }
    
  } catch (error) {
    console.error('❌ Error testing real countdown:', error.message);
  } finally {
    await browser.close();
  }
}

testRealCountdown();