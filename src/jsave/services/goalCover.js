import { httpsCallable } from 'firebase/functions'
import { functions } from '../../lib/firebase'

export const MAX_COVER_SOURCE_MB = 30
const MAX_SOURCE_BYTES = MAX_COVER_SOURCE_MB * 1024 * 1024
const MAX_OUTPUT_BYTES = 850 * 1024
const COVER_WIDTH = 960
const COVER_HEIGHT = 540
const CLOUDINARY_CLOUD = 'db2ixn8zh'
const CLOUDINARY_PRESET = 'H-Agency'

export function validateCoverSource(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('cover-invalid')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('cover-too-large')
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { URL.revokeObjectURL(url); resolve(image) }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('cover-invalid')) }
    image.src = url
  })
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('cover-compression')),
    type,
    quality,
  ))
}

export async function prepareGoalCover(file) {
  validateCoverSource(file)
  const image = await loadImage(file)
  const widths = [COVER_WIDTH, 840, 720]
  const qualities = [0.82, 0.7, 0.58, 0.46]

  for (const outputWidth of widths) {
    const outputHeight = Math.round(outputWidth * COVER_HEIGHT / COVER_WIDTH)
    const canvas = document.createElement('canvas')
    canvas.width = outputWidth
    canvas.height = outputHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('cover-compression')
    const scale = Math.max(outputWidth / image.naturalWidth, outputHeight / image.naturalHeight)
    const width = image.naturalWidth * scale
    const height = image.naturalHeight * scale
    context.drawImage(image, (outputWidth - width) / 2, (outputHeight - height) / 2, width, height)

    for (const quality of qualities) {
      let blob = await canvasBlob(canvas, 'image/webp', quality)
      if (blob.type !== 'image/webp') blob = await canvasBlob(canvas, 'image/jpeg', quality)
      if (blob.size <= MAX_OUTPUT_BYTES) return blob
    }
  }

  throw new Error('cover-output-too-large')
}

export async function uploadPreparedCover(uid, collection, recordId, blob) {
  const folder = `jsave/${uid}/${collection}/${recordId}`
  const form = new FormData()
  form.append('file', blob, 'cover.webp')
  form.append('upload_preset', CLOUDINARY_PRESET)
  form.append('folder', folder)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: form,
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.secure_url || !result.public_id) {
    const error = new Error('cover-upload')
    error.detail = result?.error?.message
    throw error
  }

  return { coverPath: result.public_id, coverUrl: result.secure_url }
}

async function uploadCover(uid, collection, recordId, file) {
  return uploadPreparedCover(uid, collection, recordId, await prepareGoalCover(file))
}

export function uploadGoalCover(uid, goalId, file) {
  return uploadCover(uid, 'goals', goalId, file)
}

export function uploadItemCover(uid, itemId, file) {
  return uploadCover(uid, 'items', itemId, file)
}

export async function deleteGoalCover(path) {
  if (!path) return
  try {
    if (!path.startsWith('jsave/')) return
    const removeImage = httpsCallable(functions, 'deleteCloudinaryImage')
    await removeImage({ publicId: path })
  } catch (error) {
    console.warn('Cloudinary cover cleanup failed:', error?.message)
  }
}

export const deleteItemCover = deleteGoalCover
