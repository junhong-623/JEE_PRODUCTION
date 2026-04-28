import { useState, useEffect, useRef } from 'react'
import { onProducts, onCategories, addProduct, updateProduct, deleteProduct } from '../services/firestore'
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary'

function getYouTubeId(url) {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

const emptyProduct = {
  name:'', nameZh:'', categoryId:'', description:'', descriptionZh:'',
  images:[], price:'', originalPrice:'',
  onSale:false, promoLabel:'',
  variants:{ sizes:'', designs:'' },
  visible:true, order:0,
  content:[],
}

export default function ProductsPage() {
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [filterCat, setFilterCat]   = useState('all')
  const [modal, setModal]           = useState(null)
  const [form, setForm]             = useState(emptyProduct)
  const [saving, setSaving]         = useState(false)
  const [msg, setMsg]               = useState('')
  const [uploading, setUploading]   = useState(false)          // cover image upload
  const [blockUploading, setBlockUploading] = useState({})     // { [blockIndex]: true/false }
  const coverFileRef  = useRef()
  const blockFileRefs = useRef({})   // { [blockIndex]: <input ref> }

  useEffect(() => {
    const u1 = onProducts(setProducts)
    const u2 = onCategories(setCategories)
    return () => { u1(); u2() }
  }, [])

  const visible = filterCat === 'all' ? products : products.filter(p => p.categoryId === filterCat)

  function openAdd() {
    setForm({ ...emptyProduct, order: products.length, variants: { sizes:'', designs:'' } })
    setModal('add')
  }
  function openEdit(p) {
    setForm({
      name: p.name||'', nameZh: p.nameZh||'',
      categoryId: p.categoryId||'',
      description: p.description||'', descriptionZh: p.descriptionZh||'',
      images: p.images||[],
      price: p.price||'', originalPrice: p.originalPrice||'',
      onSale: !!p.onSale, promoLabel: p.promoLabel||'',
      variants: {
        sizes: (p.variants?.sizes||[]).join(', '),
        designs: (p.variants?.designs||[]).join(', '),
      },
      visible: p.visible!==false, order: p.order||0,
      content: p.content || [],
    })
    setBlockUploading({})
    setModal(p)
  }

  function formToDoc() {
    return {
      name: form.name.trim(),
      nameZh: form.nameZh.trim(),
      categoryId: form.categoryId,
      description: form.description.trim(),
      descriptionZh: form.descriptionZh.trim(),
      images: form.images.filter(Boolean),
      price: parseFloat(form.price) || 0,
      originalPrice: parseFloat(form.originalPrice) || parseFloat(form.price) || 0,
      onSale: form.onSale,
      promoLabel: form.promoLabel.trim(),
      variants: {
        sizes: form.variants.sizes.split(',').map(s=>s.trim()).filter(Boolean),
        designs: form.variants.designs.split(',').map(s=>s.trim()).filter(Boolean),
      },
      visible: form.visible,
      order: Number(form.order),
      content: form.content,
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (modal === 'add') await addProduct(formToDoc())
      else await updateProduct(modal.id, formToDoc())
      setMsg('Saved ✓'); setModal(null)
    } catch(e) { setMsg('Error: ' + e.message) }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000) }
  }

  async function handleDelete(p) {
    if (!confirm(`Delete "${p.name}"?`)) return
    await deleteProduct(p.id)
    // Delete all associated Cloudinary images
    const allImages = [
      ...(p.images || []),
      ...(p.content || []).filter(b => b.type === 'image').map(b => b.value),
    ]
    allImages.forEach(url => deleteFromCloudinary(url))
  }

  // ── Cover image upload ────────────────────────────────────────────────────
  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file, 'mall/products')
      setForm(prev => ({ ...prev, images: [...prev.images, url] }))
    } catch(e) { alert('Upload failed: ' + e.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  function removeImage(i) {
    const url = form.images[i]
    deleteFromCloudinary(url)
    setForm(prev => ({ ...prev, images: prev.images.filter((_,idx) => idx!==i) }))
  }

  // ── Content blocks ────────────────────────────────────────────────────────
  function addContentBlock(type) {
    setForm(prev => ({ ...prev, content: [...prev.content, { type, value:'', label:'' }] }))
  }
  function updateBlock(i, val) {
    setForm(prev => ({ ...prev, content: prev.content.map((b,idx) => idx===i ? { ...b, value:val } : b) }))
  }
  function updateBlockLabel(i, label) {
    setForm(prev => ({ ...prev, content: prev.content.map((b,idx) => idx===i ? { ...b, label } : b) }))
  }
  function removeBlock(i) {
    const block = form.content[i]
    if (block?.type === 'image') deleteFromCloudinary(block.value)
    setForm(prev => ({ ...prev, content: prev.content.filter((_,idx) => idx!==i) }))
    setBlockUploading(prev => { const n={...prev}; delete n[i]; return n })
  }

  async function handleBlockImageUpload(blockIndex, e) {
    const file = e.target.files?.[0]; if (!file) return
    setBlockUploading(prev => ({ ...prev, [blockIndex]: true }))
    try {
      const url = await uploadToCloudinary(file, 'mall/content')
      updateBlock(blockIndex, url)
    } catch(e) { alert('Upload failed: ' + e.message) }
    finally {
      setBlockUploading(prev => ({ ...prev, [blockIndex]: false }))
      e.target.value = ''
    }
  }

  const f  = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const fv = (k, v) => setForm(p => ({ ...p, variants: { ...p.variants, [k]: v } }))
  const catName = id => categories.find(c => c.id === id)?.name || ''

  return (
    <div style={{ padding:24, maxWidth:1000 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
        <h1 style={{ fontSize:22,fontWeight:900,color:'#0d0d0d' }}>Products</h1>
        <button onClick={openAdd} style={Btn.primary}>+ Add Product</button>
      </div>

      {/* Category filter */}
      <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' }}>
        <Chip active={filterCat==='all'} onClick={() => setFilterCat('all')}>All</Chip>
        {categories.map(c => (
          <Chip key={c.id} active={filterCat===c.id} onClick={() => setFilterCat(c.id)}>{c.image} {c.name}</Chip>
        ))}
      </div>

      {msg && <div style={{ background:'#d1fae5',color:'#065f46',borderRadius:8,padding:'8px 14px',marginBottom:14,fontSize:13 }}>{msg}</div>}

      <div style={{ background:'white',borderRadius:12,boxShadow:'0 2px 8px rgba(13,13,13,0.08)',overflow:'hidden' }}>
        {visible.length === 0 ? (
          <div style={{ padding:40,textAlign:'center',color:'#6b6b6b' }}>No products yet. Add one!</div>
        ) : visible.map(p => (
          <div key={p.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 18px',borderBottom:'1px solid #e0ddd7' }}>
            {p.images?.[0]
              ? <img src={p.images[0]} alt="" style={{ width:52,height:52,borderRadius:9,objectFit:'cover',flexShrink:0 }} />
              : <div style={{ width:52,height:52,borderRadius:9,background:'#f7f5f0',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>🛍️</div>}
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontWeight:700,color:'#0d0d0d',fontSize:14 }}>{p.name}</div>
              <div style={{ fontSize:11,color:'#6b6b6b' }}>{catName(p.categoryId)} · {p.images?.length||0} photos</div>
              {p.onSale && <span style={{ fontSize:10,background:'#e8440a',color:'white',padding:'1px 7px',borderRadius:8,fontWeight:700 }}>{p.promoLabel||'SALE'}</span>}
            </div>
            <div style={{ textAlign:'right',flexShrink:0 }}>
              <div style={{ fontWeight:900,color:'#e8440a',fontSize:14 }}>RM {Number(p.price).toFixed(2)}</div>
              {p.onSale && p.originalPrice > p.price && (
                <div style={{ fontSize:11,color:'#6b6b6b',textDecoration:'line-through' }}>RM {Number(p.originalPrice).toFixed(2)}</div>
              )}
            </div>
            <span style={{ fontSize:11,color: p.visible!==false?'#065f46':'#991b1b', background: p.visible!==false?'#d1fae5':'#fee2e2',padding:'2px 8px',borderRadius:8,fontWeight:700,flexShrink:0 }}>
              {p.visible!==false ? 'On' : 'Off'}
            </span>
            <div style={{ display:'flex',gap:6,flexShrink:0 }}>
              <button onClick={() => openEdit(p)} style={Btn.sm}>✏️</button>
              <button onClick={() => handleDelete(p)} style={Btn.smDanger}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <Modal title={modal === 'add' ? 'Add Product' : 'Edit Product'} onClose={() => setModal(null)}>

          {/* Basic info */}
          <Section title="Basic Info">
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <Field label="Name (EN) *">
                <input style={Input} value={form.name} onChange={e => f('name',e.target.value)} placeholder="Product name" />
              </Field>
              <Field label="Name (中文)">
                <input style={Input} value={form.nameZh} onChange={e => f('nameZh',e.target.value)} placeholder="产品名称（选填）" />
              </Field>
            </div>
            <Field label="Category">
              <select style={Input} value={form.categoryId} onChange={e => f('categoryId',e.target.value)}>
                <option value="">— No category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.image} {c.name}</option>)}
              </select>
            </Field>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <Field label="Description (EN)">
                <textarea style={{ ...Input,minHeight:70,resize:'vertical' }} value={form.description} onChange={e => f('description',e.target.value)} placeholder="Brief description" />
              </Field>
              <Field label="Description (中文)">
                <textarea style={{ ...Input,minHeight:70,resize:'vertical' }} value={form.descriptionZh} onChange={e => f('descriptionZh',e.target.value)} placeholder="简短介绍（选填）" />
              </Field>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <Field label="Price (RM) *">
                <input style={Input} type="number" step="0.01" value={form.price} onChange={e => f('price',e.target.value)} />
              </Field>
              <Field label="Original Price (RM)">
                <input style={Input} type="number" step="0.01" value={form.originalPrice} onChange={e => f('originalPrice',e.target.value)} placeholder="Before discount" />
              </Field>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:16,marginTop:4 }}>
              <label style={{ display:'flex',gap:6,alignItems:'center',fontSize:13,cursor:'pointer',color:'#0d0d0d' }}>
                <input type="checkbox" checked={form.onSale} onChange={e => f('onSale',e.target.checked)} />
                On Sale
              </label>
              {form.onSale && (
                <input style={{ ...Input,width:140 }} value={form.promoLabel} onChange={e => f('promoLabel',e.target.value)} placeholder="Label e.g. -20%" />
              )}
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:8 }}>
              <Field label="Sort Order">
                <input style={Input} type="number" value={form.order} onChange={e => f('order',e.target.value)} />
              </Field>
              <Field label="&nbsp;">
                <label style={{ display:'flex',gap:6,alignItems:'center',fontSize:13,cursor:'pointer',marginTop:6,color:'#0d0d0d' }}>
                  <input type="checkbox" checked={form.visible} onChange={e => f('visible',e.target.checked)} />
                  Visible to customers
                </label>
              </Field>
            </div>
          </Section>

          {/* Variants */}
          <Section title="Variants">
            <Field label="Sizes (comma-separated)">
              <input style={Input} value={form.variants.sizes} onChange={e => fv('sizes',e.target.value)} placeholder="e.g. S, M, L, XL" />
            </Field>
            <Field label="Designs / Colors (comma-separated)">
              <input style={Input} value={form.variants.designs} onChange={e => fv('designs',e.target.value)} placeholder="e.g. Black, White, Red" />
            </Field>
          </Section>

          {/* Cover Images */}
          <Section title="Cover Images">
            <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginBottom:10 }}>
              {form.images.map((img,i) => (
                <div key={i} style={{ position:'relative' }}>
                  <img src={img} alt="" style={{ width:80,height:80,objectFit:'cover',borderRadius:10,border:'2px solid #e0ddd7' }} />
                  {i === 0 && (
                    <span style={{ position:'absolute',bottom:0,left:0,right:0,background:'rgba(232,68,10,0.85)',color:'white',fontSize:9,fontWeight:700,textAlign:'center',borderRadius:'0 0 8px 8px',padding:'2px 0' }}>COVER</span>
                  )}
                  <button onClick={() => removeImage(i)} style={{ position:'absolute',top:-6,right:-6,width:20,height:20,borderRadius:'50%',background:'#dc2626',color:'white',border:'2px solid white',cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
                </div>
              ))}

              {/* Upload new cover image tile */}
              <div>
                <input type="file" accept="image/*" ref={coverFileRef} style={{ display:'none' }} onChange={handleCoverUpload} />
                <button
                  onClick={() => coverFileRef.current.click()}
                  disabled={uploading}
                  style={{ width:80,height:80,borderRadius:10,border:'2px dashed #e0ddd7',background:'#f7f5f0',color:'#6b6b6b',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,fontSize:11,fontWeight:600 }}
                >
                  {uploading ? <Spinner /> : <>📷<span>Upload</span></>}
                </button>
              </div>
            </div>
            <p style={{ fontSize:11,color:'#6b6b6b',margin:0 }}>First image = cover photo · You can also paste a URL below and press Enter.</p>
            <input
              style={{ ...Input,marginTop:8 }}
              placeholder="Paste image URL and press Enter"
              onKeyDown={e => {
                if (e.key==='Enter' && e.target.value.trim()) {
                  setForm(prev => ({ ...prev, images:[...prev.images, e.target.value.trim()] }))
                  e.target.value=''
                  e.preventDefault()
                }
              }}
            />
          </Section>

          {/* Product Description (Rich Content) */}
          <Section title="Product Description Blocks">
            <p style={{ fontSize:11,color:'#6b6b6b',marginTop:-6,marginBottom:10 }}>
              Build a rich product page with text, images, links and YouTube videos.
            </p>

            {form.content.map((block, i) => (
              <div key={i} style={{ marginBottom:10,background:'#f7f5f0',borderRadius:10,padding:12,border:'1px solid #e0ddd7' }}>
                {/* Block header */}
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                  <span style={{ fontSize:10,fontWeight:800,color:'#e8440a',textTransform:'uppercase',letterSpacing:1,background:'rgba(232,68,10,0.1)',padding:'2px 8px',borderRadius:6 }}>
                    { block.type === 'text'    ? '📝 Text'
                    : block.type === 'image'   ? '🖼 Image'
                    : block.type === 'link'    ? '🔗 Link'
                    : block.type === 'youtube' ? '▶️ YouTube'
                    : block.type }
                  </span>
                  <button onClick={() => removeBlock(i)} style={{ color:'#dc2626',background:'#fee2e2',border:'none',borderRadius:6,cursor:'pointer',fontSize:12,padding:'2px 8px',fontWeight:600 }}>Remove</button>
                </div>

                {block.type === 'text' && (
                  <textarea
                    style={{ ...Input,minHeight:90,resize:'vertical' }}
                    value={block.value}
                    onChange={e => updateBlock(i, e.target.value)}
                    placeholder="Enter description text..."
                  />
                )}

                {block.type === 'image' && (
                  <div>
                    {block.value && (
                      <div style={{ marginBottom:8,position:'relative',display:'inline-block' }}>
                        <img src={block.value} alt="" style={{ maxWidth:'100%',maxHeight:200,borderRadius:8,objectFit:'cover',border:'1px solid #e0ddd7' }} />
                        <button onClick={() => { deleteFromCloudinary(block.value); updateBlock(i, '') }} style={{ position:'absolute',top:-6,right:-6,width:20,height:20,borderRadius:'50%',background:'#dc2626',color:'white',border:'2px solid white',cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
                      </div>
                    )}
                    <div style={{ display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' }}>
                      <input type="file" accept="image/*" ref={el => blockFileRefs.current[i] = el} style={{ display:'none' }} onChange={e => handleBlockImageUpload(i, e)} />
                      <button onClick={() => blockFileRefs.current[i]?.click()} disabled={blockUploading[i]} style={{ ...Btn.primary,fontSize:12,padding:'7px 14px',display:'flex',alignItems:'center',gap:6 }}>
                        {blockUploading[i] ? <><Spinner /> Uploading...</> : '📷 Upload Image'}
                      </button>
                      <span style={{ fontSize:11,color:'#6b6b6b' }}>or</span>
                      <input style={{ ...Input,flex:1,minWidth:160 }} value={block.value} onChange={e => updateBlock(i, e.target.value)} placeholder="Paste image URL" />
                    </div>
                  </div>
                )}

                {block.type === 'link' && (
                  <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                    <input
                      style={Input}
                      value={block.label || ''}
                      onChange={e => updateBlockLabel(i, e.target.value)}
                      placeholder="Display text (e.g. View size guide)"
                    />
                    <input
                      style={Input}
                      value={block.value}
                      onChange={e => updateBlock(i, e.target.value)}
                      placeholder="URL (e.g. https://example.com)"
                      type="url"
                    />
                  </div>
                )}

                {block.type === 'youtube' && (
                  <div>
                    <input
                      style={{ ...Input,marginBottom:8 }}
                      value={block.value}
                      onChange={e => updateBlock(i, e.target.value)}
                      placeholder="YouTube URL (e.g. https://youtu.be/abc123)"
                    />
                    {block.value && getYouTubeId(block.value) && (
                      <div style={{ fontSize:11,color:'#065f46',background:'#d1fae5',padding:'4px 10px',borderRadius:6,display:'inline-block' }}>
                        ✓ Video ID: {getYouTubeId(block.value)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div style={{ display:'flex',gap:8,marginTop:4,flexWrap:'wrap' }}>
              <button onClick={() => addContentBlock('text')}    style={{ ...Btn.ghost,fontSize:12,padding:'8px 14px' }}>+ Text</button>
              <button onClick={() => addContentBlock('image')}   style={{ ...Btn.ghost,fontSize:12,padding:'8px 14px' }}>+ Image</button>
              <button onClick={() => addContentBlock('link')}    style={{ ...Btn.ghost,fontSize:12,padding:'8px 14px' }}>+ Link</button>
              <button onClick={() => addContentBlock('youtube')} style={{ ...Btn.ghost,fontSize:12,padding:'8px 14px' }}>+ YouTube</button>
            </div>
          </Section>

          <div style={{ display:'flex',gap:8,marginTop:20,paddingTop:16,borderTop:'1px solid #e0ddd7' }}>
            <button onClick={handleSave} disabled={saving} style={Btn.primary}>{saving ? 'Saving...' : 'Save Product'}</button>
            <button onClick={() => setModal(null)} style={Btn.ghost}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span style={{
      display:'inline-block',width:14,height:14,borderRadius:'50%',
      border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',
      animation:'spin 0.7s linear infinite',flexShrink:0,
    }} />
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontSize:11,fontWeight:800,color:'#e8440a',textTransform:'uppercase',letterSpacing:1,marginBottom:10,paddingBottom:6,borderBottom:'1px solid #e0ddd7' }}>{title}</div>
      {children}
    </div>
  )
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:10 }}>
      <label style={{ fontSize:11,fontWeight:700,color:'#3a3a3a',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5 }} dangerouslySetInnerHTML={{ __html:label }} />
      {children}
    </div>
  )
}
function Modal({ title, onClose, children }) {
  return (
    <>
      <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:200 }} onClick={onClose} />
      <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'white',color:'#0d0d0d',borderRadius:18,padding:28,width:'min(600px,96vw)',zIndex:201,maxHeight:'92vh',overflowY:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <h2 style={{ fontSize:18,fontWeight:800,color:'#0d0d0d',margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ width:32,height:32,borderRadius:'50%',background:'#f7f5f0',border:'1px solid #e0ddd7',color:'#6b6b6b',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
        </div>
        {children}
      </div>
    </>
  )
}
function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding:'5px 14px',borderRadius:16,fontSize:12,fontWeight:600,border:`1.5px solid ${active?'#e8440a':'#e0ddd7'}`,background:active?'#e8440a':'white',color:active?'white':'#3a3a3a',cursor:'pointer',transition:'all 0.12s' }}>
      {children}
    </button>
  )
}

const Input = { width:'100%',padding:'9px 12px',border:'1.5px solid #e0ddd7',borderRadius:9,fontSize:13,background:'#f7f5f0',outline:'none',color:'#0d0d0d',fontFamily:"'DM Sans',sans-serif",boxSizing:'border-box' }
const Btn = {
  primary:  { background:'#e8440a',color:'white',border:'none',borderRadius:9,padding:'9px 18px',fontSize:13,fontWeight:700,cursor:'pointer' },
  ghost:    { background:'white',color:'#3a3a3a',border:'1.5px solid #e0ddd7',borderRadius:9,padding:'9px 18px',fontSize:13,fontWeight:600,cursor:'pointer' },
  sm:       { background:'#f7f5f0',color:'#0d0d0d',border:'1px solid #e0ddd7',borderRadius:7,padding:'5px 9px',fontSize:13,cursor:'pointer' },
  smDanger: { background:'#fee2e2',color:'#dc2626',border:'1px solid #fca5a5',borderRadius:7,padding:'5px 9px',fontSize:13,cursor:'pointer' },
}
