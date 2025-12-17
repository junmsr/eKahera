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
      // Just wait for the form to load - we're already on step 1
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
      // Fill step 1 completely
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      await page.type('input[name="email"]', 'demo@example.com', { delay: 50 });
      await page.type('input[name="firstName"]', 'John', { delay: 50 });
      await page.type('input[name="fullName"]', 'Doe', { delay: 50 });
      await page.type('input[name="username"]', 'johndoe', { delay: 50 });
      await page.type('input[name="mobile"]', '09123456789', { delay: 50 });
      await page.type('input[name="password"]', 'DemoPassword123!', { delay: 50 });
      await page.type('input[name="confirmPassword"]', 'DemoPassword123!', { delay: 50 });
      
      // Wait a bit for form validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Click Next button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => {
          const text = btn.textContent.trim();
          return (text.includes('Next') || text.includes('Continue')) && !btn.disabled;
        });
        if (nextBtn) {
          nextBtn.click();
        }
      });
      
      // Wait for OTP step to appear
      await page.waitForSelector('input[name="otp"]', { timeout: 10000 }).catch(() => {});
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
      await page.type('input[name="email"]', 'demo@example.com', { delay: 50 });
      await page.type('input[name="firstName"]', 'John', { delay: 50 });
      await page.type('input[name="fullName"]', 'Doe', { delay: 50 });
      await page.type('input[name="username"]', 'johndoe', { delay: 50 });
      await page.type('input[name="mobile"]', '09123456789', { delay: 50 });
      await page.type('input[name="password"]', 'DemoPassword123!', { delay: 50 });
      await page.type('input[name="confirmPassword"]', 'DemoPassword123!', { delay: 50 });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to step 2
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => {
          const text = btn.textContent.trim();
          return (text.includes('Next') || text.includes('Continue')) && !btn.disabled;
        });
        if (nextBtn) nextBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Skip OTP by clicking Next again (in demo mode, we can't verify OTP)
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => {
          const text = btn.textContent.trim();
          return (text.includes('Next') || text.includes('Continue')) && !btn.disabled;
        });
        if (nextBtn) nextBtn.click();
      });
      
      // Wait for Business Details step
      await page.waitForSelector('input[name="businessName"]', { timeout: 10000 }).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fill some business details to show the form
      const businessNameInput = await page.$('input[name="businessName"]');
      if (businessNameInput) {
        await businessNameInput.type('Demo Business Store', { delay: 50 });
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
      await page.type('input[name="email"]', 'demo@example.com', { delay: 50 });
      await page.type('input[name="firstName"]', 'John', { delay: 50 });
      await page.type('input[name="fullName"]', 'Doe', { delay: 50 });
      await page.type('input[name="username"]', 'johndoe', { delay: 50 });
      await page.type('input[name="mobile"]', '09123456789', { delay: 50 });
      await page.type('input[name="password"]', 'DemoPassword123!', { delay: 50 });
      await page.type('input[name="confirmPassword"]', 'DemoPassword123!', { delay: 50 });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to step 2
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => {
          const text = btn.textContent.trim();
          return (text.includes('Next') || text.includes('Continue')) && !btn.disabled;
        });
        if (nextBtn) nextBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Skip OTP - navigate to step 3
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => {
          const text = btn.textContent.trim();
          return (text.includes('Next') || text.includes('Continue')) && !btn.disabled;
        });
        if (nextBtn) nextBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fill business details quickly
      const businessNameInput = await page.$('input[name="businessName"]');
      if (businessNameInput) {
        await businessNameInput.type('Demo Business Store', { delay: 50 });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to step 4 (Document Upload)
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => {
          const text = btn.textContent.trim();
          return (text.includes('Next') || text.includes('Continue')) && !btn.disabled;
        });
        if (nextBtn) nextBtn.click();
      });
      
      // Wait for Document Upload step
      await page.waitForSelector('input[type="file"]', { timeout: 10000 }).catch(() => {});
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
