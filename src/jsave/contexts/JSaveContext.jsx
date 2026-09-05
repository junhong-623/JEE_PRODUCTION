import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import {
  subscribeAccounts, subscribeTransactions, subscribeItems, subscribeSettings, subscribeGoals,
} from '../services/firestore'
import { dbGetAll, dbDelete, migrateLegacyData } from '../services/db'
import { syncWrite, syncDelete, flushQueue, reconcileRemote } from '../services/sync'
import { getDueAutoSalary, getDueRecurringTransactions } from '../services/automation'

export const JSaveContext = createContext(null)

export const DEFAULT_SETTINGS = {
  id: 'config',
  monthlyIncome: 0,
  currency: 'MYR',
  dailyBudget: 0,
  categoryBudgets: {},
  defaultAccountId: null,
  language: 'en',
}

const EMPTY_REMOTE_READY = {
  accounts: false,
  transactions: false,
  items: false,
  settings: false,
  goals: false,
}

export function JSaveProvider({ children, onLanguageChange }) {
  const { user } = useAuth()
  const online = useOnlineStatus()
  const uid = user?.uid ?? null
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [items, setItems] = useState([])
  const [goals, setGoals] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(Boolean(uid))
  const [hydratedUid, setHydratedUid] = useState(null)
  const [remoteReady, setRemoteReady] = useState(EMPTY_REMOTE_READY)
  const [syncError, setSyncError] = useState(null)
  const autoSalaryDone = useRef(new Set())
  const autoRecurringDone = useRef(new Set())

  // Reset immediately on account changes, then hydrate only that user's database.
  useEffect(() => {
    let cancelled = false
    setAccounts([])
    setTransactions([])
    setItems([])
    setGoals([])
    setSettings(DEFAULT_SETTINGS)
    setHydratedUid(null)
    setRemoteReady(EMPTY_REMOTE_READY)
    setSyncError(null)
    setLoading(Boolean(uid))
    autoSalaryDone.current.clear()
    autoRecurringDone.current.clear()

    if (!uid) return undefined

    async function hydrate() {
      try {
        await migrateLegacyData(uid)
        const [cachedAccounts, cachedTransactions, cachedItems, cachedSettings, cachedGoals] = await Promise.all([
          dbGetAll(uid, 'accounts'),
          dbGetAll(uid, 'transactions'),
          dbGetAll(uid, 'items'),
          dbGetAll(uid, 'settings'),
          dbGetAll(uid, 'goals'),
        ])
        if (cancelled) return
        setAccounts(cachedAccounts)
        setTransactions(cachedTransactions.filter(transaction => !transaction.deleted))
        setItems(cachedItems)
        setGoals(cachedGoals)
        const cachedConfig = cachedSettings.find(value => value.id === 'config')
        if (cachedConfig) {
          const nextSettings = { ...DEFAULT_SETTINGS, ...cachedConfig }
          setSettings(nextSettings)
          onLanguageChange?.(nextSettings.language)
        }
      } catch (error) {
        if (!cancelled) setSyncError(error)
      } finally {
        if (!cancelled) {
          setHydratedUid(uid)
          setLoading(false)
        }
      }
    }

    hydrate()
    return () => { cancelled = true }
  }, [uid, onLanguageChange])

  // Start remote listeners only after local hydration so stale local reads cannot
  // overwrite a newer Firestore snapshot that arrived first.
  useEffect(() => {
    if (!uid || hydratedUid !== uid) return undefined
    let cancelled = false

    const markReady = store => setRemoteReady(previous => ({ ...previous, [store]: true }))
    const onError = store => error => {
      if (cancelled) return
      setSyncError(error)
      markReady(store)
    }
    const applyRemote = (store, setter, normalize = value => value) => async remoteData => {
      try {
        const merged = await reconcileRemote(uid, store, normalize(remoteData))
        if (!cancelled) setter(merged)
      } catch (error) {
        if (!cancelled) setSyncError(error)
      } finally {
        if (!cancelled) markReady(store)
      }
    }

    const unsubscribers = [
      subscribeAccounts(uid, applyRemote('accounts', setAccounts), onError('accounts')),
      subscribeTransactions(uid, applyRemote('transactions', data => {
        setTransactions([...data].sort((a, b) => (b.date || '').localeCompare(a.date || '')))
      }), onError('transactions')),
      subscribeItems(uid, applyRemote('items', setItems), onError('items')),
      subscribeGoals(uid, applyRemote('goals', setGoals), onError('goals')),
      subscribeSettings(uid, applyRemote('settings', data => {
        const nextSettings = { ...DEFAULT_SETTINGS, ...(data[0] || {}) }
        setSettings(nextSettings)
        onLanguageChange?.(nextSettings.language)
      }, data => [{ ...DEFAULT_SETTINGS, ...data, userId: uid }]), onError('settings')),
    ]

    return () => {
      cancelled = true
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [uid, hydratedUid, onLanguageChange])

  useEffect(() => {
    if (online && uid && hydratedUid === uid) {
      flushQueue(uid).then(() => setSyncError(null)).catch(setSyncError)
    }
  }, [online, uid, hydratedUid])

  const automationReady = Boolean(
    uid && hydratedUid === uid && (
      !online || (remoteReady.accounts && remoteReady.transactions && remoteReady.settings)
    )
  )

  useEffect(() => {
    if (!automationReady || !uid) return
    const due = getDueRecurringTransactions({
      transactions,
      uid,
      language: settings.language,
    })

    for (const transaction of due) {
      if (autoRecurringDone.current.has(transaction.id)) continue
      autoRecurringDone.current.add(transaction.id)
      setTransactions(previous =>
        previous.some(item => item.id === transaction.id) ? previous : [transaction, ...previous]
      )
      syncWrite(uid, 'transactions', transaction, online).catch(setSyncError)
    }
  }, [automationReady, uid, transactions, settings.language, online])

  useEffect(() => {
    if (!automationReady || !uid) return
    const due = getDueAutoSalary({ transactions, settings, uid })
    if (!due || autoSalaryDone.current.has(due.monthKey)) return
    autoSalaryDone.current.add(due.monthKey)

    async function applyAutoSalary() {
      if (due.transaction) {
        setTransactions(previous =>
          previous.some(item => item.id === due.transaction.id) ? previous : [due.transaction, ...previous]
        )
        await syncWrite(uid, 'transactions', due.transaction, online)
      }
      const updatedSettings = {
        ...settings,
        id: 'config',
        userId: uid,
        lastAutoSalaryMonth: due.monthKey,
      }
      setSettings(updatedSettings)
      await syncWrite(uid, 'settings', updatedSettings, online)
    }

    applyAutoSalary().catch(setSyncError)
  }, [automationReady, uid, transactions, settings, online])

  const addTransaction = useCallback(async data => {
    const transaction = {
      ...data,
      userId: uid,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
    }
    setTransactions(previous => [transaction, ...previous])
    await syncWrite(uid, 'transactions', transaction, online)
  }, [uid, online])

  const updateTransaction = useCallback(async (id, data) => {
    const current = transactions.find(transaction => transaction.id === id) || {}
    const updated = { ...current, ...data, id, userId: uid, updatedAt: Date.now() }
    setTransactions(previous => previous.map(transaction => transaction.id === id ? updated : transaction))
    await syncWrite(uid, 'transactions', updated, online)
  }, [uid, online, transactions])

  const deleteTransaction = useCallback(async id => {
    setTransactions(previous => previous.filter(transaction => transaction.id !== id))
    await dbDelete(uid, 'transactions', id)
    await syncDelete(uid, 'transactions', id, online)
  }, [uid, online])

  const addAccount = useCallback(async data => {
    const account = { ...data, userId: uid, id: crypto.randomUUID(), createdAt: Date.now() }
    setAccounts(previous => [...previous, account])
    await syncWrite(uid, 'accounts', account, online)
    return account
  }, [uid, online])

  const updateAccount = useCallback(async (id, data) => {
    const current = accounts.find(account => account.id === id) || {}
    const updated = { ...current, ...data, id, userId: uid }
    setAccounts(previous => previous.map(account => account.id === id ? updated : account))
    await syncWrite(uid, 'accounts', updated, online)
  }, [uid, online, accounts])

  const deleteAccount = useCallback(async id => {
    setAccounts(previous => previous.filter(account => account.id !== id))
    await dbDelete(uid, 'accounts', id)
    await syncDelete(uid, 'accounts', id, online)
  }, [uid, online])

  const addItem = useCallback(async data => {
    const item = { ...data, userId: uid, id: crypto.randomUUID(), createdAt: Date.now() }
    setItems(previous => [...previous, item])
    await syncWrite(uid, 'items', item, online)
  }, [uid, online])

  const updateItem = useCallback(async (id, data) => {
    const current = items.find(item => item.id === id) || {}
    const updated = { ...current, ...data, id, userId: uid }
    setItems(previous => previous.map(item => item.id === id ? updated : item))
    await syncWrite(uid, 'items', updated, online)
  }, [uid, online, items])

  const deleteItem = useCallback(async id => {
    setItems(previous => previous.filter(item => item.id !== id))
    await dbDelete(uid, 'items', id)
    await syncDelete(uid, 'items', id, online)
  }, [uid, online])

  const addGoal = useCallback(async data => {
    const goal = {
      ...data,
      userId: uid,
      id: data.id || crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setGoals(previous => [...previous, goal])
    await syncWrite(uid, 'goals', goal, online)
    return goal
  }, [uid, online])

  const updateGoal = useCallback(async (id, data) => {
    const current = goals.find(goal => goal.id === id) || {}
    const updated = { ...current, ...data, id, userId: uid, updatedAt: Date.now() }
    setGoals(previous => previous.map(goal => goal.id === id ? updated : goal))
    await syncWrite(uid, 'goals', updated, online)
  }, [uid, online, goals])

  const deleteGoal = useCallback(async id => {
    setGoals(previous => previous.filter(goal => goal.id !== id))
    await dbDelete(uid, 'goals', id)
    await syncDelete(uid, 'goals', id, online)
  }, [uid, online])

  const updateSettings = useCallback(async data => {
    const updated = { ...settings, ...data, id: 'config', userId: uid }
    setSettings(updated)
    await syncWrite(uid, 'settings', updated, online)
    if (data.language) onLanguageChange?.(data.language)
  }, [uid, online, settings, onLanguageChange])

  const getAccountBalance = useCallback(accountId => {
    const account = accounts.find(value => value.id === accountId)
    const initial = account?.initialBalance ?? 0
    return transactions.reduce((sum, transaction) => {
      if (transaction.type === 'income' && transaction.accountId === accountId) return sum + transaction.amount
      if (transaction.type === 'expense' && transaction.accountId === accountId) return sum - transaction.amount
      if (transaction.type === 'transfer' && transaction.fromAccountId === accountId) return sum - transaction.amount
      if (transaction.type === 'transfer' && transaction.toAccountId === accountId) return sum + transaction.amount
      if (transaction.type === 'split') {
        let delta = 0
        if (transaction.accountId === accountId) delta -= transaction.amount
        transaction.splitWith?.forEach(friend => {
          if (friend.settled && friend.settledAccountId === accountId) delta += friend.share
        })
        return sum + delta
      }
      return sum
    }, initial)
  }, [accounts, transactions])

  const getTotalBalance = useCallback(() =>
    accounts.reduce((sum, account) => sum + getAccountBalance(account.id), 0),
  [accounts, getAccountBalance])

  const dataLoading = Boolean(uid) && (loading || hydratedUid !== uid)

  return (
    <JSaveContext.Provider value={{
      accounts: dataLoading ? [] : accounts,
      transactions: dataLoading ? [] : transactions,
      items: dataLoading ? [] : items,
      goals: dataLoading ? [] : goals,
      settings: dataLoading ? DEFAULT_SETTINGS : settings,
      loading: dataLoading,
      online,
      syncReady: automationReady, syncError,
      addTransaction, updateTransaction, deleteTransaction,
      addAccount, updateAccount, deleteAccount,
      addItem, updateItem, deleteItem,
      addGoal, updateGoal, deleteGoal,
      updateSettings,
      getAccountBalance, getTotalBalance,
    }}>
      {children}
    </JSaveContext.Provider>
  )
}
