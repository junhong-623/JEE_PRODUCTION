import { useEffect, useRef } from 'react'

function msUntil(hour) {
  const now = new Date()
  const target = new Date()
  target.setHours(hour, 0, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return target - now
}

export function useReminders(transactions, settings) {
  const txRef = useRef(transactions)
  useEffect(() => { txRef.current = transactions }, [transactions])

  useEffect(() => {
    if (!settings?.dailyReminder) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    const zh = settings?.language === 'zh'
    const lunchMsg   = zh ? '别忘了记录午餐消费！' : "Don't forget to log your lunch!"
    const eveningMsg = zh ? '今日还未记账，记一下今天的消费吧！' : "End of day — no records yet. Log your transactions!"

    const ids = []

    function schedule(hour, body) {
      const ms = msUntil(hour)
      ids.push(setTimeout(async () => {
        const today = new Date().toISOString().split('T')[0]
        const has = txRef.current.some(tx => tx.date === today && tx.type !== 'transfer')
        if (!has) {
          try {
            // SW showNotification works on both desktop and mobile Chrome
            const reg = await navigator.serviceWorker.ready
            reg.showNotification('JSave', {
              body,
              icon: '/jsave/icons/icon-192.png',
              tag: `jsave-reminder-${hour}`,
            })
          } catch {
            new Notification('JSave', { body, icon: '/jsave/icons/icon-192.png', tag: `jsave-reminder-${hour}` })
          }
        }
      }, ms))
    }

    schedule(13, lunchMsg)
    schedule(20, eveningMsg)

    return () => ids.forEach(clearTimeout)
  }, [settings?.dailyReminder, settings?.language])
}
