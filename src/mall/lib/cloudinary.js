import { getFunctions, httpsCallable } from 'firebase/functions'

const CLOUD  = 'db2ixn8zh'
const PRESET = 'H-Agency'

/**
 * Upload an image file to Cloudinary.
 * @param {File}   file    - the file to upload
 * @param {string} folder  - e.g. 'mall/products' | 'mall/content'
 * @returns {Promise<string>} secure_url
 */
export async function uploadToCloudinary(file, folder = 'mall') {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', PRESET)
  form.append('folder', folder)
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
    { method: 'POST', body: form }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Upload failed')
  }
  return (await res.json()).secure_url
}

/**
 * Extract the Cloudinary public_id from a secure_url.
 * e.g. https://res.cloudinary.com/db2ixn8zh/image/upload/v1234/mall/products/abc.jpg
 *   → mall/products/abc
 */
export function extractPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^/.]+)?$/)
  return match ? match[1] : null
}

/**
 * Delete an image from Cloudinary via Firebase Cloud Function.
 * Silently ignores non-Cloudinary URLs or failures.
 * @param {string} url - Cloudinary secure_url
 */
export async function deleteFromCloudinary(url) {
  const publicId = extractPublicId(url)
  if (!publicId) return
  try {
    const fns = getFunctions()
    const deleteFn = httpsCallable(fns, 'deleteCloudinaryImage')
    await deleteFn({ publicId })
  } catch (err) {
    console.warn('Cloudinary delete failed (non-fatal):', err.message)
  }
}
