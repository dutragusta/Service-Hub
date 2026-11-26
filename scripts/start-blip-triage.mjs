import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { access } from 'node:fs/promises'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const host = '127.0.0.1'
const project = new URL('../integrations/blip-triagem/', import.meta.url)

export async function startBlipTriage(serviceHubPort) {
  const port = Number(process.env.BLIP_TRIAGE_PORT ?? 8000)
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || port === serviceHubPort) {
    throw new Error('BLIP_TRIAGE_PORT precisa ser uma porta entre 1024 e 65535, diferente da porta do Service Hub.')
  }
  await access(new URL('app/main.py', project)).catch(() => {
    throw new Error('Inicialize o backend com git submodule update --init integrations/blip-triagem.')
  })

  const probe = createServer().listen(port, host)
  await once(probe, 'listening').catch((error) => {
    throw new Error('Não foi possível reservar a porta da triagem: ' + error.message)
  })
  await new Promise((resolve) => probe.close(resolve))

  const windows = process.platform === 'win32'
  const venvPython = fileURLToPath(new URL(windows ? '.venv/Scripts/python.exe' : '.venv/bin/python', project))
  const bundledPython = await access(venvPython).then(() => venvPython, () => windows ? 'python' : 'python3')
  const python = process.env.BLIP_TRIAGE_PYTHON || bundledPython
  const url = 'http://' + host + ':' + port + '/'
  const child = spawn(python, ['-m', 'uvicorn', 'app.main:app', '--host', host, '--port', String(port), '--no-access-log'], {
    cwd: fileURLToPath(project),
    env: { ...process.env, DEMO_MODE: 'true', SYSAID_MODE: 'demo', NO_PROXY: '*', no_proxy: '*' },
    stdio: 'inherit',
  })
  const closed = once(child, 'close').then(() => true, () => true)
  const health = new URL('health', url)
  for (let attempt = 0; attempt < 80; attempt++) {
    if (await Promise.race([closed, delay(250, false)])) {
      throw new Error('O backend de triagem encerrou. Confira o Python e instale as dependências de integrations/blip-triagem/requirements.txt.')
    }
    const status = await fetch(health, { signal: AbortSignal.timeout(700) })
      .then((response) => response.ok ? response.json() : null)
      .catch(() => null)
    if (status?.status === 'ok' && status.demo_mode === true) return { url, child }
  }
  child.kill()
  throw new Error('O backend de triagem não ficou disponível dentro do prazo.')
}
