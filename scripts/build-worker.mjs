import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { build } from 'vite'

const mime = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  woff2: 'font/woff2',
  svg: 'image/svg+xml',
  png: 'image/png',
}
const files = await readdir('dist', { recursive: true, withFileTypes: true })
const assets = Object.fromEntries(await Promise.all(files.filter((file) => file.isFile() && file.parentPath !== 'dist/server').map(async (file) => {
  const path = file.parentPath + '/' + file.name
  return [path.slice(4), { content: (await readFile(path)).toString('base64'), type: mime[file.name.split('.').at(-1)] }]
})))
const [{ output: [worker] }] = await build({
  configFile: false, logLevel: 'warn',
  build: { lib: { entry: 'worker/index.js', formats: ['es'] }, write: false, minify: false, copyPublicDir: false },
})
const owner = (await readFile('worker/owner.sha256', 'utf8').catch((error) => {
  if (error.code !== 'ENOENT') throw error
  return ''
})).trim()
await mkdir('dist/server', { recursive: true })
await writeFile('dist/server/index.js', 'const assets = ' + JSON.stringify(assets) + '\nconst owner = ' + JSON.stringify(owner) + '\n' + worker.code)
