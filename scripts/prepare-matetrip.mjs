import { cpSync, mkdirSync } from 'fs'

mkdirSync('public-matetrip/icons', { recursive: true })
cpSync('public/matetrip/icons', 'public-matetrip/icons', { recursive: true })
console.log('✓ MateTrip icons copied to public-matetrip/icons')
