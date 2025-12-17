import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration for all screenshots to capture
const SCREENSHOTS = [
  {
    name: 'get-started',
    url: 'http://localhost:5173/get-started',
    outputPath: join(__dirname, '../../docs/assets/get-started-screenshot.png'),
    publicPath: join(__dirname, '../public/get-started-screenshot.png'),
    waitSelector: 'body',
    description: 'Get Started registration page',
  },
  {
    name: 'pos',
    url: 'http://localhost:5173/demo/pos',
    outputPath: join(__dirname, '../../docs/assets/pos-screenshot.png'),
    publicPath: join(__dirname, '../public/pos-screenshot.png'),
    waitSelector: '.bg-white',
    description: 'Point of Sale interface',
  },
  {
    name: 'inventory',
    url: 'http://localhost:5173/demo/inventory',
    outputPath: join(__dirname, '../../docs/assets/inventory-screenshot.png'),
    publicPath: join(__dirname, '../public/inventory-screenshot.png'),
    waitSelector: '.bg-white',
    description: 'Inventory Management interface',
  },
  {
    name: 'cashiers',
    url: 'http://localhost:5173/demo/cashiers',
    outputPath: join(__dirname, '../../docs/assets/cashiers-screenshot.png'),
    publicPath: join(__dirname, '../public/cashiers-screenshot.png'),
    waitSelector: '.bg-white',
    description: 'Cashier Management interface',
  },
  {
    name: 'mobile-scanner',
    url: 'http://localhost:5173/mobile-scanner',
    outputPath: join(__dirname, '../../docs/assets/mobile-scanner-screenshot.png'),
    publicPath: join(__dirname, '../public/mobile-scanner-screenshot.png'),
    waitSelector: 'body',
    description: 'Mobile Scanner interface',
  },
];

const VIEWPORT = {
  width: 1920,
  height: 1080,
};

const WAIT_TIME = 5000; // Wait 5 seconds for page to fully load

async function captureScreenshot(browser, config) {
  const page = await browser.newPage();
  
  try {
    console.log(`\n📸 Capturing ${config.name}...`);
    console.log(`   URL: ${config.url}`);
    
    // Set viewport
    await page.setViewport(VIEWPORT);
    
    // Navigate to the page with retry logic
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
    
    // Wait for additional time to ensure all content is loaded
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
    
    // Wait for key elements to be visible
    if (config.waitSelector) {
      try {
        await page.waitForSelector(config.waitSelector, { timeout: 10000 });
      } catch (e) {
        console.log(`   ⚠️  Selector ${config.waitSelector} not found, proceeding anyway...`);
      }
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
    console.log(`   ✅ Copied to: ${config.publicPath}`);
    
  } catch (error) {
    console.error(`   ❌ Error capturing ${config.name}:`, error.message);
    throw error;
  } finally {
    await page.close();
  }
}

async function captureAllScreenshots() {
  console.log('🚀 Starting comprehensive screenshot capture...');
  console.log(`📋 Total screenshots to capture: ${SCREENSHOTS.length}`);
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    // Capture each screenshot
    for (const config of SCREENSHOTS) {
      try {
        await captureScreenshot(browser, config);
      } catch (error) {
        console.error(`Failed to capture ${config.name}:`, error.message);
        // Continue with other screenshots even if one fails
      }
    }
    
    console.log('\n✅ All screenshots captured successfully!');
    
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

captureAllScreenshots();
