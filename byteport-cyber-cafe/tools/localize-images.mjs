#!/usr/bin/env node
/**
 * Byteport — download every Unsplash photo used by the template into
 * assets/img/photos/ and rewrite all *.html files to use the local copies.
 *
 *   npm run localize-images
 *
 * Requires Node 18+ (built-in fetch). Safe to re-run: files already downloaded are skipped.
 * Run it before packaging for a marketplace or deploying somewhere without CDN access.
 */
import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets', 'img', 'photos');
const re = /https:\/\/images\.unsplash\.com\/[^\s"')]+/g;

const exists = p => access(p).then(() => true, () => false);
const nameFor = u => {
  const url = new URL(u.replace(/&amp;/g, '&'));
  const id = url.pathname.replace(/^\//, '');
  const w = url.searchParams.get('w') || 'full', h = url.searchParams.get('h');
  const tag = createHash('md5').update(url.search).digest('hex').slice(0, 6);
  return `${id}-${w}${h ? 'x' + h : ''}-${tag}.webp`;
};

await mkdir(outDir, { recursive: true });
const files = (await readdir(root)).filter(f => f.endsWith('.html'));
const urls = new Set();
const pages = {};
for (const f of files) { pages[f] = await readFile(path.join(root, f), 'utf8'); (pages[f].match(re) || []).forEach(u => urls.add(u)); }

console.log(`Found ${urls.size} image URLs in ${files.length} pages`);
let done = 0, failed = 0;
const list = [...urls];
const worker = async () => {
  while (list.length) {
    const u = list.shift(), file = path.join(outDir, nameFor(u));
    if (await exists(file)) { done++; continue; }
    try {
      const res = await fetch(u.replace(/&amp;/g, '&'));
      if (!res.ok) throw new Error(res.status);
      await writeFile(file, Buffer.from(await res.arrayBuffer()));
      done++; process.stdout.write(`\r  downloaded ${done}/${urls.size}`);
    } catch (e) { failed++; console.warn(`\n  ! failed ${u} (${e.message})`); }
  }
};
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`\nDownloaded ${done}, failed ${failed}`);

if (!failed) {
  for (const f of files) {
    const html = pages[f].replace(re, u => `assets/img/photos/${nameFor(u)}`)
      .replace(/<link rel="preconnect" href="https:\/\/images\.unsplash\.com">\n?/g, '');
    await writeFile(path.join(root, f), html);
  }
  console.log('All pages now use local images in assets/img/photos/');
} else {
  console.log('Some downloads failed — HTML left unchanged. Re-run to retry.');
}
