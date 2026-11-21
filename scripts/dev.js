const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const processes = [
  {
    name: 'server',
    script: path.join(root, 'server', 'server.js'),
    args: [],
    cwd: root,
  },
  {
    name: 'client',
    script: path.join(root, 'client', 'node_modules', 'vite', 'bin', 'vite.js'),
    args: ['--host', '127.0.0.1'],
    cwd: path.join(root, 'client'),
  },
];

let stopping = false;
const children = processes.map(({ name, script, args, cwd }) => {
  const child = spawn(process.execPath, [script, ...args], {
    cwd,
    env: process.env,
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    console.error(`[${name}] Could not start: ${error.message}`);
    stop(1);
  });

  child.on('exit', (code, signal) => {
    if (stopping) return;
    if (signal) console.error(`[${name}] stopped with signal ${signal}`);
    else if (code !== 0) console.error(`[${name}] exited with code ${code}`);
    stop(typeof code === 'number' ? code : 1);
  });

  return child;
});

function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exitCode = code;
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
