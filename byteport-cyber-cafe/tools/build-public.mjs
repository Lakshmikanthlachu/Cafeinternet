// Copies the deployable site into ./public (used by Vercel and any static host).
// Run: npm run build:public   (npm run build first if you changed Tailwind classes)
import { cpSync, rmSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'public';
const KEEP = (name) => /\.(html|xml|txt)$/.test(name) || name === 'assets';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const name of readdirSync('.')) {
  if (!KEEP(name)) continue;
  cpSync(name, join(OUT, name), {
    recursive: true,
    // the Tailwind source file is not needed on the live site
    filter: (src) => !src.endsWith('tailwind.input.css'),
  });
}
const count = (dir) => readdirSync(dir).reduce((n, f) => n + (statSync(join(dir, f)).isDirectory() ? count(join(dir, f)) : 1), 0);
console.log(`public/ ready — ${count(OUT)} files`);
