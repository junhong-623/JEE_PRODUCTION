import fallbackEntries from '../data/projectFolders.json'
import { manualPortfolioEntries } from './manualEntries'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const PRIMARY_COL = 'projects'
const SECONDARY_COL = 'entries'
const useLocalProjects = import.meta.env.VITE_LOCAL_PROJECTS === 'true'
export const ENTRIES_UPDATED_EVENT = 'jeeprod:entries-updated'

function withTimeout(promise, ms, message) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([promise.finally(() => clearTimeout(timeoutId)), timeoutPromise])
}

function createEntryId(type, slug) {
  return `${type}__${slug}`
}

function normalizeEntry(entry) {
  const fallbackId = entry.id || createEntryId(entry.type || 'portfolio', entry.slug || 'untitled')
  const parsed = fallbackId.includes('__') ? fallbackId.split('__') : ['portfolio', fallbackId]
  const type = entry.type || parsed[0] || 'portfolio'
  const slug = entry.slug || parsed[1] || entry.id || 'untitled'

  return {
    ...entry,
    id: fallbackId,
    type,
    slug,
    title: entry.title || entry.name || '',
    titleZh: entry.titleZh || entry.nameZh || '',
    description: entry.description || '',
    descriptionZh: entry.descriptionZh || '',
    url: entry.url || '',
    iconUrl: entry.iconUrl || '',
    order: Number(entry.order) || 0,
    visible: entry.visible !== false,
  }
}

function normalizeEntries(entries) {
  return entries
    .map(normalizeEntry)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function getManualEntries() {
  return normalizeEntries(manualPortfolioEntries)
}

function getManualEntryById(id) {
  return getManualEntries().find((entry) => entry.id === id) ?? null
}

function getManualEntryByTypeAndSlug(type, slug) {
  return getManualEntries().find((entry) => entry.type === type && entry.slug === slug) ?? null
}

function mergeEntries(baseEntries, overrideEntries) {
  const mergedById = new Map(baseEntries.map((entry) => [entry.id, entry]))

  overrideEntries.forEach((entry) => {
    const existing = mergedById.get(entry.id)
    mergedById.set(entry.id, existing ? normalizeEntry({ ...existing, ...entry }) : entry)
  })

  return normalizeEntries(Array.from(mergedById.values()))
}

async function readCollection(colName) {
  const snapshot = await withTimeout(
    getDocs(query(collection(db, colName), orderBy('order', 'asc'))),
    12000,
    `Reading Firestore collection "${colName}" timed out`
  )
  return normalizeEntries(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
}

function buildEntryPayload(entry, existingEntry) {
  const slug = sanitizeSlug(entry.slug || existingEntry?.slug || '')
  const type = entry.type || existingEntry?.type || 'portfolio'

  return normalizeEntry({
    ...existingEntry,
    ...entry,
    type,
    slug,
    order: Number(entry.order ?? existingEntry?.order) || 0,
    visible: Boolean(entry.visible),
  })
}

export function sanitizeSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function getVisibleEntriesByType(type) {
  const entries = await getVisibleEntries()
  return entries.filter((entry) => entry.type === type)
}

export async function getVisibleEntries() {
  const entries = await getAllEntries()
  return entries.filter((entry) => entry.visible)
}

export async function getAllEntries() {
  const manualEntries = getManualEntries()

  if (useLocalProjects) {
    return mergeEntries(manualEntries, normalizeEntries(fallbackEntries))
  }

  try {
    const primaryEntries = await readCollection(PRIMARY_COL)
    return mergeEntries(manualEntries, primaryEntries)
  } catch (error) {
    console.error('getAllEntries primary collection failed', error)
  }

  try {
    const secondaryEntries = await readCollection(SECONDARY_COL)
    return mergeEntries(manualEntries, secondaryEntries)
  } catch (error) {
    console.error('getAllEntries secondary collection failed', error)
  }

  return mergeEntries(manualEntries, normalizeEntries(fallbackEntries))
}

export async function getEntry(type, slug) {
  if (useLocalProjects) {
    return getAllEntries().then((entries) => entries.find((entry) => entry.type === type && entry.slug === slug) ?? null)
  }

  const id = createEntryId(type, slug)

  try {
    const snapshot = await withTimeout(
      getDoc(doc(db, PRIMARY_COL, id)),
      12000,
      `Reading Firestore document "${id}" timed out`
    )
    if (snapshot.exists()) {
      const manualEntry = getManualEntryById(id)
      return normalizeEntry({ ...manualEntry, id: snapshot.id, ...snapshot.data() })
    }
  } catch (error) {
    console.error('getEntry primary collection failed', error)
  }

  try {
    const snapshot = await withTimeout(
      getDoc(doc(db, SECONDARY_COL, id)),
      12000,
      `Reading Firestore document "${id}" timed out`
    )
    if (snapshot.exists()) {
      const manualEntry = getManualEntryById(id)
      return normalizeEntry({ ...manualEntry, id: snapshot.id, ...snapshot.data() })
    }
  } catch (error) {
    console.error('getEntry secondary collection failed', error)
  }

  return getManualEntryByTypeAndSlug(type, slug)
}

export async function saveEntry({ previousId, entry }) {
  const existingEntry = previousId ? getManualEntryById(previousId) : getManualEntryByTypeAndSlug(entry.type, sanitizeSlug(entry.slug))
  const payload = buildEntryPayload(entry, existingEntry)
  const id = createEntryId(payload.type, payload.slug)

  await withTimeout(
    setDoc(doc(db, PRIMARY_COL, id), payload, { merge: true }),
    12000,
    `Saving Firestore document "${id}" timed out`
  )

  try {
    await withTimeout(
      setDoc(doc(db, SECONDARY_COL, id), payload, { merge: true }),
      12000,
      `Saving Firestore document "${id}" to secondary collection timed out`
    )
  } catch (error) {
    console.warn('Secondary collection sync skipped', error)
  }

  if (previousId && previousId !== id) {
    await withTimeout(
      deleteDoc(doc(db, PRIMARY_COL, previousId)),
      12000,
      `Deleting Firestore document "${previousId}" timed out`
    )
    try {
      await withTimeout(
        deleteDoc(doc(db, SECONDARY_COL, previousId)),
        12000,
        `Deleting Firestore document "${previousId}" from secondary collection timed out`
      )
    } catch (error) {
      console.warn('Secondary collection cleanup skipped', error)
    }
  }

  return id
}

export async function patchEntry(id, data) {
  await withTimeout(
    updateDoc(doc(db, PRIMARY_COL, id), data),
    12000,
    `Updating Firestore document "${id}" timed out`
  )
}

export async function deleteEntry(id) {
  await withTimeout(
    deleteDoc(doc(db, PRIMARY_COL, id)),
    12000,
    `Deleting Firestore document "${id}" timed out`
  )
  try {
    await withTimeout(
      deleteDoc(doc(db, SECONDARY_COL, id)),
      12000,
      `Deleting Firestore document "${id}" from secondary collection timed out`
    )
  } catch (error) {
    console.warn('Secondary collection delete skipped', error)
  }
}
