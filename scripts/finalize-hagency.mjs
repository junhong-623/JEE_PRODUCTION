import { existsSync, renameSync } from 'fs'

if (existsSync('dist-hagency/hagency.html')) {
  renameSync('dist-hagency/hagency.html', 'dist-hagency/index.html')
}
console.log('✓ H Agency standalone entry finalized as dist-hagency/index.html')
