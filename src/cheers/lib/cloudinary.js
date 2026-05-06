const CLOUD = 'db2ixn8zh'
const PRESET = 'H-Agency'

async function upload(file, folder, resourceType = 'image') {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', PRESET)
  form.append('folder', folder)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/${resourceType}/upload`, {
    method: 'POST', body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Upload failed')
  }
  return (await res.json()).secure_url
}

export function uploadProductImage(file) {
  return upload(file, 'cheers/products')
}

export function uploadPaymentQr(file) {
  return upload(file, 'cheers/settings')
}

export function uploadProductMedia(file) {
  return upload(file, 'cheers/products', 'auto')
}
