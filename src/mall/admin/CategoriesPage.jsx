import { useState, useEffect } from 'react'
import { onCategories, addCategory, updateCategory, deleteCategory } from '../services/firestore'

const empty = { name:'', image:'', order:0, visible:true, promoLabel:'', promoColor:'#e06820' }

export default function CategoriesPage() {
  const [cats, setCats] = useState([])
  const [modal, setModal] = useState(null) // null | 'add' | category object
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { return onCategories(setCats) }, [])

  function openAdd() { setForm({ ...empty, order: cats.length }); setModal('add') }
  function openEdit(cat) { setForm({ name:cat.name||'',image:cat.image||'',order:cat.order||0,visible:cat.visible!==false,promoLabel:cat.promoLabel||'',promoColor:cat.promoColor||'#e06820' }); setModal(cat) }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (modal === 'add') {
        await addCategory({ ...form, order: Number(form.order) })
      } else {
        await updateCategory(modal.id, { ...form, order: Number(form.order) })
      }
      setMsg('Saved ✓'); setModal(null)
    } catch(e) { setMsg('Error: ' + e.message) }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000) }
  }

  async function handleDelete(cat) {
    if (!confirm(`Delete "${cat.name}"?`)) return
    await deleteCategory(cat.id)
  }

  async function toggleVisible(cat) {
    await updateCategory(cat.id, { visible: cat.visible === false })
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{ padding:24, maxWidth:800 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
        <h1 style={{ fontSize:22,fontWeight:900,color:'#0d0d0d' }}>Categories</h1>
        <button onClick={openAdd} style={Btn.primary}>+ Add Category</button>
      </div>

      {msg && <div style={{ background:'#d1fae5',color:'#065f46',borderRadius:8,padding:'8px 14px',marginBottom:14,fontSize:13 }}>{msg}</div>}

      <div style={{ background:'white',borderRadius:12,boxShadow:'0 2px 8px rgba(13,13,13,0.08)',overflow:'hidden' }}>
        {cats.length === 0 ? (
          <div style={{ padding:40,textAlign:'center',color:'#6b6b6b' }}>No categories yet. Add one!</div>
        ) : cats.map(cat => (
          <div key={cat.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 18px',borderBottom:'1px solid #e0d8c8' }}>
            <span style={{ fontSize:24,width:32,textAlign:'center' }}>{cat.image || '🗂️'}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700,color:'#0d0d0d',fontSize:14 }}>{cat.name}</div>
              {cat.promoLabel && <span style={{ fontSize:10,background:'#e06820',color:'white',padding:'1px 7px',borderRadius:8,fontWeight:700 }}>{cat.promoLabel}</span>}
            </div>
            <span style={{ fontSize:11,color: cat.visible!==false ? '#065f46':'#991b1b', background: cat.visible!==false ? '#d1fae5':'#fee2e2',padding:'2px 8px',borderRadius:8,fontWeight:700 }}>
              {cat.visible!==false ? 'Visible' : 'Hidden'}
            </span>
            <div style={{ display:'flex',gap:6 }}>
              <button onClick={() => toggleVisible(cat)} style={Btn.sm}>👁</button>
              <button onClick={() => openEdit(cat)} style={Btn.sm}>✏️</button>
              <button onClick={() => handleDelete(cat)} style={Btn.smDanger}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Add Category' : 'Edit Category'} onClose={() => setModal(null)}>
          <Field label="Name *">
            <input style={Input} value={form.name} onChange={e => f('name',e.target.value)} placeholder="e.g. Tents" />
          </Field>
          <Field label="Icon / Emoji">
            <input style={Input} value={form.image} onChange={e => f('image',e.target.value)} placeholder="e.g. ⛺" />
          </Field>
          <Field label="Sort Order">
            <input style={Input} type="number" value={form.order} onChange={e => f('order',e.target.value)} />
          </Field>
          <Field label="Promo Label (optional)">
            <input style={Input} value={form.promoLabel} onChange={e => f('promoLabel',e.target.value)} placeholder="e.g. SALE" />
          </Field>
          <label style={{ display:'flex',alignItems:'center',gap:8,fontSize:13,marginTop:8,cursor:'pointer' }}>
            <input type="checkbox" checked={form.visible} onChange={e => f('visible',e.target.checked)} />
            Visible to customers
          </label>
          <div style={{ display:'flex',gap:8,marginTop:20 }}>
            <button onClick={handleSave} disabled={saving} style={Btn.primary}>{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setModal(null)} style={Btn.ghost}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:11,fontWeight:700,color:'#3a3a3a',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:0.6 }}>{label}</label>
      {children}
    </div>
  )
}
function Modal({ title, onClose, children }) {
  return (
    <>
      <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:200 }} onClick={onClose} />
      <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'white',color:'#0d0d0d',borderRadius:16,padding:24,width:'min(460px,95vw)',zIndex:201,maxHeight:'90vh',overflowY:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:18 }}>
          <h2 style={{ fontSize:17,fontWeight:800,color:'#0d0d0d' }}>{title}</h2>
          <button onClick={onClose} style={{ fontSize:18,color:'#6b6b6b',background:'none',border:'none',cursor:'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </>
  )
}

const Input = { width:'100%',padding:'9px 12px',border:'1.5px solid #e0ddd7',borderRadius:9,fontSize:14,background:'#ece9e2',outline:'none',color:'#0d0d0d',fontFamily:'inherit' }
const Btn = {
  primary: { background:'#e8440a',color:'white',border:'none',borderRadius:9,padding:'9px 18px',fontSize:13,fontWeight:700,cursor:'pointer' },
  ghost:   { background:'#f7f5f0',color:'#3a3a3a',border:'1.5px solid #e0ddd7',borderRadius:9,padding:'9px 18px',fontSize:13,fontWeight:600,cursor:'pointer' },
  sm:      { background:'#f7f5f0',border:'1px solid #e0ddd7',borderRadius:7,padding:'5px 8px',fontSize:13,cursor:'pointer' },
  smDanger:{ background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:7,padding:'5px 8px',fontSize:13,cursor:'pointer' },
}
