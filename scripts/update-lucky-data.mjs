import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const SOURCE_REPO = 'deadboy18/malaysia-4d'
const SOURCE_BRANCH = 'main'
const OUTPUT_ROOT = path.resolve('public/luck-calc/data')
const HISTORY_ROOT = path.join(OUTPUT_ROOT, 'history')
const SUFFIX_ROOT = path.join(OUTPUT_ROOT, 'suffix')
const DRAWS_ROOT = path.join(OUTPUT_ROOT, 'draws')

const SOURCES = {
  magnum: 'magnum_draws.csv',
  sportstoto: 'sportstoto_draws.csv',
  damacai: 'damacai_draws.csv',
}

const OPERATOR_CODES = { magnum: 'm', sportstoto: 't', damacai: 'd' }
const PRIZE_COLUMNS = [
  ['prize_1', '1'],
  ['prize_2', '2'],
  ['prize_3', '3'],
  ...Array.from({ length: 10 }, (_, index) => [`special_${index + 1}`, 's']),
  ...Array.from({ length: 10 }, (_, index) => [`consol_${index + 1}`, 'c']),
]

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines.shift().split(',')
  return lines.filter(Boolean).map((line, lineIndex) => {
    const values = line.split(',')
    if (values.length !== headers.length) throw new Error(`Malformed CSV row ${lineIndex + 2}`)
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]))
  })
}

async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) })
      if (response.ok) return response
      lastError = new Error(`${response.status} while fetching ${url}`)
    } catch (error) {
      lastError = error
    }
    if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, attempt * 1_000))
  }
  throw lastError
}

async function getText(url) {
  const response = await fetchWithRetry(url, { headers: { 'User-Agent': 'jeeprod-lucky-data-updater' } })
  return response.text()
}

