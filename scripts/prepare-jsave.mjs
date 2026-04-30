import { cpSync, mkdirSync } from 'fs'

mkdirSync('public-jsave/icons', { recursive: true })
cpSync('public/jsave/icons', 'public-jsave/icons', { recursive: true })
console.log('✓ JSave icons copied to public-jsave/icons')
