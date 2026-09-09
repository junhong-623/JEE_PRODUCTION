import { readFile, readdir } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const dataRoot = new URL('../../public/luck-calc/data/', import.meta.url)

describe('generated Lucky Calc data', () => {
  it('contains a complete manifest and both sets of 100 shards', async () => {
    const manifest = JSON.parse(await readFile(new URL('manifest.json', dataRoot), 'utf8'))
    const historyShards = (await readdir(new URL('history/', dataRoot))).filter(file => file.endsWith('.json'))
    const suffixShards = (await readdir(new URL('suffix/', dataRoot))).filter(file => file.endsWith('.json'))
    expect(manifest.schemaVersion).toBe(2)
    expect(manifest.totalRecords).toBeGreaterThan(300000)
    expect(manifest.suffixTopPrizeRecords).toBeGreaterThan(40000)
    expect(Object.keys(manifest.coverage)).toEqual(['magnum', 'sportstoto', 'damacai'])
    expect(historyShards).toHaveLength(100)
    expect(suffixShards).toHaveLength(100)
  })

  it('indexes last-three-digit matches for top prizes only', async () => {
    const shard = JSON.parse(await readFile(new URL('suffix/63.json', dataRoot), 'utf8'))
    expect(shard['063']).toBeTruthy()
    for (const [ending, records] of Object.entries(shard)) {
      expect(ending).toMatch(/^\d{3}$/)
      expect(records).toEqual([...records].sort((a, b) => b[1].localeCompare(a[1])))
      for (const [number, , , prize] of records) {
        expect(number.endsWith(ending)).toBe(true)
        expect(['1', '2', '3']).toContain(prize)
      }
    }
  })

  it('keeps four-digit numbers and newest-first history', async () => {
    const shard = JSON.parse(await readFile(new URL('history/00.json', dataRoot), 'utf8'))
    expect(shard['0063']).toBeTruthy()
    for (const [number, records] of Object.entries(shard)) {
      expect(number).toMatch(/^\d{4}$/)
      expect(records).toEqual([...records].sort((a, b) => b[0].localeCompare(a[0])))
    }
  })

  it('contains valid latest draws for every operator', async () => {
    const latest = JSON.parse(await readFile(new URL('latest.json', dataRoot), 'utf8'))
    for (const draw of Object.values(latest)) {
      expect(draw.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(draw.first).toMatch(/^\d{4}$/)
      expect(draw.special.length).toBe(10)
      expect(draw.consolation.length).toBe(10)
    }
  })
})

