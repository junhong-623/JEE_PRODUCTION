import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../../lib/firebase'

export const MAX_COVER_SOURCE_MB = 30
const MAX_SOURCE_BYTES = MAX_COVER_SOURCE_MB * 1024 * 1024
const MAX_OUTPUT_BYTES = 850 * 1024
const COVER_WIDTH = 960
const COVER_HEIGHT = 540

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

async function uploadCover(uid, collection, recordId, file) {
  const blob = await prepareGoalCover(file)
  const path = `users/${uid}/jsave/${collection}/${recordId}/cover.webp`
  const coverRef = ref(storage, path)
  await uploadBytes(coverRef, blob, { contentType: blob.type, cacheControl: 'private,max-age=86400' })
  return { coverPath: path, coverUrl: await getDownloadURL(coverRef) }
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
    await deleteObject(ref(storage, path))
  } catch (error) {
    if (error?.code !== 'storage/object-not-found') throw error
  }
}

export const deleteItemCover = deleteGoalCover
