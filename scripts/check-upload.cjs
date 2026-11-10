'use strict';
// Scan the exact upload snapshot before sending any files to public GitHub.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
function fail(message) { console.error(message); process.exit(1); }
if (process.argv.length !== 3) fail('Usage: node scripts/check-upload.cjs /absolute/path/to/upload-snapshot');
const snapshot = path.resolve(process.argv[2]);
if (!fs.existsSync(snapshot) || !fs.lstatSync(snapshot).isDirectory()) fail('Provide a separate upload snapshot directory.');
const actual = fs.realpathSync(snapshot);
const relative = path.relative(root, actual);
if (!relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) fail('The upload snapshot must be outside the repository.');
let files = 0;
function inspect(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (entry.name === '.git') fail('Remove Git metadata from the upload snapshot.');
    if (entry.isSymbolicLink()) fail('Upload snapshots must not contain symbolic links.');
    if (entry.isDirectory()) inspect(path.join(dir, entry.name));
    else if (entry.isFile()) files++;
    else fail('Upload snapshots must contain only ordinary files and directories.');
  }
}
inspect(actual);
if (!files) fail('The upload snapshot is empty.');
// Reuse the workflow version so scanner upgrades have one controlling pin.
const workflow = fs.readFileSync(path.join(root, '.github/workflows/site-checks.yml'), 'utf8');
const version = workflow.match(/GITLEAKS_VERSION: '([0-9.]+)'/)?.[1];
if (!version) fail('Cannot determine the required Gitleaks version.');
const scanner = process.env.GITLEAKS_BIN || 'gitleaks';
const checked = spawnSync(scanner, ['version'], {encoding: 'utf8'});
if (checked.error || checked.status !== 0 || checked.stdout.trim() !== version) fail('Install the checksum-verified Gitleaks version specified in Site checks, or set GITLEAKS_BIN to that binary.');
const config = path.join(root, '.gitleaks.toml');
for (const [cwd, args] of [
  [root, ['git', '.', '--log-opts=--all']],
  [actual, ['dir', '.']]
]) {
  const result = spawnSync(scanner, [...args, '--config', config, '--gitleaks-ignore-path', path.join(root, '.gitleaksignore'), '--redact=100', '--ignore-gitleaks-allow', '--no-banner'], {cwd, stdio: 'inherit'});
  if (result.error || result.status !== 0) fail('Pre-upload secret scan failed. Do not upload this snapshot.');
}
console.log('Pre-upload secret scans passed. Upload only these unchanged snapshot files.');
