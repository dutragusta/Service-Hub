import { cp, readFile, rm, writeFile } from 'node:fs/promises'

const template = await readFile('index.html', 'utf8')
const compiled = await readFile('dist/pages/index.html', 'utf8')
const assets = compiled.split('\n').filter((line) => /(?:href|src)="\.\/assets\//.test(line))

if (!template.includes('<!-- pages:start -->') || !template.includes('<!-- pages:end -->') ||
    !assets.some((line) => line.includes('<script')) || !assets.some((line) => line.includes('stylesheet'))) {
  throw new Error('Não foi possível montar a entrada estática do Service Hub.')
}

const publicTags = assets.map((line) => line.replaceAll('./assets/', './pages/assets/'))
await rm('pages/assets', { recursive: true, force: true })
await cp('dist/pages/assets', 'pages/assets', { recursive: true })
await writeFile('index.html', template.replace(
  /<!-- pages:start -->[\s\S]*?<!-- pages:end -->/,
  ['<!-- pages:start -->', ...publicTags, '    <!-- pages:end -->'].join('\n'),
))
