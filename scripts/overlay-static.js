// Builds dist/ from static-overlay/, which holds the complete prebuilt site.
// The old Vite build is no longer part of the deploy (kept as `npm run build:legacy`).
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

fs.rmSync(dst, { recursive: true, force: true });
if (!fs.existsSync(src)) {
  console.log('overlay-static: no static-overlay directory, nothing to do');
} else {
  copyDir(src, dst);
  console.log('overlay-static: copied static-overlay into dist');
}
