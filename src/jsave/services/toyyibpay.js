import { httpsCallable } from 'firebase/functions'
import { functions } from '../../lib/firebase'

export async function createCoffeeBill(amountRM) {
  const fn = httpsCallable(functions, 'createToyyibPayBill')
  const returnUrl = `${window.location.origin}/jsave`
  const result = await fn({ amountRM, returnUrl })
  return result.data // { url, billCode }
}
