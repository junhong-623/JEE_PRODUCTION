import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import {
  subscribeAccounts, subscribeTransactions, subscribeItems, subscribeSettings,
} from '../services/firestore'
import { dbGetAll, dbPut, dbDelete } from '../services/db'
import { syncWrite, syncDelete, flushQueue } from '../services/sync'

export const JSaveContext = createContext(null)

const DEFAULT_SETTINGS = {
  id: 'config',
  monthlyIncome: 0,
  currency: 'MYR',
  dailyBudget: 0,
  categoryBudgets: {},
  defaultAccountId: null,
  language: 'en',
}

export function JSaveProvider({ children, onLanguageChange }) {
  const { user } = useAuth()
  const online = useOnlineStatus()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [items, setItems] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const unsubs = useRef([])
  const autoSalaryDone = useRef(new Set())
  const autoRecurringDone = useRef(new Set())

  // Load from IDB immediately for offline-first feel
  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      dbGetAll('accounts'),
      dbGetAll('transactions'),
      dbGetAll('items'),
      dbGetAll('settings'),
    ]).then(([accs, txs, itms, sets]) => {
      if (accs.length) setAccounts(accs)
      if (txs.length) setTransactions(txs.filter(t => !t.deleted))
      if (itms.length) setItems(itms)
      const s = sets.find(s => s.id === 'config')
      if (s) {
        setSettings(s)
        onLanguageChange?.(s.language || 'en')
      }
    }).finally(() => setLoading(false))
  }, [user])

  // Firestore subscriptions — keep IDB + state in sync
  useEffect(() => {
    if (!user) return
    const uid = user.uid

    const unsubAccounts = subscribeAccounts(uid, data => {
      setAccounts(data)
      data.forEach(d => dbPut('accounts', d))
    })
    const unsubTx = subscribeTransactions(uid, data => {
      setTransactions(data)
      data.forEach(d => dbPut('transactions', d))
    })
    const unsubItems = subscribeItems(uid, data => {
      setItems(data)
      data.forEach(d => dbPut('items', d))
    })
    const unsubSettings = subscribeSettings(uid, data => {
      setSettings(data)
      dbPut('settings', data)
      onLanguageChange?.(data.language || 'en')
    })

    unsubs.current = [unsubAccounts, unsubTx, unsubItems, unsubSettings]
    return () => unsubs.current.forEach(u => u())
  }, [user])

  // Auto-recurring: runs once after initial data load, auto-adds this month's recurring expenses
  useEffect(() => {
    if (loading || !user) return

    const now = new Date()
    const year = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const monthKey = `${year}-${mm}`
    const day = String(now.getDate()).padStart(2, '0')
    const lang = settings?.language || 'en'
    const prefix = lang === 'zh'
      ? `${now.getMonth() + 1}月`
      : now.toLocaleString('en', { month: 'short' })

    const recurringTxs = transactions.filter(t => t.recurring && t.type === 'expense' && !t.deleted)
    if (!recurringTxs.length) return

    // Group by signature — keep only the latest tx per unique recurring template
    const latest = new Map()
    recurringTxs.forEach(t => {
      const sig = `${t.amount}|${t.category}|${t.accountId}|${t.recurringBaseNote ?? t.note}`
      const prev = latest.get(sig)
      if (!prev || t.date > prev.date) latest.set(sig, t)
    })

    latest.forEach((template, sig) => {
      const sessionKey = sig + monthKey
      if (autoRecurringDone.current.has(sessionKey)) return
      autoRecurringDone.current.add(sessionKey)

      // Already has a recurring tx this month with the same signature
      const alreadyThisMonth = recurringTxs.some(
        t => t.date.startsWith(monthKey) &&
          `${t.amount}|${t.category}|${t.accountId}|${t.recurringBaseNote ?? t.note}` === sig
      )
      if (alreadyThisMonth) return

      const baseNote = template.recurringBaseNote ?? template.note
      const tx = {
        ...template,
        id: crypto.randomUUID(),
        date: `${monthKey}-${day}`,
        note: baseNote ? `${prefix} - ${baseNote}` : prefix,
        recurringBaseNote: baseNote,
        recurring: true,
        autoAdded: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deleted: false,
        userId: user.uid,
      }
      setTransactions(prev => [tx, ...prev])
      syncWrite(user.uid, 'transactions', tx, online)
    })
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Flush sync queue when back online
  useEffect(() => {
    if (online && user) flushQueue(user.uid)
  }, [online, user])

  // Auto-salary: runs once after initial data load
  useEffect(() => {
    if (loading || !user) return
    const { autoSalary, salaryDay, salaryAccountId, monthlyIncome } = settings
    if (!autoSalary || !salaryDay || !salaryAccountId || !monthlyIncome) return

    const now = new Date()
    const dayOfMonth = now.getDate()
    // Only fire on the exact salary day — no grace period.
    // This prevents retroactive fills when the user opens the app days later.
    if (dayOfMonth !== salaryDay) return

    const year = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const monthKey = `${year}-${mm}`

    // lastAutoSalaryMonth persists to Firestore/IDB — survives transaction deletion.
    // Once recorded for a month, we never re-add even if the tx is deleted.
    if (settings.lastAutoSalaryMonth === monthKey) return

    if (autoSalaryDone.current.has(monthKey)) return
    autoSalaryDone.current.add(monthKey)

    // Record the month BEFORE adding the transaction.
    // If user later deletes the tx, this flag prevents re-adding.
    const updatedSettings = { ...settings, lastAutoSalaryMonth: monthKey, id: 'config', userId: user.uid }
    setSettings(updatedSettings)
    syncWrite(user.uid, 'settings', updatedSettings, online)

    const alreadyAdded = transactions.some(
      t => t.autoAdded && t.category === 'catSalary' && t.date.startsWith(monthKey)
    )
    if (alreadyAdded) return

    const tx = {
      type: 'income',
      amount: monthlyIncome,
      category: 'catSalary',
      accountId: salaryAccountId,
      date: `${monthKey}-${String(salaryDay).padStart(2, '0')}`,
      note: 'Auto salary',
      autoAdded: true,
      userId: user.uid,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
    }
    setTransactions(prev => [tx, ...prev])
    syncWrite(user.uid, 'transactions', tx, online)
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const uid = user?.uid

  const addTransaction = useCallback(async (data) => {
    const tx = { ...data, userId: uid, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now(), deleted: false }
    setTransactions(prev => [tx, ...prev])
    await syncWrite(uid, 'transactions', tx, online)
  }, [uid, online])

  const updateTransaction = useCallback(async (id, data) => {
    const updated = { ...data, id, userId: uid, updatedAt: Date.now() }
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t))
    await syncWrite(uid, 'transactions', updated, online)
  }, [uid, online])

  const deleteTransaction = useCallback(async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
    await dbDelete('transactions', id)
    await syncDelete(uid, 'transactions', id, online)
  }, [uid, online])

  const addAccount = useCallback(async (data) => {
    const acc = { ...data, userId: uid, id: crypto.randomUUID(), createdAt: Date.now() }
    setAccounts(prev => [...prev, acc])
    await syncWrite(uid, 'accounts', acc, online)
    return acc
  }, [uid, online])

  const updateAccount = useCallback(async (id, data) => {
    const updated = { ...data, id, userId: uid }
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a))
    await syncWrite(uid, 'accounts', updated, online)
  }, [uid, online])

  const deleteAccount = useCallback(async (id) => {
    setAccounts(prev => prev.filter(a => a.id !== id))
    await dbDelete('accounts', id)
    await syncDelete(uid, 'accounts', id, online)
  }, [uid, online])

  const addItem = useCallback(async (data) => {
    const item = { ...data, userId: uid, id: crypto.randomUUID(), createdAt: Date.now() }
    setItems(prev => [...prev, item])
    await syncWrite(uid, 'items', item, online)
  }, [uid, online])

  const updateItem = useCallback(async (id, data) => {
    const updated = { ...data, id, userId: uid }
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i))
    await syncWrite(uid, 'items', updated, online)
  }, [uid, online])

  const deleteItem = useCallback(async (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
    await dbDelete('items', id)
    await syncDelete(uid, 'items', id, online)
  }, [uid, online])

  const updateSettings = useCallback(async (data) => {
    const updated = { ...settings, ...data, id: 'config', userId: uid }
    setSettings(updated)
    await syncWrite(uid, 'settings', updated, online)
    if (data.language) onLanguageChange?.(data.language)
  }, [uid, online, settings, onLanguageChange])

  // Computed helpers
  const getAccountBalance = useCallback((accountId) => {
    const acc = accounts.find(a => a.id === accountId)
    const initial = acc?.initialBalance ?? 0
    return transactions.reduce((sum, t) => {
      if (t.type === 'income'   && t.accountId     === accountId) return sum + t.amount
      if (t.type === 'expense'  && t.accountId     === accountId) return sum - t.amount
      if (t.type === 'transfer' && t.fromAccountId === accountId) return sum - t.amount
      if (t.type === 'transfer' && t.toAccountId   === accountId) return sum + t.amount
      if (t.type === 'split') {
        let delta = 0
        if (t.accountId === accountId) delta -= t.amount
        if (t.splitWith) {
          t.splitWith.forEach(f => {
            if (f.settled && f.settledAccountId === accountId) delta += f.share
          })
        }
        return sum + delta
      }
      return sum
    }, initial)
  }, [accounts, transactions])

  const getTotalBalance = useCallback(() => {
    return accounts.reduce((sum, acc) => sum + getAccountBalance(acc.id), 0)
  }, [accounts, getAccountBalance])

  return (
    <JSaveContext.Provider value={{
      accounts, transactions, items, settings, loading, online,
      addTransaction, updateTransaction, deleteTransaction,
      addAccount, updateAccount, deleteAccount,
      addItem, updateItem, deleteItem,
      updateSettings,
      getAccountBalance, getTotalBalance,
    }}>
      {children}
    </JSaveContext.Provider>
  )
}
