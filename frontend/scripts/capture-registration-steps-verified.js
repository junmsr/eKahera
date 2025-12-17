import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to verify we're on the correct step
async function verifyStep(page, stepNumber, stepName) {
  const checks = {
    0: () => page.evaluate(() => {
      return document.querySelector('input[name="email"]') !== null &&
             document.querySelector('input[name="firstName"]') !== null;
    }),
    1: () => page.evaluate(() => {
      const text = document.body.textContent;
      return (text.includes('OTP') || text.includes('verification code') || 
              text.includes('Enter OTP') || text.includes('4-character')) &&
             document.querySelector('input[name="otp"]') !== null;
    }),
    2: () => page.evaluate(() => {
      return document.querySelector('input[name="businessName"]') !== null;
    }),
    3: () => page.evaluate(() => {
      const text = document.body.textContent;
      return (text.includes('Document') || text.includes('Upload') || 
              text.includes('Business Documents')) &&
             (document.querySelector('input[type="file"]') !== null ||
              document.querySelector('[class*="upload"]') !== null);
    }),
  };
  
  const check = checks[stepNumber];
  if (check) {
    const result = await check();
    if (!result) {
      console.log(`   ⚠️  Warning: Verification failed for ${stepName}`);
      return false;
    }
    return true;
  }
  return true;
}

// Configuration for registration form steps
const REGISTRATION_STEPS = [
  {
    name: 'get-started-step-1-account',
    stepNumber: 0,
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
    stepNumber: 1,
    url: 'http://localhost:5173/get-started?step=1',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-2-otp.png'),
    publicPath: join(__dirname, '../public/get-started-step-2-otp.png'),
    description: 'OTP Verification step',
    action: async (page) => {
      // Since we're using URL parameter, just wait for OTP step to load
      await page.waitForSelector('input[name="otp"]', { timeout: 15000 }).catch(async () => {
        // If OTP input not found, check if we're on OTP step by text
        const hasOtpText = await page.evaluate(() => {
          return document.body.textContent.includes('OTP') || 
                 document.body.textContent.includes('verification code') ||
                 document.body.textContent.includes('4-character');
        });
        if (!hasOtpText) {
          console.log('   ⚠️  OTP step may not be loaded correctly');
        }
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    },
  },
  {
    name: 'get-started-step-3-business',
    stepNumber: 2,
    url: 'http://localhost:5173/get-started?step=2',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-3-business.png'),
    publicPath: join(__dirname, '../public/get-started-step-3-business.png'),
    description: 'Business Details step',
    action: async (page) => {
      // Since we're using URL parameter, just wait for Business Details step to load
      await page.waitForSelector('input[name="businessName"]', { timeout: 15000 }).catch(async () => {
        const hasBusinessText = await page.evaluate(() => {
          return document.body.textContent.includes('Business Details') ||
                 document.body.textContent.includes('Business Name');
        });
        if (!hasBusinessText) {
          console.log('   ⚠️  Business Details step may not be loaded correctly');
        }
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    },
  },
  {
    name: 'get-started-step-4-documents',
    stepNumber: 3,
    url: 'http://localhost:5173/get-started?step=3',
    outputPath: join(__dirname, '../../docs/assets/get-started-step-4-documents.png'),
    publicPath: join(__dirname, '../public/get-started-step-4-documents.png'),
    description: 'Document Upload step',
    action: async (page) => {
      // Since we're using URL parameter, just wait for Document Upload step to load
      await page.waitForSelector('input[type="file"]', { timeout: 15000 }).catch(async () => {
        const hasDocText = await page.evaluate(() => {
          return document.body.textContent.includes('Document') ||
                 document.body.textContent.includes('Upload') ||
                 document.body.textContent.includes('Business Documents');
        });
        if (!hasDocText) {
          console.log('   ⚠️  Document Upload step may not be loaded correctly');
        }
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
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
    
    // Verify we're on the correct step
    const verified = await verifyStep(page, config.stepNumber, config.name);
    if (verified) {
      console.log(`   ✓ Verified on correct step`);
    } else {
      console.log(`   ⚠️  Step verification failed, but continuing...`);
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

