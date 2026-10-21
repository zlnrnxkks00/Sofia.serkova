import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from './project.mjs';
import { runSuites } from './run-tests.mjs';

const files = (await fs.readdir(path.join(root, 'tests/react'))).filter(file => file.endsWith('.test.mjs')).sort();
await runSuites('tests/react', files);
