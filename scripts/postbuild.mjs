// After `ng build`: write sitemap.xml from the prerendered pages and a root 404.html for Netlify.
import { copyFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://tools.spreadapps.in';
const out = 'dist/tools/browser';
const today = new Date().toISOString().slice(0, 10);

const pages = [];
(function walk(dir, rel) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, rel ? `${rel}/${name}` : name);
    else if (name === 'index.html') pages.push(rel);
  }
})(out, '');

const skip = new Set(['404']);
const urls = pages
  .filter((p) => !skip.has(p))
  .sort((a, b) => a.length - b.length || a.localeCompare(b))
  .map((p) => {
    const priority = p === '' ? '1.0' : /-resize$|resize-image-to/.test(p) ? '0.9' : '0.3';
    return `  <url><loc>${SITE}/${p}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`;
  });

writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

if (existsSync(join(out, '404/index.html'))) copyFileSync(join(out, '404/index.html'), join(out, '404.html'));
console.log(`postbuild: sitemap.xml with ${urls.length} URLs, 404.html ${existsSync(join(out, '404.html')) ? 'written' : 'MISSING'}`);
