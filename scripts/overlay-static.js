// Copies static-overlay/ over dist/ after the Vite build.
// The pages in static-overlay/ are prebuilt (new homepage and EARSHOT page) and
// replace the Vite-built files of the same name. Their assets live in
// assets/{css,js,img,media,fonts,brand,og}, which do not collide with Vite's hashed files.
import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve('static-overlay');
const dst = path.resolve('dist');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(src)) {
  console.log('overlay-static: no static-overlay directory, nothing to do');
} else {
  copyDir(src, dst);
  console.log('overlay-static: copied static-overlay into dist');
}
