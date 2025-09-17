import { resolve } from 'path';
import { defineConfig } from 'vite';

const rootDir = process.cwd();

export default defineConfig({
  root: rootDir,
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        vantage: resolve(rootDir, 'vantage.html'),
        technology: resolve(rootDir, 'technology.html'),
        company: resolve(rootDir, 'company.html'),
        ip: resolve(rootDir, 'ip.html'),
        careers: resolve(rootDir, 'careers.html'),
        contact: resolve(rootDir, 'contact.html'),
        privacy: resolve(rootDir, 'privacy.html')
      }
    }
  }
});