async function getSourceCommit() {
  try {
    const response = await fetchWithRetry(`https://api.github.com/repos/${SOURCE_REPO}/commits/${SOURCE_BRANCH}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'jeeprod-lucky-data-updater' },
    })
    const data = await response.json()
    return data.sha || 'unknown'
  } catch (error) {
    console.warn(`Could not resolve source commit: ${error.message}`)
    return 'unknown'
  }
}

function validateDraw(draw, operator) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draw.date)) throw new Error(`${operator}: invalid date ${draw.date}`)
  if (!draw.draw_seq) throw new Error(`${operator}: missing draw sequence on ${draw.date}`)
  for (const [column] of PRIZE_COLUMNS) {
    const rawValue = draw[column]
    const integerValue = /^\d{1,4}\.0$/.test(rawValue) ? rawValue.slice(0, -2) : rawValue
    const value = /^\d{1,4}$/.test(integerValue) ? integerValue.padStart(4, '0') : integerValue
    draw[column] = value
    if (value && !/^\d{4}$/.test(value)) throw new Error(`${operator}: invalid ${column}=${value} on ${draw.date}`)
  }
  for (const column of ['prize_1', 'prize_2', 'prize_3']) {
    if (!/^\d{4}$/.test(draw[column])) throw new Error(`${operator}: missing ${column} on ${draw.date}`)
  }
}

function serializeDraw(draw) {
  return {
    drawNo: String(draw.draw_seq),
    date: draw.date,
    first: draw.prize_1,
    second: draw.prize_2,
    third: draw.prize_3,
    special: Array.from({ length: 10 }, (_, index) => draw[`special_${index + 1}`]).filter(Boolean),
    consolation: Array.from({ length: 10 }, (_, index) => draw[`consol_${index + 1}`]).filter(Boolean),
  }
}

const sourceCommit = await getSourceCommit()
const sourceRef = sourceCommit === 'unknown' ? SOURCE_BRANCH : sourceCommit
const history = Object.fromEntries(Array.from({ length: 100 }, (_, index) => [String(index).padStart(2, '0'), {}]))
const suffix = Object.fromEntries(Array.from({ length: 100 }, (_, index) => [String(index).padStart(2, '0'), {}]))
const drawsByYear = {}
const latest = {}
const coverage = {}
let totalRecords = 0
let suffixTopPrizeRecords = 0

for (const [operator, file] of Object.entries(SOURCES)) {
  const url = `https://raw.githubusercontent.com/${SOURCE_REPO}/${sourceRef}/data/${file}`
  const draws = parseCsv(await getText(url)).sort((a, b) => a.date.localeCompare(b.date))
  const seenDraws = new Set()
  let operatorRecords = 0

  for (const draw of draws) {
    validateDraw(draw, operator)
    const drawKey = `${draw.date}:${draw.draw_seq}`
    if (seenDraws.has(drawKey)) throw new Error(`${operator}: duplicate draw ${drawKey}`)
    seenDraws.add(drawKey)

    const year = draw.date.slice(0, 4)
    if (!drawsByYear[year]) drawsByYear[year] = {}
    if (!drawsByYear[year][draw.date]) drawsByYear[year][draw.date] = {}
    if (drawsByYear[year][draw.date][operator]) {
      throw new Error(`${operator}: multiple draws on ${draw.date}`)
    }
    drawsByYear[year][draw.date][operator] = serializeDraw(draw)

    for (const [column, prizeCode] of PRIZE_COLUMNS) {
      const number = draw[column]
      if (!number) continue
      const shard = history[number.slice(0, 2)]
      if (!shard[number]) shard[number] = []
      shard[number].push([draw.date, OPERATOR_CODES[operator], prizeCode, String(draw.draw_seq)])
      if (['1', '2', '3'].includes(prizeCode)) {
        const suffixShard = suffix[number.slice(-2)]
        const suffixKey = number.slice(-3)
        if (!suffixShard[suffixKey]) suffixShard[suffixKey] = []
        suffixShard[suffixKey].push([number, draw.date, OPERATOR_CODES[operator], prizeCode, String(draw.draw_seq)])
        suffixTopPrizeRecords += 1
      }
      operatorRecords += 1
      totalRecords += 1
    }
  }

  const lastDraw = draws.at(-1)
  latest[operator] = serializeDraw(lastDraw)
  coverage[operator] = {
    from: draws[0].date,
    to: lastDraw.date,
    drawCount: draws.length,
    recordCount: operatorRecords,
  }
}

for (const shard of Object.values(history)) {
  for (const records of Object.values(shard)) records.sort((a, b) => b[0].localeCompare(a[0]))
}
for (const shard of Object.values(suffix)) {
  for (const records of Object.values(shard)) records.sort((a, b) => b[1].localeCompare(a[1]))
}

const manifest = {
  schemaVersion: 3,
  generatedAt: `${Object.values(coverage).map(item => item.to).sort().at(-1)}T21:15:00+08:00`,
  source: `https://github.com/${SOURCE_REPO}`,
  sourceCommit,
  totalRecords,
  suffixTopPrizeRecords,
  drawYears: Object.keys(drawsByYear).sort(),
  coverage,
}

await rm(OUTPUT_ROOT, { recursive: true, force: true })
await mkdir(HISTORY_ROOT, { recursive: true })
await mkdir(SUFFIX_ROOT, { recursive: true })
await mkdir(DRAWS_ROOT, { recursive: true })
await Promise.all(Object.entries(history).map(([prefix, numbers]) =>
  writeFile(path.join(HISTORY_ROOT, `${prefix}.json`), JSON.stringify(numbers)),
))
await Promise.all(Object.entries(suffix).map(([ending, numbers]) =>
  writeFile(path.join(SUFFIX_ROOT, `${ending}.json`), JSON.stringify(numbers)),
))
await Promise.all(Object.entries(drawsByYear).map(([year, dates]) =>
  writeFile(path.join(DRAWS_ROOT, `${year}.json`), JSON.stringify(
    Object.fromEntries(Object.entries(dates).sort(([left], [right]) => left.localeCompare(right))),
  )),
))
await writeFile(path.join(OUTPUT_ROOT, 'latest.json'), JSON.stringify(latest, null, 2) + '\n')
await writeFile(path.join(OUTPUT_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
await writeFile(path.join(OUTPUT_ROOT, 'NOTICE.txt'), [
  '4D history data source: https://github.com/deadboy18/malaysia-4d',
  `Source commit: ${sourceCommit}`,
  'Operator names and draw results remain attributable to their respective operators.',
  '',
  'MIT License',
  '',
  'Copyright (c) 2026 deadboy18',
  '',
  'Permission is hereby granted, free of charge, to any person obtaining a copy',
  'of this software and associated documentation files (the "Software"), to deal',
  'in the Software without restriction, including without limitation the rights',
  'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
  'copies of the Software, and to permit persons to whom the Software is',
  'furnished to do so, subject to the following conditions:',
  '',
  'The above copyright notice and this permission notice shall be included in all',
  'copies or substantial portions of the Software.',
  '',
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
  'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
  'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
  'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER',
  'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
  'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE',
  'SOFTWARE.',
  '',
].join('\n'))

console.log(`Generated ${totalRecords.toLocaleString()} history records and ${suffixTopPrizeRecords.toLocaleString()} top-prize suffix records.`)
console.log(`Source commit: ${sourceCommit}`)
