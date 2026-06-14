// Cross-device QA matrix. Builds is assumed done; this script starts
// `vite preview` on a UNIQUE strict port (4181), then:
//   - loads / at widths 320/768/1440/3840, captures console/pageerror/
//     requestfailed, asserts NO horizontal overflow, screenshots.
//   - deep-links every slug and confirms 0 errors.
// Writes qa/QA-REPORT.md. Exits non-zero on ANY error or overflow.
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';

const require = createRequire('C:/Users/hp/Desktop/front-end/3Js/threeJs/');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 4181;
const BASE = `http://localhost:${PORT}`;
const OUT = 'qa/shots';
mkdirSync(OUT, { recursive: true });

const WIDTHS = [
  { w: 320, h: 720 },
  { w: 768, h: 1024 },
  { w: 1440, h: 900 },
  { w: 3840, h: 2160 },
];
const SLUGS = ['/', '/exterior', '/engine', '/configurator', '/specs', '/about'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- start vite preview on a strict unique port ---- */
const isWin = process.platform === 'win32';
const server = spawn(
  isWin ? 'npm.cmd' : 'npm',
  ['run', 'preview', '--', '--port', String(PORT), '--strictPort'],
  { cwd: process.cwd(), stdio: 'pipe', shell: isWin }
);
server.stdout.on('data', () => {});
server.stderr.on('data', () => {});

async function waitForServer(tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(BASE + '/');
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await sleep(400);
  }
  return false;
}

function shutdown() {
  try { server.kill('SIGTERM'); } catch { /* ignore */ }
  if (process.platform === 'win32' && server.pid) {
    try { spawn('taskkill', ['/pid', String(server.pid), '/t', '/f']); } catch { /* ignore */ }
  }
}

const up = await waitForServer();
if (!up) { console.error('preview server did not start on', PORT); shutdown(); process.exit(1); }

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const report = [];
let totalErrors = 0;
let overflowFails = 0;
const shotList = [];

/* ---- matrix: each width loads / ---- */
for (const { w, h } of WIDTHS) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', (r) => errs.push('REQFAIL: ' + r.url() + ' ' + (r.failure()?.errorText || '')));

  await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2200);

  // probe overflow at top and after a deep scroll (gallery/dial regions)
  const probe = async () => page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  }));
  const top = await probe();
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.62, behavior: 'instant' }));
  await sleep(1200);
  const mid = await probe();

  const worst = Math.max(top.scrollW - top.innerW, mid.scrollW - mid.innerW);
  const overflowOk = worst <= 2;
  if (!overflowOk) overflowFails++;
  totalErrors += errs.length;

  const shot = `${OUT}/matrix-${w}.png`;
  await page.screenshot({ path: shot });
  shotList.push(shot);

  report.push({ scope: `/ @ ${w}×${h}`, errors: errs.length, overflow: worst, overflowOk, detail: errs });
  await page.close();
}

/* ---- deep-link every slug @ 1440, confirm 0 errors ---- */
const slugRows = [];
for (const slug of SLUGS) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', (r) => errs.push('REQFAIL: ' + r.url() + ' ' + (r.failure()?.errorText || '')));

  await page.goto(BASE + slug, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1800);
  const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const overflowOk = o <= 2;
  if (!overflowOk) overflowFails++;
  totalErrors += errs.length;
  slugRows.push({ slug, errors: errs.length, overflow: o, overflowOk, detail: errs });
  await page.close();
}

await browser.close();
shutdown();

/* ---- write report ---- */
const ts = new Date().toISOString();
let md = `# QA-REPORT — VANTAGE cross-device matrix\n\nGenerated ${ts} · headless Chrome (SwiftShader) · \`vite preview\` :${PORT}\n\n`;
md += `## Width matrix (route \`/\`)\n\n| Viewport | Errors | Horizontal overflow (px) | Overflow pass |\n|---|---|---|---|\n`;
for (const r of report) md += `| ${r.scope} | ${r.errors} | ${r.overflow} | ${r.overflowOk ? '✅' : '❌'} |\n`;
md += `\n## Deep-link slugs (@ 1440×900)\n\n| Slug | Errors | Overflow (px) | Pass |\n|---|---|---|---|\n`;
for (const r of slugRows) md += `| \`${r.slug}\` | ${r.errors} | ${r.overflow} | ${r.overflowOk && r.errors === 0 ? '✅' : '❌'} |\n`;
md += `\n## Screenshots\n\n${shotList.map((s) => `- \`${s}\``).join('\n')}\n`;
md += `\n## Summary\n\n- Total errors (console + pageerror + requestfailed): **${totalErrors}**\n- Overflow failures: **${overflowFails}**\n- Result: **${totalErrors === 0 && overflowFails === 0 ? 'PASS ✅' : 'FAIL ❌'}**\n`;
const allDetail = [...report, ...slugRows].flatMap((r) => r.detail.map((d) => `- [${r.scope || r.slug}] ${d}`));
if (allDetail.length) md += `\n## Error detail\n\n${allDetail.join('\n')}\n`;

writeFileSync('qa/QA-REPORT.md', md, 'utf8');

console.log(md);
process.exit(totalErrors === 0 && overflowFails === 0 ? 0 : 1);
