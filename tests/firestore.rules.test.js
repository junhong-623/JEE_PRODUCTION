import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  assertFails, assertSucceeds, initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

let environment

describe('Firestore JSave ownership rules', () => {
  beforeAll(async () => {
    const rulesPath = fileURLToPath(new URL('../firestore.rules', import.meta.url))
    environment = await initializeTestEnvironment({
      projectId: 'jsave-rules-test',
      firestore: { rules: readFileSync(rulesPath, 'utf8') },
    })
  })

  beforeEach(async () => environment.clearFirestore())
  afterAll(async () => environment?.cleanup())

  it('allows a user to access their own JSave records', async () => {
    const db = environment.authenticatedContext('alice').firestore()
    const ref = doc(db, 'users/alice/jsave_transactions/tx-1')
    await assertSucceeds(setDoc(ref, { amount: 10, userId: 'alice' }))
    expect((await assertSucceeds(getDoc(ref))).exists()).toBe(true)
  })

  it('blocks access to another user’s JSave records', async () => {
    await environment.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'users/bob/jsave_transactions/tx-1'), { amount: 10 })
    })
    const aliceDb = environment.authenticatedContext('alice').firestore()
    await assertFails(getDoc(doc(aliceDb, 'users/bob/jsave_transactions/tx-1')))
    await assertFails(setDoc(doc(aliceDb, 'users/bob/jsave_transactions/tx-2'), { amount: 20 }))
  })

  it('allows push subscription writes only under the owner UID prefix', async () => {
    const db = environment.authenticatedContext('alice').firestore()
    await assertSucceeds(setDoc(doc(db, 'jsavePushSubs/alice_device'), { uid: 'alice' }))
    await assertFails(setDoc(doc(db, 'jsavePushSubs/bob_device'), { uid: 'alice' }))
  })
})
