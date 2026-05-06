import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'
import app from '../../lib/firebase'
import { useLang } from '../contexts/LangContext'

const db = getFirestore(app)

export default function PaymentPage() {
  const { orderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const state = location.state || {}

  const [settings, setSettings] = useState(null)
  const [order, setOrder] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const [settingsSnap, orderSnap] = await Promise.all([
        getDoc(doc(db, 'cheers_settings', 'global')),
        getDoc(doc(db, 'cheers_orders', orderId)),
      ])
      if (settingsSnap.exists()) setSettings(settingsSnap.data())
      if (orderSnap.exists()) {
        const o = { id: orderSnap.id, ...orderSnap.data() }
        setOrder(o)
        if (o.paymentSubmitted) setSubmitted(true)
      }
    }
    load()
  }, [orderId])

  if (!settings || !order) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-cheers-brown border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const total = order.total
  const isDeposit = settings.paymentMode === 'deposit'
  const payAmount = isDeposit ? (settings.depositAmount || total) : total

  const displayOrderId = order.orderId || orderId

  function buildWhatsAppLink() {
    const msg = encodeURIComponent(
      `${lang === 'zh' ? '您好！我的订单号是' : 'Hi! My order ID is'} ${displayOrderId}\n${lang === 'zh' ? '付款金额：' : 'Amount paid: '}RM ${payAmount.toFixed(2)}`
    )
    return `https://wa.me/${settings.whatsappNumber?.replace(/\D/g, '')}?text=${msg}`
  }

  async function handleSubmitPayment() {
    setSubmitting(true)
    await updateDoc(doc(db, 'cheers_orders', orderId), { paymentSubmitted: true })
    setSubmitted(true)
    setSubmitting(false)
  }

  function buildTelegramLink() {
    const base = settings.telegramLink?.startsWith('http') ? settings.telegramLink : `https://t.me/${settings.telegramLink}`
    return base
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">💳</div>
        <h1 className="font-serif text-2xl text-cheers-dark-brown">{t('payment.title')}</h1>
        <p className="text-sm text-cheers-brown/60 mt-1">
          {t('payment.orderId')}: <span className="font-medium text-cheers-brown">{displayOrderId}</span>
        </p>
      </div>

      <div className="card p-6 space-y-6">
        {/* Amount */}
        <div className="text-center bg-cheers-cream/40 rounded-xl py-4">
          <p className="text-sm text-cheers-brown/60 mb-1">
            {isDeposit ? t('payment.depositNote') : t('payment.fullNote')}
          </p>
          <p className="text-3xl font-bold text-cheers-brown">
            {t('common.rmPrefix')} {payAmount.toFixed(2)}
          </p>
          {isDeposit && (
            <p className="text-xs text-cheers-brown/50 mt-1">
              {lang === 'zh' ? `总额 RM ${total.toFixed(2)}` : `Total RM ${total.toFixed(2)}`}
            </p>
          )}
        </div>

        {/* QR Code */}
        {settings.paymentQrUrl && (
          <div className="text-center">
            <p className="text-sm text-cheers-brown/70 mb-3">{t('payment.scan')}</p>
            <img
              src={settings.paymentQrUrl}
              alt="Payment QR Code"
              className="w-48 h-48 object-contain mx-auto rounded-xl border border-cheers-cream shadow-sm"
            />
          </div>
        )}

        {/* Admin-configured payment note (bank account, instructions etc.) */}
        {(settings.paymentNote?.zh || settings.paymentNote?.en) && (
          <div className="bg-cheers-cream/40 rounded-xl p-4 text-sm text-cheers-dark-brown/80 whitespace-pre-line leading-relaxed">
            {settings.paymentNote?.[lang] || settings.paymentNote?.zh || settings.paymentNote?.en}
          </div>
        )}

        {/* "I've paid" confirmation */}
        <div className="text-center">
          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl py-4 px-4 space-y-3 text-center">
              <p className="text-green-700 font-semibold text-sm">✅ {lang === 'zh' ? '谢谢！请把付款截图发到 WhatsApp' : 'Thank you! Please send your payment screenshot via WhatsApp'}</p>
              {settings.whatsappNumber && (
                <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl py-2.5 font-medium transition-colors text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {lang === 'zh' ? '发送截图到 WhatsApp' : 'Send Screenshot via WhatsApp'}
                </a>
              )}
              <button onClick={() => navigate('/orders')}
                className="text-xs text-green-600 hover:text-green-800 underline block">
                {lang === 'zh' ? '查看我的订单 →' : 'View my orders →'}
              </button>
            </div>
          ) : (
            <button onClick={handleSubmitPayment} disabled={submitting}
              className="w-full btn-primary py-3 text-base font-semibold">
              {submitting ? '…' : (lang === 'zh' ? '✅ 我已完成付款' : '✅ I have paid')}
            </button>
          )}
        </div>

        {/* Contact note */}
        <div className="text-center">
          <p className="text-sm text-cheers-brown/70 mb-3">{t('payment.contact')}</p>

          <div className="flex flex-col gap-3">
            {(settings.chatTool === 'whatsapp' || settings.chatTool === 'both') && settings.whatsappNumber && (
              <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 font-medium transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t('payment.whatsapp')}
              </a>
            )}
            {(settings.chatTool === 'telegram' || settings.chatTool === 'both') && settings.telegramLink && (
              <a href={buildTelegramLink()} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077bb] text-white rounded-xl py-3 font-medium transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                {t('payment.telegram')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
