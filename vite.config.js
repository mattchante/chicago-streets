import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`        -> dist/ (multi-file, for GitHub Pages / any static host)
// `npm run build:single` -> dist-single/index.html (one self-contained file, e.g. for a Claude artifact)
export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    target: 'es2020',
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
    chunkSizeWarningLimit: 1500,
  },
  plugins: mode === 'single' ? [viteSingleFile()] : [],
}));
