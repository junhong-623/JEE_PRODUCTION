import { useState, useEffect } from 'react'
import { getMallConfig, saveMallConfig } from '../services/firestore'

export default function SettingsPage() {
  const [form, setForm] = useState({ storeName:'', tagline:'', whatsapp:'', email:'' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { getMallConfig().then(setForm) }, [])

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveMallConfig(form)
      setMsg('Settings saved ✓')
    } catch(e) { setMsg('Error: ' + e.message) }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000) }
  }

  return (
    <div style={{ padding:24, maxWidth:560 }}>
      <h1 style={{ fontSize:22,fontWeight:900,color:'#0d0d0d',marginBottom:4 }}>Settings</h1>
      <p style={{ fontSize:13,color:'#6b6b6b',marginBottom:24 }}>Configure your store details and contact options.</p>

      <form onSubmit={handleSave}>
        <Card title="Store Info">
          <Field label="Store Name">
            <input style={Input} value={form.storeName||''} onChange={e => f('storeName',e.target.value)} placeholder="JeeProd Mall" />
          </Field>
          <Field label="Tagline">
            <input style={Input} value={form.tagline||''} onChange={e => f('tagline',e.target.value)} placeholder="jeeprod.com" />
          </Field>
        </Card>

        <Card title="Contact / Order Channels">
          <Field label="WhatsApp Number" hint="Include country code, no + or spaces. e.g. 60126947823">
            <input style={Input} value={form.whatsapp||''} onChange={e => f('whatsapp',e.target.value)} placeholder="60126947823" />
            {form.whatsapp && (
              <a href={`https://wa.me/${form.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11,color:'#e8440a',marginTop:4,display:'inline-block' }}>
                Test link →
              </a>
            )}
          </Field>
          <Field label="Email Address">
            <input style={Input} type="email" value={form.email||''} onChange={e => f('email',e.target.value)} placeholder="your@email.com" />
          </Field>
        </Card>

        {msg && <div style={{ background:'#d1fae5',color:'#065f46',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,fontWeight:600 }}>{msg}</div>}

        <button type="submit" disabled={saving} style={{ background:'#e8440a',color:'white',border:'none',borderRadius:10,padding:'12px 28px',fontSize:14,fontWeight:700,cursor:'pointer' }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{ background:'white',borderRadius:12,padding:'18px 20px',marginBottom:16,boxShadow:'0 2px 8px rgba(13,13,13,0.08)' }}>
      <div style={{ fontSize:11,fontWeight:800,color:'#e8440a',textTransform:'uppercase',letterSpacing:1,marginBottom:14,paddingBottom:10,borderBottom:'1px solid #e0d8c8' }}>{title}</div>
      {children}
    </div>
  )
}
function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:11,fontWeight:700,color:'#3a3a3a',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:0.6 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize:10,color:'#6b6b6b',marginTop:3 }}>{hint}</div>}
    </div>
  )
}

const Input = { width:'100%',padding:'9px 12px',border:'1.5px solid #e0ddd7',borderRadius:9,fontSize:14,background:'#ece9e2',outline:'none',color:'#0d0d0d',fontFamily:'inherit' }
