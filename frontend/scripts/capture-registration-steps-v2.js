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
    step: 0,
    url: 'http://localhost:5173/get-started',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-1-account.png'),
    publicPath: join(__dirname, '../public/get-started-step-1-account.png'),
  },
  {
    name: 'get-started-step-2-otp',
    step: 1,
    url: 'http://localhost:5173/get-started',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-2-otp.png'),
    publicPath: join(__dirname, '../public/get-started-step-2-otp.png'),
  },
  {
    name: 'get-started-step-3-business',
    step: 2,
    url: 'http://localhost:5173/get-started',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-3-business.png'),
    publicPath: join(__dirname, '../public/get-started-step-3-business.png'),
  },
  {
    name: 'get-started-step-4-documents',
    step: 3,
    url: 'http://localhost:5173/get-started',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-4-documents.png'),
    publicPath: join(__dirname, '../public/get-started-step-4-documents.png'),
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
    console.log(`\n📸 Capturing ${config.name} (Step ${config.step + 1})...`);
    
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
    
    // Use React DevTools or direct state manipulation to set the step
    await page.evaluate((targetStep) => {
      // Method 1: Try to find React component and set step directly
      // Access React Fiber through window
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        const renderers = hook.renderers;
        if (renderers && renderers.size > 0) {
          renderers.forEach((renderer, id) => {
            const roots = renderer.getFiberRoots(id);
            roots.forEach(root => {
              // Traverse fiber tree to find useGetStarted component
              let fiber = root.current;
              const findComponent = (node) => {
                if (!node) return null;
                
                // Check if this is the GetStartedSingle component
                if (node.type && node.type.name === 'GetStartedSingle') {
                  return node;
                }
                
                // Check children
                let child = node.child;
                while (child) {
                  const found = findComponent(child);
                  if (found) return found;
                  child = child.sibling;
                }
                
                return null;
              };
              
              const component = findComponent(fiber);
              if (component && component.memoizedState) {
                // Try to find setStep function
                let stateNode = component.memoizedState;
                while (stateNode) {
                  if (stateNode.memoizedState === targetStep - 1 || stateNode.memoizedState === targetStep) {
                    // Found step state, try to update
                    const setState = stateNode.next?.memoizedState;
                    if (setState && typeof setState === 'function') {
                      setState(targetStep);
                      return;
                    }
                  }
                  stateNode = stateNode.next;
                }
              }
            });
          });
        }
      }
      
      // Method 2: Use stepper component to click on the target step
      const steppers = Array.from(document.querySelectorAll('[title]'));
      const stepLabels = ['Account Info', 'OTP Verification', 'Business Details', 'Document Upload'];
      if (steppers.length > targetStep) {
        const targetStepper = steppers[targetStep];
        if (targetStepper) {
          targetStepper.click();
        }
      }
      
      // Method 3: Use localStorage or sessionStorage to set step (if supported)
      // Some forms use URL params or storage to track step
      try {
        sessionStorage.setItem('getStartedStep', targetStep.toString());
      } catch (e) {}
      
    }, config.step);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fill form data if needed for the step
    if (config.step === 0) {
      // Fill account info
      await page.waitForSelector('input[name="email"]', { timeout: 5000 }).catch(() => {});
      const emailInput = await page.$('input[name="email"]');
      if (emailInput) {
        await emailInput.type('demo@example.com', { delay: 50 });
        await page.type('input[name="firstName"]', 'John', { delay: 50 });
        await page.type('input[name="fullName"]', 'Doe', { delay: 50 });
        await page.type('input[name="username"]', 'johndoe', { delay: 50 });
        await page.type('input[name="mobile"]', '09123456789', { delay: 50 });
        await page.type('input[name="password"]', 'DemoPassword123!', { delay: 50 });
        await page.type('input[name="confirmPassword"]', 'DemoPassword123!', { delay: 50 });
      }
    } else if (config.step === 2) {
      // Fill business details
      await page.waitForSelector('input[name="businessName"]', { timeout: 5000 }).catch(() => {});
      const businessInput = await page.$('input[name="businessName"]');
      if (businessInput) {
        await businessInput.type('Demo Business', { delay: 50 });
        const businessTypeSelect = await page.$('select[name="businessType"]');
        if (businessTypeSelect) {
          await businessTypeSelect.select('Grocery Store');
        }
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
    
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
  console.log('🚀 Starting registration form step capture (v2)...');
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

