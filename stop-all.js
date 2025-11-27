/**
 * Stop all MedBlock services
 */

const { spawn } = require('child_process');

console.log('Stopping all MedBlock services...\n');

// Stop Docker services
console.log('Stopping Docker services...');
const docker = spawn('docker-compose', ['down'], {
  shell: true,
  stdio: 'inherit'
});

docker.on('exit', (code) => {
  console.log('\n✓ All services stopped.');
  process.exit(code);
});

