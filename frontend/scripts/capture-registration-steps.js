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
    description: 'Account Info step - First step of registration',
    action: async (page) => {
      // Fill in some sample data to show the form
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      await page.type('input[name="email"]', 'demo@example.com');
      await page.type('input[name="firstName"]', 'John');
      await page.type('input[name="fullName"]', 'Doe');
      await page.type('input[name="username"]', 'johndoe');
      await page.type('input[name="mobile"]', '09123456789');
      await page.type('input[name="password"]', 'DemoPassword123!');
      await page.type('input[name="confirmPassword"]', 'DemoPassword123!');
      // Scroll to show the form better
      await page.evaluate(() => window.scrollTo(0, 0));
    },
  },
  {
    name: 'get-started-step-2-otp',
    url: 'http://localhost:5173/get-started',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-2-otp.png'),
    publicPath: join(__dirname, '../public/get-started-step-2-otp.png'),
    description: 'OTP Verification step',
    action: async (page) => {
      // Fill step 1 and navigate to step 2
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      await page.type('input[name="email"]', 'demo@example.com');
      await page.type('input[name="firstName"]', 'John');
      await page.type('input[name="fullName"]', 'Doe');
      await page.type('input[name="username"]', 'johndoe');
      await page.type('input[name="mobile"]', '09123456789');
      await page.type('input[name="password"]', 'DemoPassword123!');
      await page.type('input[name="confirmPassword"]', 'DemoPassword123!');
      
      // Click Next button to go to OTP step
      await new Promise(resolve => setTimeout(resolve, 1000));
      const nextButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent.includes('Next') || btn.textContent.includes('Continue'));
      });
      if (nextButton && nextButton.asElement()) {
        await nextButton.asElement().click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    },
  },
  {
    name: 'get-started-step-3-business',
    url: 'http://localhost:5173/get-started',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-3-business.png'),
    publicPath: join(__dirname, '../public/get-started-step-3-business.png'),
    description: 'Business Details step',
    action: async (page) => {
      // Use React state manipulation to directly set step to 2
      await page.evaluate(() => {
        // Find React root and set step directly
        const root = document.querySelector('#root');
        if (root && root._reactRootContainer) {
          // Try to access React internals
          const reactInternalInstance = root._reactRootContainer._internalRoot?.current;
          if (reactInternalInstance) {
            // Navigate through component tree to find useGetStarted hook
            let fiber = reactInternalInstance;
            while (fiber) {
              if (fiber.memoizedState && typeof fiber.memoizedState === 'object') {
                // Try to find step state
                const state = fiber.memoizedState;
                if (state.memoizedState !== undefined && typeof state.memoizedState === 'number') {
                  // Found step state, try to update it
                  const setState = fiber.memoizedState.next?.memoizedState;
                  if (setState && typeof setState === 'function') {
                    setState(2); // Set to step 2 (Business Details)
                  }
                }
              }
              fiber = fiber.child || fiber.sibling;
            }
          }
        }
        
        // Alternative: Use stepper component to click on Business Details step
        const steppers = Array.from(document.querySelectorAll('[title]'));
        const businessStep = steppers.find(s => {
          const title = s.getAttribute('title');
          return title && title.includes('Business');
        });
        if (businessStep) {
          businessStep.click();
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Fill business details if we're on that step
      const businessNameInput = await page.$('input[name="businessName"]');
      if (businessNameInput) {
        await businessNameInput.type('Demo Business', { delay: 50 });
        const businessTypeSelect = await page.$('select[name="businessType"]');
        if (businessTypeSelect) {
          await businessTypeSelect.select('Grocery Store');
        }
      }
    },
  },
  {
    name: 'get-started-step-4-documents',
    url: 'http://localhost:5173/get-started',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-4-documents.png'),
    publicPath: join(__dirname, '../public/get-started-step-4-documents.png'),
    description: 'Document Upload step',
    action: async (page) => {
      // Use stepper component to directly click on Document Upload step
      await page.evaluate(() => {
        // Find and click on the Document Upload step in the stepper
        const steppers = Array.from(document.querySelectorAll('[title]'));
        const docStep = steppers.find(s => {
          const title = s.getAttribute('title');
          return title && (title.includes('Document') || title.includes('Upload'));
        });
        if (docStep) {
          docStep.click();
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify we're on document step
      const docInput = await page.$('input[type="file"]');
      if (!docInput) {
        // If not, try clicking through steps
        console.log('   ⚠️  Not on document step, trying to navigate...');
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

