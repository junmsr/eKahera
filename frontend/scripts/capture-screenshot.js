import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCREENSHOT_CONFIG = {
  url: 'http://localhost:5173/demo/dashboard',
  outputPath: join(__dirname, '../../docs/assets/dashboard-screenshot.png'),
  viewport: {
    width: 1920,
    height: 1080,
  },
  waitTime: 5000, // Wait 5 seconds for page to fully load
  fullPage: true,
};

async function captureScreenshot() {
  console.log('Starting screenshot capture...');
  console.log(`Target URL: ${SCREENSHOT_CONFIG.url}`);
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport(SCREENSHOT_CONFIG.viewport);
    
    // Navigate to the page with retry logic
    console.log('Navigating to dashboard...');
    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        await page.goto(SCREENSHOT_CONFIG.url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        success = true;
      } catch (error) {
        retries--;
        if (retries > 0) {
          console.log(`Connection failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          throw error;
        }
      }
    }

    // Wait for additional time to ensure all content is loaded
    console.log('Waiting for page to fully render...');
    await new Promise(resolve => setTimeout(resolve, SCREENSHOT_CONFIG.waitTime));

    // Wait for key elements to be visible (charts, stats cards, etc.)
    try {
      await page.waitForSelector('.bg-white', { timeout: 10000 });
    } catch (e) {
      console.log('Some elements may not be visible, proceeding anyway...');
    }

    // Ensure output directory exists
    const outputDir = dirname(SCREENSHOT_CONFIG.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Take screenshot
    console.log('Capturing screenshot...');
    await page.screenshot({
      path: SCREENSHOT_CONFIG.outputPath,
      fullPage: SCREENSHOT_CONFIG.fullPage,
      type: 'png',
    });

    console.log(`✅ Screenshot saved to: ${SCREENSHOT_CONFIG.outputPath}`);
    
  } catch (error) {
    console.error('❌ Error capturing screenshot:', error.message);
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

captureScreenshot();

