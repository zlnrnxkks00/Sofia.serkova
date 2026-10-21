import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from './project.mjs';
import { runSuites } from './run-tests.mjs';

const files = (await fs.readdir(path.join(root, 'tests'))).filter(file => file.endsWith('.test.cjs') || file.endsWith('.test.mjs')).sort();
await runSuites('tests', files);
