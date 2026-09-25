import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))
let ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg'
try { ffmpeg = require('ffmpeg-static') || ffmpeg } catch { /* system ffmpeg is fine */ }

const motion = "zoompan=z='min(zoom+0.0005,1.045)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30"
const filter = `[0:v]${motion},trim=duration=2.6,setpts=PTS-STARTPTS[a];[1:v]${motion},trim=duration=3.0,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0,format=yuv420p[out]`
const result = spawnSync(ffmpeg, [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-loop', '1', '-framerate', '30', '-i', join(here, 'opening.jpg'),
  '-loop', '1', '-framerate', '30', '-i', join(here, 'closing.jpg'),
  '-filter_complex', filter, '-map', '[out]', '-r', '30',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  join(here, 'brand-preview.mp4'),
], { stdio: 'inherit' })
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status || 1)
