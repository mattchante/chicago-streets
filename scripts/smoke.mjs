// Smoke test: serves the production build, loads it in headless Chromium, visits a set of
// landmarks, drives the SUV briefly, saves screenshots to smoke-output/, and exits non-zero
// on any page error. Run `npm run build` first. First time on a new machine:
// `npx playwright install chromium`.
import { preview } from 'vite';
import { chromium } from 'playwright';
import fs from 'node:fs';

const SHOTS = [
  { name: 'michigan-washington', x: -62, z: -52, yaw: -1.57 },
  { name: 'cloud-gate', x: 4, z: 20, yaw: 0.25, pitch: 0.1, dist: 6 },
  { name: 'ice-rink', x: -20, z: 30, yaw: 0.95, pitch: 0.32, dist: 9 },
  { name: 'walgreens', x: -118, z: -28, yaw: -0.3, pitch: 0.15, dist: 3 },
  { name: 'great-lawn', x: 118, z: 40, yaw: 0.4, pitch: 0.35, dist: 14 },
  { name: 'lakefront', x: 514, z: 40, yaw: -1.9, pitch: 0.12, dist: 6 },
];

fs.mkdirSync('smoke-output', { recursive: true });
const server = await preview({ preview: { port: 4179, strictPort: true }, logLevel: 'error' });
const url = 'http://localhost:4179/?debug';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 640 } });
page.setDefaultTimeout(240_000);
await page.addInitScript(() => { window.__lite = true; }); // low-res, fewer reflection updates for software rendering
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
// Network failures count, except the optional web fonts (offline machines and sandboxes fall back to system fonts).
page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) errors.push(`request failed: ${r.url()}`); });

let failed = false;
try {
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.__g);
  console.log(`loaded in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  await page.evaluate(() => window.__g.start());
  for (const s of SHOTS) {
    await page.evaluate((s) => { const g = window.__g; g.teleport({ x: s.x, z: s.z, yaw: s.yaw }); g.setCam(s.yaw, s.pitch ?? 0.16, s.dist ?? 5.6); }, s);
    // wait for real frames (software rendering can be slow), so the HUD and shadows catch up
    await page.evaluate(() => new Promise((res) => { let n = 0; const f = () => (++n >= 12 ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); }));
    const place = await page.evaluate(() => document.getElementById('place').textContent);
    await page.screenshot({ path: `smoke-output/${s.name}.png` });
    console.log(`  ${s.name.padEnd(22)} -> ${place}`);
  }
  // SUV: get in, accelerate for 3 s of simulated time, get out
  const drive = await page.evaluate(() => {
    const g = window.__g; g.teleport({ x: -62, z: -44, yaw: Math.PI }); g.toggleDrive();
    g.keys.KeyW = true; g.simDrive(3); g.keys.KeyW = false;
    const mph = Math.abs(g.suv.v) * 2.237; const on = g.suv.on; g.toggleDrive();
    return { on, mph: Math.round(mph), out: !g.suv.on };
  });
  console.log(`  suv: entered=${drive.on} speed after 3 s=${drive.mph} mph exited=${drive.out}`);
  if (!drive.on || drive.mph < 20 || !drive.out) { failed = true; console.error('SUV check failed'); }
} catch (e) {
  failed = true; console.error(e);
}
if (errors.length) { failed = true; console.error('Page errors:\n  ' + errors.join('\n  ')); }
await browser.close();
await new Promise((r) => server.httpServer.close(r));
console.log(failed ? 'SMOKE TEST FAILED' : 'smoke test passed');
process.exit(failed ? 1 : 0);
