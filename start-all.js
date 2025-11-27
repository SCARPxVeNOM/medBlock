/**
 * Start all MedBlock services
 * Runs: Docker (blockchain, minio, vault), Backend (uploader, keyservice), Frontend
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('==========================================');
console.log('  Starting MedBlock Application');
console.log('==========================================\n');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Track processes
const processes = [];

// Function to start a process
function startProcess(name, command, args, cwd, env = {}) {
  log(`Starting ${name}...`, 'blue');
  const proc = spawn(command, args, {
    cwd: cwd || process.cwd(),
    shell: true,
    env: { ...process.env, ...env },
    stdio: 'inherit'
  });

  proc.on('error', (err) => {
    log(`Error starting ${name}: ${err.message}`, 'red');
  });

  processes.push({ name, process: proc });
  return proc;
}

// Step 1: Start Docker services
log('\nStep 1: Starting Docker services (Blockchain, MinIO, Vault)...', 'yellow');
const docker = startProcess('Docker', 'docker-compose', ['up', '-d']);

docker.on('exit', (code) => {
  if (code !== 0) {
    log('Warning: Docker compose may have issues. Continuing...', 'yellow');
  }

  // Wait a bit for services to start
  setTimeout(() => {
    // Step 2: Start Backend services
    log('\nStep 2: Starting Backend services...', 'yellow');
    
    // Start Uploader
    startProcess('Backend Uploader', 'node', ['uploader.js'], path.join(__dirname, 'backend'), {
      PORT: '3001'
    });

    // Start Key Service
    setTimeout(() => {
      startProcess('Backend Key Service', 'node', ['keyservice.js'], path.join(__dirname, 'backend'), {
        PORT: '3002'
      });
    }, 2000);

    // Step 3: Start Frontend
    setTimeout(() => {
      log('\nStep 3: Starting Frontend...', 'yellow');
      startProcess('Frontend', 'npm', ['start'], path.join(__dirname, 'frontend'));
    }, 4000);

    // Step 4: Show status
    setTimeout(() => {
      log('\n==========================================', 'green');
      log('  ✓ MedBlock Application Started!', 'green');
      log('==========================================\n', 'green');
      log('Services:', 'blue');
      log('  - Frontend: http://localhost:3000', 'green');
      log('  - Backend Uploader API: http://localhost:3001', 'green');
      log('  - Backend Key Service API: http://localhost:3002', 'green');
      log('  - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)', 'green');
      log('  - Vault Mock: http://localhost:8200', 'green');
      log('\nPress Ctrl+C to stop all services\n', 'yellow');
    }, 6000);
  }, 5000);
});

// Handle cleanup
process.on('SIGINT', () => {
  log('\n\nStopping all services...', 'yellow');
  processes.forEach(({ name, process: proc }) => {
    if (!proc.killed) {
      log(`Stopping ${name}...`, 'blue');
      proc.kill();
    }
  });
  
  // Stop docker
  spawn('docker-compose', ['down'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'inherit'
  });
  
  log('\nAll services stopped.', 'green');
  process.exit(0);
});

process.on('SIGTERM', () => {
  processes.forEach(({ name, process: proc }) => {
    if (!proc.killed) {
      proc.kill();
    }
  });
  process.exit(0);
});

