import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../../lib/firebase'

const MAX_SOURCE_BYTES = 8 * 1024 * 1024
const COVER_WIDTH = 960
const COVER_HEIGHT = 540

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { URL.revokeObjectURL(url); resolve(image) }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('goal-cover-invalid')) }
    image.src = url
  })
}

function canvasBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('goal-cover-compression')),
    'image/webp',
    0.8,
  ))
}

export async function prepareGoalCover(file) {
  if (!file?.type?.startsWith('image/') || file.size > MAX_SOURCE_BYTES) throw new Error('goal-cover-invalid')
  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = COVER_WIDTH
  canvas.height = COVER_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('goal-cover-compression')
  const scale = Math.max(COVER_WIDTH / image.naturalWidth, COVER_HEIGHT / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  context.drawImage(image, (COVER_WIDTH - width) / 2, (COVER_HEIGHT - height) / 2, width, height)
  return canvasBlob(canvas)
}

export async function uploadGoalCover(uid, goalId, file) {
  const blob = await prepareGoalCover(file)
  const path = `users/${uid}/jsave/goals/${goalId}/cover.webp`
  const coverRef = ref(storage, path)
  await uploadBytes(coverRef, blob, { contentType: 'image/webp', cacheControl: 'private,max-age=86400' })
  return { coverPath: path, coverUrl: await getDownloadURL(coverRef) }
}

export async function deleteGoalCover(path) {
  if (!path) return
  try {
    await deleteObject(ref(storage, path))
  } catch (error) {
    if (error?.code !== 'storage/object-not-found') throw error
  }
}
