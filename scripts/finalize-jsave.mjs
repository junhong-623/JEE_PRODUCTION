import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const outputDirectory = resolve('dist-jsave')

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = resolve(directory, entry.name)
    return entry.isDirectory() ? filesIn(absolute) : [absolute]
  })
}

const excluded = new Set(['sw.js', 'precache-manifest.json'])
const assets = filesIn(outputDirectory)
  .filter(file => statSync(file).isFile())
  .map(file => relative(outputDirectory, file).replaceAll('\\', '/'))
  .filter(file => !excluded.has(file))
  .map(file => `/${file}`)
  .sort()

writeFileSync(
  resolve(outputDirectory, 'precache-manifest.json'),
  `${JSON.stringify({ assets }, null, 2)}\n`,
)

console.log(`✓ JSave precache manifest generated (${assets.length} files)`)
