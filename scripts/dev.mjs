import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
let stopping = false;
const commands = [
  ['node_modules/typescript/bin/tsc', '-p', 'packages/contracts/tsconfig.json', '--watch', '--preserveWatchOutput'],
  ['node_modules/typescript/bin/tsc', '-p', 'apps/api/tsconfig.json', '--watch', '--preserveWatchOutput'],
  ['--watch', 'apps/api/dist/src/main.js'],
  ['node_modules/next/dist/bin/next', 'dev', 'apps/web', '--hostname', '127.0.0.1', '--port', process.env.PORT ?? '3000'],
];
const children = commands.map((args) => spawn(process.execPath, args, { cwd: root, stdio: 'inherit', env: process.env, windowsHide: true }));

function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}

for (const child of children) {
  child.on('error', () => stop(1));
  child.on('exit', (code) => { if (!stopping) stop(code ?? 1); });
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
