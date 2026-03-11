const { execSync, spawn } = require('child_process')
const net = require('net')

function usedPidsForPort(port) {
  try {
    const out = execSync(`lsof -ti tcp:${port}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim()
    if (!out) return []
    return out.split('\n').filter(Boolean)
  } catch (e) {
    return []
  }
}

function killPid(pid) {
  try {
    process.kill(Number(pid), 'SIGTERM')
    console.log(`Sent SIGTERM to ${pid}`)
  } catch (e) {
    try { process.kill(Number(pid), 'SIGKILL'); console.log(`Sent SIGKILL to ${pid}`) } catch (err) { console.warn(`Failed to kill ${pid}: ${err.message}`) }
  }
}

const portsToCheck = [3000, 3001, 3002]

for (const port of portsToCheck) {
  const pids = usedPidsForPort(port)
  if (pids.length) {
    console.log(`Port ${port} in use by PIDs: ${pids.join(', ')}; attempting to terminate...`)
    for (const pid of pids) {
      if (String(pid) === String(process.pid)) continue
      killPid(pid)
    }
  } else {
    console.log(`Port ${port} is free`)
  }
}

function waitForPort(port, timeoutMs = 60000, intervalMs = 500) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    ;(function tryConnect() {
      const socket = new net.Socket()
      socket.setTimeout(2000)
      socket.once('error', () => { socket.destroy(); if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout waiting for port ${port}`)); return setTimeout(tryConnect, intervalMs) })
      socket.once('timeout', () => { socket.destroy(); if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout waiting for port ${port}`)); return setTimeout(tryConnect, intervalMs) })
      socket.connect(port, '127.0.0.1', () => { socket.end(); resolve() })
    })()
  })
}

function spawnService(workspace) {
  const child = spawn('npm', ['--workspace=' + workspace, 'start'], { stdio: 'inherit' })
  child.on('exit', (code, sig) => {
    console.log(`${workspace} exited with ${code || sig}`)
    // If any service exits, terminate the whole group
    process.exit(code || (sig ? 1 : 0))
  })
  return child
}

async function main() {
  console.log('Starting core services: auth-service and api-gateway')
  const auth = spawnService('auth-service')
  const api = spawnService('api-gateway')

  try {
    console.log('Waiting for api-gateway (3000) to be ready...')
    await waitForPort(3000, 60000)
    console.log('api-gateway is listening on 3000')
    console.log('Waiting for auth-service (3001) to be ready...')
    await waitForPort(3001, 60000)
    console.log('auth-service is listening on 3001')
  } catch (err) {
    console.error('Error waiting for core services:', err.message)
    console.error('Shutting down started services')
    try { auth.kill('SIGTERM') } catch (e) {}
    try { api.kill('SIGTERM') } catch (e) {}
    process.exit(1)
  }

  console.log('Core services ready — starting operator-ui and worker')
  const ui = spawnService('operator-ui')
  const worker = spawnService('worker')

  // forward termination signals
  const shutdown = () => {
    for (const p of [auth, api, ui, worker]) {
      try { p.kill('SIGTERM') } catch (e) {}
    }
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main()
