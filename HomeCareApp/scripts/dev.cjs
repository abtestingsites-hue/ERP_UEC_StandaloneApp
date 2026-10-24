const { execSync, spawn } = require('child_process');
const os = require('os');
const path = require('path');

const PORT = 5175;

function freePort(port) {
  const currentPid = process.pid;
  try {
    if (os.platform() === 'win32') {
      let output = '';
      try {
        output = execSync(`netstat -ano`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      } catch (e) {
        output = '';
      }

      const lines = output.split('\n');
      const targetPids = new Set();

      for (const line of lines) {
        if (line.includes(`:${port}`) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[parts.length - 1], 10);
          if (pid && pid !== currentPid && pid !== 0 && pid !== 4) {
            targetPids.add(pid);
          }
        }
      }

      for (const pid of targetPids) {
        console.log(`[dev.cjs] Found process ${pid} listening on port ${port}. Terminating PID ${pid}...`);
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`[dev.cjs] Process ${pid} successfully terminated.`);
        } catch (e) {
          console.warn(`[dev.cjs] Note: Process ${pid} could not be terminated directly: ${e.message}`);
        }
      }
    } else {
      try {
        const pidStr = execSync(`lsof -t -i:${port}`, { encoding: 'utf8' }).trim();
        if (pidStr) {
          const pids = pidStr.split('\n');
          for (const p of pids) {
            const pid = parseInt(p.trim(), 10);
            if (pid && pid !== currentPid) {
              console.log(`[dev.cjs] Terminating process ${pid} on port ${port}...`);
              execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
            }
          }
        }
      } catch (e) {
        // No process found listening on port
      }
    }
  } catch (err) {
    // Port check finished cleanly
  }
}

// 1. Detect and clear any existing process on port 5175
freePort(PORT);

// 2. Start Vite dev server
console.log(`[dev.cjs] Starting Vite dev server on http://127.0.0.1:${PORT}...`);

const projectRoot = path.join(__dirname, '..');
const viteCmd = os.platform() === 'win32' 
  ? `"${path.join(projectRoot, 'node_modules', '.bin', 'vite.cmd')}"`
  : 'vite';

const child = spawn(viteCmd, [], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('[dev.cjs] Error starting Vite process:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(0);
  } else {
    process.exit(code || 0);
  }
});

['SIGINT', 'SIGTERM'].forEach((sig) => {
  process.on(sig, () => {
    if (child && !child.killed) {
      child.kill(sig);
    }
  });
});
