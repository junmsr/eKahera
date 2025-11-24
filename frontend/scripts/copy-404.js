import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsIndex = path.resolve(__dirname, '..', '..', 'docs', 'index.html');
const distIndex = path.resolve(__dirname, '..', 'dist', 'index.html');
const outDocsDir = path.resolve(__dirname, '..', '..', 'docs');
const out404 = path.resolve(outDocsDir, '404.html');

function copy(src, dest) {
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} -> ${dest}`);
    process.exit(0);
  } catch (err) {
    console.error(`Failed to copy ${src} -> ${dest}:`, err);
    process.exit(1);
  }
}

if (fs.existsSync(docsIndex)) {
  copy(docsIndex, out404);
} else if (fs.existsSync(distIndex)) {
  // If build produced a local dist, copy its index to the repo docs folder
  const destIndex = path.resolve(outDocsDir, 'index.html');
  try {
    fs.mkdirSync(outDocsDir, { recursive: true });
    fs.copyFileSync(distIndex, destIndex);
    console.log(`Copied ${distIndex} -> ${destIndex}`);
    copy(destIndex, out404);
  } catch (err) {
    console.error('Failed copying from dist to docs:', err);
    process.exit(1);
  }
} else {
  console.error('No source index.html found. Expected either:', docsIndex, 'or', distIndex);
  process.exit(1);
}
