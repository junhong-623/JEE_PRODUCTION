import { cpSync, mkdirSync } from 'fs'

mkdirSync('public-hagency/hagency', { recursive: true })
cpSync('public/hagency', 'public-hagency/hagency', { recursive: true })
console.log('✓ H Agency brand assets copied to public-hagency/hagency')
