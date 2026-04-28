const CLOUD = 'db2ixn8zh'
const PRESET = 'H-Agency'

export async function uploadNodeImage(file) {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', PRESET)
  form.append('folder', 'flowchart/nodes')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST', body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Upload failed')
  }
  return (await res.json()).secure_url
}
