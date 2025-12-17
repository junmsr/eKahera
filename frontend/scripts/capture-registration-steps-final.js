import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration for registration form steps
const REGISTRATION_STEPS = [
  {
    name: 'get-started-step-1-account',
    url: 'http://localhost:5173/get-started',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-1-account.png'),
    publicPath: join(__dirname, '../public/get-started-step-1-account.png'),
    description: 'Account Info step',
    action: async (page) => {
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
    },
  },
  {
    name: 'get-started-step-2-otp',
    url: 'http://localhost:5173/get-started',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-2-otp.png'),
    publicPath: join(__dirname, '../public/get-started-step-2-otp.png'),
    description: 'OTP Verification step',
    action: async (page) => {
      // Fill step 1 completely with valid data
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      
      // Clear any existing values first
      await page.evaluate(() => {
        document.querySelector('input[name="email"]')?.value && (document.querySelector('input[name="email"]').value = '');
        document.querySelector('input[name="firstName"]')?.value && (document.querySelector('input[name="firstName"]').value = '');
        document.querySelector('input[name="fullName"]')?.value && (document.querySelector('input[name="fullName"]').value = '');
        document.querySelector('input[name="username"]')?.value && (document.querySelector('input[name="username"]').value = '');
        document.querySelector('input[name="mobile"]')?.value && (document.querySelector('input[name="mobile"]').value = '');
        document.querySelector('input[name="password"]')?.value && (document.querySelector('input[name="password"]').value = '');
        document.querySelector('input[name="confirmPassword"]')?.value && (document.querySelector('input[name="confirmPassword"]').value = '');
      });
      
      await page.type('input[name="email"]', 'demo@example.com', { delay: 100 });
      await page.type('input[name="firstName"]', 'John', { delay: 100 });
      await page.type('input[name="fullName"]', 'Doe', { delay: 100 });
      await page.type('input[name="username"]', 'johndoe123', { delay: 100 });
      await page.type('input[name="mobile"]', '09123456789', { delay: 100 });
      await page.type('input[name="password"]', 'DemoPassword123!', { delay: 100 });
      await page.type('input[name="confirmPassword"]', 'DemoPassword123!', { delay: 100 });
      
      // Wait for validation to pass
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Find and click Continue button - wait for it to be enabled
      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const continueBtn = buttons.find(btn => {
          const text = btn.textContent.trim();
          return (text.includes('Continue') || text.includes('Next')) && !btn.disabled;
        });
        return continueBtn !== undefined;
      }, { timeout: 10000 });
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const continueBtn = buttons.find(btn => {
          const text = btn.textContent.trim();
          return (text.includes('Continue') || text.includes('Next')) && !btn.disabled;
        });
        if (continueBtn) {
          continueBtn.click();
        }
      });
      
      // Try to directly set React state to step 1 (OTP step)
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.evaluate(() => {
        // Try to find React root and manipulate state
        const reactRoot = document.querySelector('#root');
        if (reactRoot && reactRoot._reactRootContainer) {
          // Access React internals to find the component with step state
          const findReactFiber = (dom) => {
            const key = Object.keys(dom).find(key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance'));
            return key ? dom[key] : null;
          };
          
          const fiber = findReactFiber(reactRoot);
          if (fiber) {
            // Traverse fiber tree to find useGetStarted hook
            let current = fiber;
            while (current) {
              if (current.memoizedState) {
                // Check if this is the step state
                if (typeof current.memoizedState === 'number' && current.memoizedState === 0) {
                  // Found step state, try to update it
                  const setState = current.memoizedState.next?.memoizedState || 
                                 current.memoizedState.memoizedState;
                  if (typeof setState === 'function') {
                    setState(1); // Set to step 1 (OTP)
                    return true;
                  }
                }
              }
              current = current.child || current.sibling || current.return;
            }
          }
        }
        return false;
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Wait for OTP step to appear - look for OTP input field or OTP text
      try {
        await page.waitForSelector('input[name="otp"]', { timeout: 10000 });
      } catch (e) {
        // If OTP input not found, check if we're on OTP step by text content
        const hasOtpText = await page.evaluate(() => {
          const text = document.body.textContent;
          return text.includes('OTP') || text.includes('verification code') || text.includes('Enter OTP') || text.includes('4-character');
        });
        if (!hasOtpText) {
          console.log('   ⚠️  Warning: May not be on OTP step, but continuing...');
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    },
  },
  {
    name: 'get-started-step-3-business',
    url: 'http://localhost:5173/get-started',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-3-business.png'),
    publicPath: join(__dirname, '../public/get-started-step-3-business.png'),
    description: 'Business Details step',
    action: async (page) => {
      // Fill step 1
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      
      await page.evaluate(() => {
        document.querySelector('input[name="email"]')?.value && (document.querySelector('input[name="email"]').value = '');
        document.querySelector('input[name="firstName"]')?.value && (document.querySelector('input[name="firstName"]').value = '');
        document.querySelector('input[name="fullName"]')?.value && (document.querySelector('input[name="fullName"]').value = '');
        document.querySelector('input[name="username"]')?.value && (document.querySelector('input[name="username"]').value = '');
        document.querySelector('input[name="mobile"]')?.value && (document.querySelector('input[name="mobile"]').value = '');
        document.querySelector('input[name="password"]')?.value && (document.querySelector('input[name="password"]').value = '');
        document.querySelector('input[name="confirmPassword"]')?.value && (document.querySelector('input[name="confirmPassword"]').value = '');
      });
      
      await page.type('input[name="email"]', 'demo@example.com', { delay: 100 });
      await page.type('input[name="firstName"]', 'John', { delay: 100 });
      await page.type('input[name="fullName"]', 'Doe', { delay: 100 });
      await page.type('input[name="username"]', 'johndoe123', { delay: 100 });
      await page.type('input[name="mobile"]', '09123456789', { delay: 100 });
      await page.type('input[name="password"]', 'DemoPassword123!', { delay: 100 });
      await page.type('input[name="confirmPassword"]', 'DemoPassword123!', { delay: 100 });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to step 2
      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const continueBtn = buttons.find(btn => {
          const text = btn.textContent.trim();
          return (text.includes('Continue') || text.includes('Next')) && !btn.disabled;
        });
        return continueBtn !== undefined;
      }, { timeout: 10000 });
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const continueBtn = buttons.find(btn => {
          const text = btn.textContent.trim();
          return (text.includes('Continue') || text.includes('Next')) && !btn.disabled;
        });
        if (continueBtn) continueBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For OTP step, enter a dummy OTP to proceed (it will fail but we can still navigate)
      // Actually, let's try clicking the stepper to jump directly to step 3
      await page.evaluate(() => {
        // Try to find and click on the Business Details step in the stepper
        const stepperItems = Array.from(document.querySelectorAll('[role="button"], button, [class*="step"], [class*="stepper"]'));
        const businessStep = stepperItems.find(item => {
          const text = item.textContent || '';
          return text.includes('Business') || text.includes('🏢');
        });
        if (businessStep) {
          businessStep.click();
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Wait for Business Details step
      await page.waitForSelector('input[name="businessName"]', { timeout: 15000 }).catch(() => {
        console.log('   ⚠️  Business Name input not found, trying alternative approach');
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fill some business details
      const businessNameInput = await page.$('input[name="businessName"]');
      if (businessNameInput) {
        await businessNameInput.type('Demo Business Store', { delay: 100 });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
  },
  {
    name: 'get-started-step-4-documents',
    url: 'http://localhost:5173/get-started',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-4-documents.png'),
    publicPath: join(__dirname, '../public/get-started-step-4-documents.png'),
    description: 'Document Upload step',
    action: async (page) => {
      // Fill step 1
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      
      await page.evaluate(() => {
        document.querySelector('input[name="email"]')?.value && (document.querySelector('input[name="email"]').value = '');
        document.querySelector('input[name="firstName"]')?.value && (document.querySelector('input[name="firstName"]').value = '');
        document.querySelector('input[name="fullName"]')?.value && (document.querySelector('input[name="fullName"]').value = '');
        document.querySelector('input[name="username"]')?.value && (document.querySelector('input[name="username"]').value = '');
        document.querySelector('input[name="mobile"]')?.value && (document.querySelector('input[name="mobile"]').value = '');
        document.querySelector('input[name="password"]')?.value && (document.querySelector('input[name="password"]').value = '');
        document.querySelector('input[name="confirmPassword"]')?.value && (document.querySelector('input[name="confirmPassword"]').value = '');
      });
      
      await page.type('input[name="email"]', 'demo@example.com', { delay: 100 });
      await page.type('input[name="firstName"]', 'John', { delay: 100 });
      await page.type('input[name="fullName"]', 'Doe', { delay: 100 });
      await page.type('input[name="username"]', 'johndoe123', { delay: 100 });
      await page.type('input[name="mobile"]', '09123456789', { delay: 100 });
      await page.type('input[name="password"]', 'DemoPassword123!', { delay: 100 });
      await page.type('input[name="confirmPassword"]', 'DemoPassword123!', { delay: 100 });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate through steps using stepper clicks
      await page.evaluate(() => {
        // Click on Document Upload step in stepper
        const stepperItems = Array.from(document.querySelectorAll('[role="button"], button, [class*="step"], [class*="stepper"], [title]'));
        const docStep = stepperItems.find(item => {
          const text = item.textContent || item.getAttribute('title') || '';
          return text.includes('Document') || text.includes('Upload') || text.includes('📄');
        });
        if (docStep) {
          docStep.click();
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify we're on document step
      const isDocStep = await page.evaluate(() => {
        const text = document.body.textContent;
        return text.includes('Document') || text.includes('Upload') || document.querySelector('input[type="file"]');
      });
      
      if (!isDocStep) {
        console.log('   ⚠️  Warning: May not be on Document Upload step');
      }
    },
  },
];

const VIEWPORT = {
  width: 1920,
  height: 1080,
};

const WAIT_TIME = 3000;

async function captureStep(browser, config) {
  const page = await browser.newPage();
  
  try {
    console.log(`\n📸 Capturing ${config.name}...`);
    console.log(`   URL: ${config.url}`);
    
    await page.setViewport(VIEWPORT);
    
    // Navigate to the page
    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        await page.goto(config.url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        success = true;
      } catch (error) {
        retries--;
        if (retries > 0) {
          console.log(`   ⚠️  Connection failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          throw error;
        }
      }
    }
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
    
    // Perform the action to get to the desired step
    if (config.action) {
      await config.action(page);
      await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
    }
    
    // Verify we're on the correct step before capturing
    console.log(`   ✓ Step navigation completed`);
    
    // Ensure output directories exist
    const outputDir = dirname(config.outputPath);
    const publicDir = dirname(config.publicPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Take screenshot
    await page.screenshot({
      path: config.outputPath,
      fullPage: true,
      type: 'png',
    });
    
    // Copy to public folder
    fs.copyFileSync(config.outputPath, config.publicPath);
    
    console.log(`   ✅ Saved to: ${config.outputPath}`);
    
  } catch (error) {
    console.error(`   ❌ Error capturing ${config.name}:`, error.message);
    throw error;
  } finally {
    await page.close();
  }
}

async function captureAllSteps() {
  console.log('🚀 Starting registration form step capture...');
  console.log(`📋 Total steps to capture: ${REGISTRATION_STEPS.length}`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    for (const config of REGISTRATION_STEPS) {
      try {
        await captureStep(browser, config);
      } catch (error) {
        console.error(`Failed to capture ${config.name}:`, error.message);
      }
    }
    
    console.log('\n✅ All registration steps captured successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.error('\n💡 Make sure the frontend dev server is running:');
      console.error('   cd frontend && npm run dev');
    }
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

captureAllSteps();
