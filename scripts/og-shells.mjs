// Runs AFTER `vite build`. For every routable slug, writes a static
// dist/<slug>/index.html that is a byte-for-byte copy of the built SPA shell
// with that slug's own <title> + og:* meta swapped in. Social crawlers fetch
// the per-slug file (static files win over the SPA catch-all rewrite on
// Vercel); real users hydrate the same JS bundle and the SPA router takes over.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { SLUGS } from './og-meta.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const DIST = `${__dir}/../dist`;
const SRC = `${DIST}/index.html`;

if (!existsSync(SRC)) {
  console.error('og-shells: dist/index.html not found — run vite build first.');
  process.exit(1);
}
const base = readFileSync(SRC, 'utf8');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function rewrite(html, { title, desc, file }) {
  const img = `/og/${file}.svg`;
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  out = out.replace(/(<meta name="description" content=")[\s\S]*?(")/, `$1${esc(desc)}$2`);
  out = out.replace(/(<meta property="og:title" content=")[\s\S]*?(")/, `$1${esc(title)}$2`);
  out = out.replace(/(<meta property="og:description" content=")[\s\S]*?(")/, `$1${esc(desc)}$2`);
  out = out.replace(/(<meta property="og:image" content=")[\s\S]*?(")/, `$1${img}$2`);
  // keep twitter:image in lockstep with og:image (rewrite if present, else inject)
  if (/twitter:image/.test(out)) {
    out = out.replace(/(<meta name="twitter:image" content=")[\s\S]*?(")/, `$1${img}$2`);
  } else {
    out = out.replace(/(<meta property="og:image" content="[^"]*" \/>)/, `$1\n  <meta name="twitter:image" content="${img}" />`);
  }
  return out;
}

let count = 0;
for (const entry of SLUGS) {
  if (entry.slug === '/') {
    // root index.html: enrich it in place with twitter:image + slug image
    writeFileSync(SRC, rewrite(base, entry), 'utf8');
    count++;
    continue;
  }
  const dir = `${DIST}${entry.slug}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, rewrite(base, entry), 'utf8');
  count++;
  console.log('wrote dist' + entry.slug + '/index.html');
}
console.log(`og-shells: wrote ${count} static shells.`);
