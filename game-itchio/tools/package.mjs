// Packs dist/ into a zip with index.html at the root, which is what itch.io
// wants for an HTML game. No dependencies: PowerShell on Windows, `zip` else.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/index.html is missing: run `npm run build` first.');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const target = join(root, `game-itchio-${pkg.version}.zip`);
rmSync(target, { force: true });

if (process.platform === 'win32') {
  execFileSync('powershell', [
    '-NoProfile',
    '-Command',
    `Compress-Archive -Path '${dist.replace(/'/g, "''")}\\*' -DestinationPath '${target.replace(/'/g, "''")}' -Force`,
  ], { stdio: 'inherit' });
} else {
  execFileSync('zip', ['-qr', target, '.'], { cwd: dist, stdio: 'inherit' });
}

console.log(`wrote ${target}`);
