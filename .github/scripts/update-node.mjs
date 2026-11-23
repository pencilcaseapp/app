// Moves .nvmrc, engines.node and the esbuild target to the newest Node.js
// LTS release, and @types/node along with it when the major changes.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const response = await fetch('https://nodejs.org/dist/index.json');
const releases = await response.json();
const latest = releases.find(release => release.lts).version.slice(1);
const current = readFileSync('.nvmrc', 'utf8').trim().replace(/^v/, '');

if (latest !== current) {
  const major = latest.split('.')[0];
  const packageJson = readFileSync('package.json', 'utf8')
    .replace(/("engines": {\s*"node": ")[^"]+/, `$1${latest}`)
    .replace(/("@types\/node": "\^)\d+/, `$1${major}`)
    .replace(/--target=node\d+/g, `--target=node${major}`);

  writeFileSync('.nvmrc', `v${latest}\n`);
  writeFileSync('package.json', packageJson);
  console.log(`Node.js ${current} -> ${latest}`);
}
else {
  console.log(`Node.js ${current} is the latest LTS`);
}

if (process.env.GITHUB_OUTPUT) {
  const changed = latest !== current;
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `version=${latest}\nchanged=${changed}\n`,
  );
}
