import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './project.mjs';

const files = (await fs.readdir(path.join(root, 'tests'))).filter(file => file.endsWith('.test.cjs') || file.endsWith('.test.mjs')).sort();
let failures = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, [path.join(root, 'tests', file)], { cwd: root, encoding: 'utf8', timeout: 30000 });
  console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${file}`);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) failures++;
}
console.log(`${files.length - failures}/${files.length} test suites passed.`);
process.exitCode = failures ? 1 : 0;
