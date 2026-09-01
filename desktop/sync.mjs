// Régénère le bundle web de l'app Expo et le recopie dans www/.
//
// La coque Electron est un paquet npm distinct (voir main.cjs) : elle ne peut
// pas empaqueter directement ../web-dist, car electron-builder n'inclut que ce
// qui se trouve sous le dossier du paquet. D'où cette copie explicite plutôt
// qu'un lien symbolique, qui ne survivrait pas à l'empaquetage.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, '..');
const source = join(appRoot, 'web-dist');
const target = join(here, 'www');

console.log('Export web de l’app Expo…');
execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', 'web-dist'], {
  cwd: appRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (!existsSync(source)) {
  console.error(`Export terminé mais ${source} est absent.`);
  process.exit(1);
}

// Purge avant copie : sans ça, les bundles des exports précédents (leur nom
// porte un hachage) s’accumuleraient dans l’EXE livré.
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log(`Bundle copié dans ${target}`);
