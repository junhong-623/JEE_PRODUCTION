import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))
const showDetails = process.argv.includes('--show-details')
const [automationArg, albumArg] = process.argv.slice(2).filter(arg => arg !== '--show-details')
if (!automationArg || !albumArg) {
  throw new Error('Usage: node build-reel.mjs <automation-recording.mp4> <album-recording.mp4> [--show-details]')
}
const automation = resolve(automationArg)
const album = resolve(albumArg)
let ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg'
try { ffmpeg = require('ffmpeg-static') || ffmpeg } catch { /* use system ffmpeg */ }
const work = mkdtempSync(join(tmpdir(), 'jsave-reel-'))
const fps = 30

function run(args) {
  const result = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`FFmpeg exited with status ${result.status}`)
}

const scenes = [
  { card: 'opening', frames: 45 },
  // The public detail edit shows only the top of the receipt; the archive edit blurs the whole screen.
  showDetails
    ? { card: 'auto', video: automation, start: 3.55, sourceSeconds: 1.45, frames: 45, crop: [384, 430, 0, 0], size: [840, 940] }
    : { card: 'auto', video: automation, start: 3.55, sourceSeconds: 1.45, frames: 45, crop: [384, 848, 0, 0], size: [426, 940], blur: true },
  // Cropping the other real recording to the active control removes receipt IDs and unrelated photos.
  { card: 'album', video: album, start: 5.8, sourceSeconds: 1.7, frames: 51, crop: [384, 515, 0, 245], size: [641, 860] },
  { card: 'category', video: album, start: 9.7, sourceSeconds: 1.0, frames: 48, crop: [384, 495, 0, 60], size: [665, 857] },
  { card: 'review', video: album, start: 11.3, sourceSeconds: 2.0, frames: 60, crop: [384, 335, 0, 58], size: [850, 742] },
  { card: 'saved', video: album, start: 15.5, sourceSeconds: 1.4, frames: 42, crop: [384, 205, 0, 55], size: [850, 454] },
  { card: 'closing', frames: 54 },
]

const paths = []
scenes.forEach((scene, index) => {
  const out = join(work, `scene-${String(index).padStart(2, '0')}.mp4`)
  const still = join(here, `${scene.card}.jpg`)
  const common = ['-map', '[out]', '-frames:v', String(scene.frames), '-r', String(fps), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-video_track_timescale', '30000', '-movflags', '+faststart', out]
  if (!scene.video) {
    const filter = "zoompan=z='min(zoom+0.0018,1.10)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p[out]"
    run(['-loop', '1', '-framerate', String(fps), '-i', still, '-filter_complex', filter, ...common])
  } else {
    const [cw, ch, cx, cy] = scene.crop
    const [width, height] = scene.size
    const x = Math.round((1080 - width) / 2)
    const y = Math.round(680 + (940 - height) / 2)
    const redaction = !showDetails && scene.card === 'review'
      ? ',drawbox=x=56:y=108:w=738:h=105:color=0x4d5555:t=fill,drawbox=x=56:y=345:w=738:h=58:color=0x4d5555:t=fill'
      : ''
    const foreground = scene.blur
      ? `crop=${cw}:${ch}:${cx}:${cy},boxblur=18:2,scale=${width}:${height}:flags=lanczos`
      : `crop=${cw}:${ch}:${cx}:${cy},scale=${width}:${height}:flags=lanczos,unsharp=5:5:0.55${redaction}`
    const filter = `[1:v]${foreground},fps=${fps},setpts=PTS-STARTPTS[fg];[0:v][fg]overlay=${x}:${y}:eof_action=repeat:shortest=0,format=yuv420p[out]`
    run(['-loop', '1', '-framerate', String(fps), '-i', still, '-ss', String(scene.start), '-t', String(scene.sourceSeconds), '-i', scene.video, '-filter_complex', filter, ...common])
  }
  paths.push(out)
})

const list = join(work, 'scenes.txt')
writeFileSync(list, paths.map(path => `file '${path.replace(/'/g, "'\\''")}'`).join('\n'))
const silent = join(work, 'silent.mp4')
run(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent])

// Original, low-volume synthetic music. No external copyrighted audio is used.
const seconds = scenes.reduce((total, scene) => total + scene.frames / fps, 0)
const rate = 44100
const samples = Math.ceil(seconds * rate)
const pcm = Buffer.alloc(44 + samples * 2)
pcm.write('RIFF', 0); pcm.writeUInt32LE(pcm.length - 8, 4); pcm.write('WAVEfmt ', 8)
pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22)
pcm.writeUInt32LE(rate, 24); pcm.writeUInt32LE(rate * 2, 28)
pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36)
pcm.writeUInt32LE(samples * 2, 40)
const beat = 60 / 116
const chords = [[261.63,329.63,392.00],[220.00,261.63,329.63],[174.61,220.00,261.63],[196.00,246.94,293.66]]
for (let i = 0; i < samples; i += 1) {
  const t = i / rate
  const beatNo = Math.floor(t / beat)
  const b = t % beat
  const chord = chords[Math.floor(beatNo / 4) % chords.length]
  let value = 0
  for (let j = 0; j < chord.length; j += 1) {
    const f = chord[j]
    value += 0.028 * Math.sin(2 * Math.PI * f * t) * Math.exp(-b * 2.8)
    value += 0.008 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-b * 5)
  }
  value += 0.06 * Math.sin(2 * Math.PI * 67 * b) * Math.exp(-b * 24)
  const half = t % (beat / 2)
  value += 0.008 * Math.sin(2 * Math.PI * 4300 * half) * Math.exp(-half * 90)
  const fade = Math.min(1, t / 0.35, (seconds - t) / 0.65)
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value * Math.max(0, fade))) * 32767), 44 + i * 2)
}
const soundtrack = join(work, 'soundtrack.wav')
writeFileSync(soundtrack, pcm)
const output = showDetails
  ? join(tmpdir(), 'jsave-shortcut-demo-details.mp4')
  : join(here, 'jsave-shortcut-demo.mp4')
run(['-i', silent, '-i', soundtrack, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', output])
console.log(output)
console.log(`Duration: ${seconds.toFixed(2)} seconds`)
