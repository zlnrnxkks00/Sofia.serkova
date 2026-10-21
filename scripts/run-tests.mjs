import path from 'node:path';
import { spawn } from 'node:child_process';
import { root } from './project.mjs';

export async function runSuites(directory, files) {
  let failures = 0;
  for (const file of files) {
    console.log(`RUN ${directory}/${file}`);
    const passed = await new Promise(resolve => {
      const child = spawn(process.execPath, [path.join(root, directory, file)], { cwd: root, stdio: 'inherit' });
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, file.includes('energy') ? 120000 : 60000);
      child.on('error', error => { console.error(error.message); clearTimeout(timer); resolve(false); });
      child.on('close', code => { clearTimeout(timer); if (timedOut) console.error(`Timed out: ${file}`); resolve(code === 0 && !timedOut); });
    });
    console.log(`${passed ? 'PASS' : 'FAIL'} ${directory}/${file}`);
    if (!passed) failures++;
  }
  console.log(`${files.length - failures}/${files.length} ${directory} test suites passed.`);
  if (failures) process.exitCode = 1;
}
