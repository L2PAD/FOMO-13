const { spawn } = require('child_process');

const children = [];
let isShuttingDown = false;

function startProcess(name, args) {
  const child = spawn(process.execPath, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });

  children.push(child);

  child.on('exit', (code, signal) => {
    if (isShuttingDown) return;

    isShuttingDown = true;
    const exitCode = typeof code === 'number' ? code : signal ? 1 : 0;
    console.error(`${name} exited code=${code ?? 'null'} signal=${signal ?? 'null'}`);
    stopChildren();
    process.exit(exitCode);
  });

  child.on('error', (error) => {
    if (isShuttingDown) return;

    isShuttingDown = true;
    console.error(`${name} failed to start: ${error.message}`);
    stopChildren();
    process.exit(1);
  });

  return child;
}

function stopChildren() {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
}

function shutdown(signal) {
  if (isShuttingDown) return;

  isShuttingDown = true;
  console.log(`Received ${signal}, stopping backend processes...`);
  stopChildren();

  setTimeout(() => {
    process.exit(0);
  }, Number(process.env.PROCESS_SHUTDOWN_GRACE_MS || 5000)).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startProcess('api', ['dist/main']);
startProcess('portfolio-worker', ['dist/portfolio-worker']);
