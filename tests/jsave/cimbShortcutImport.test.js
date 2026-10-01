import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { parseCimbScreenshot, cimbTransactionDocumentId } = require('../../functions/jsaveCimbShortcut.js')

const card = `Transaction Details
Amount
- MYR 439.60
Reference No.
-
Posted Date
16 Sep 2026
Transacted Date
14 Sep 2026
To
RESTORAN SAMPLE SB
IPOH MY
From
-
Transfer Type
Credit Card
Done`

const topup = `Transaction Details
Amount
- MYR 12.00
Date
16 Sep 2026
Details
POS DEBIT
20260915TNG EWALLET
TOPUPA2-EC KUALA L
15/09/2026 6540
TNG EWALLET KUALA L
T54064
Done`

const incoming = `Transaction Details
Amount
MYR 3,817.50
Date
01 Sep 2026
Details
AUTOPAY CR
SAMPLE SOFTWARE
INTERN
1234567890123456
Done`

const cardPayment = `Transaction Details
Amount
- MYR 1,690.00
01 Sep 2026 9:14:44 AM
Reference No.
223991066
To
JEE JUN HONG
United Overseas Bank Berhad 4599 1441 0504
0401
From
BASIC SA
7076892808
When
01 Sep 2026
Repeat
No
Transfer Method
DuitNow to Account
Payment Type
Credit Card
Done`

const internalCardPayment = `Transaction Details
Amount
- MYR 439.60
01 Oct 2026 7:58:14 AM
Reference No.
123456789
To
PETRONAS VISA
PLATINUM-I
4000 0000 0000 9627
From
BASIC SA
1000000000
When
01 Oct 2026
Repeat
No
Transfer Type
Within CIMB Bank
Payment Type
Credit Card
Payment Option
Statement Balance
Done`

describe('CIMB screenshot shortcut import', () => {
  it('uses the card transaction date, not the posted date', () => {
    expect(parseCimbScreenshot(card)).toMatchObject({
      type: 'expense', accountKind: 'credit', amount: 439.6,
      date: '2026-09-14', note: 'RESTORAN SAMPLE SB IPOH MY',
    })
  })

  it('stops merchant text before inline following labels', () => {
    const inline = card.replace('From\n-', 'From -').replace('Transfer Type\nCredit Card', 'Transfer Type Credit Card')
    expect(parseCimbScreenshot(inline).note).toBe('RESTORAN SAMPLE SB IPOH MY')
  })

  it('reads dates when iPhone OCR puts values before their labels', () => {
    const topupReordered = topup.replace('Date\n16 Sep 2026', '16 Sep 2026\nDate')
    const incomingReordered = incoming.replace('Date\n01 Sep 2026', '01 Sep 2026\nDate')
    expect(parseCimbScreenshot(topupReordered).date).toBe('2026-09-16')
    expect(parseCimbScreenshot(incomingReordered).date).toBe('2026-09-01')
    expect(parseCimbScreenshot(incomingReordered.replace('01 Sep 2026', '01Sep2026')).date).toBe('2026-09-01')
  })

  it('reads bank details when OCR emits the values before the Details label', () => {
    const topupReordered = topup.replace('Details\nPOS DEBIT', 'POS DEBIT\nDetails')
    const incomingReordered = incoming.replace('Details\nAUTOPAY CR', 'AUTOPAY CR\nDetails')
    expect(parseCimbScreenshot(topupReordered).type).toBe('transfer')
    expect(parseCimbScreenshot(incomingReordered).type).toBe('income')
  })

  it('uses the earlier card date when OCR groups date labels and values', () => {
    const grouped = card.replace('Posted Date\n16 Sep 2026\nTransacted Date\n14 Sep 2026',
      'Posted Date\nTransacted Date\n16 Sep 2026\n14 Sep 2026')
    expect(parseCimbScreenshot(grouped).date).toBe('2026-09-14')
  })

  it('treats a debit to the user’s TNG wallet as a transfer', () => {
    expect(parseCimbScreenshot(topup)).toMatchObject({
      type: 'transfer', accountKind: 'bank', amount: 12,
      date: '2026-09-16',
    })
  })

  it('reads a CIMB payment to a UOB credit card as a bank-to-card transfer', () => {
    expect(parseCimbScreenshot(cardPayment)).toMatchObject({
      type: 'transfer', accountKind: 'bank', transferTarget: 'uobCredit',
      amount: 1690, date: '2026-09-01',
      note: 'JEE JUN HONG United Overseas Bank Berhad •••• 0401',
    })
    expect(() => parseCimbScreenshot(cardPayment.replace('United Overseas Bank Berhad', 'Another Bank')))
      .toThrow('unsupported-card-payment-bank')
  })

  it('reads CIMB internal card repayments as transfers from bank to CIMB credit', () => {
    expect(parseCimbScreenshot(internalCardPayment)).toMatchObject({
      type: 'transfer', accountKind: 'bank', transferTarget: 'cimbCredit',
      amount: 439.6, date: '2026-10-01', note: 'PETRONAS VISA PLATINUM-I •••• 9627',
    })
  })

  it('accepts inline and reordered payment labels without confusing repayment with card spending', () => {
    const inline = internalCardPayment.replace('Transfer Type\nWithin CIMB Bank', 'Transfer Type Within CIMB Bank')
      .replace('Payment Type\nCredit Card', 'Payment Type Credit Card')
    const reordered = internalCardPayment.replace('Payment Type\nCredit Card', 'Credit Card\nPayment Type')
    expect(parseCimbScreenshot(inline).transferTarget).toBe('cimbCredit')
    expect(parseCimbScreenshot(reordered).accountKind).toBe('bank')
    expect(parseCimbScreenshot(reordered).type).toBe('transfer')
  })

  it('keeps internal repayment duplicate IDs stable across card number and name wrapping', () => {
    const wrapped = internalCardPayment.replace('PETRONAS VISA\nPLATINUM-I', 'PETRONAS VISA PLATINUM-I')
      .replace('4000 0000 0000 9627', '4000000000009627')
    expect(parseCimbScreenshot(wrapped).sourceTransactionId).toBe(parseCimbScreenshot(internalCardPayment).sourceTransactionId)
  })

  it('requires outgoing direction and an identifiable recipient bank for card repayments', () => {
    expect(() => parseCimbScreenshot(internalCardPayment.replace('- MYR', '+ MYR'))).toThrow('ambiguous-direction')
    expect(() => parseCimbScreenshot(internalCardPayment.replace('Within CIMB Bank', 'Other Bank'))).toThrow('unsupported-card-payment-bank')
  })

  it('recognizes a credited bank transaction as income without assuming a category', () => {
    expect(parseCimbScreenshot(incoming)).toMatchObject({
      type: 'income', accountKind: 'bank', amount: 3817.5,
      date: '2026-09-01', note: 'AUTOPAY CR SAMPLE SOFTWARE INTERN 1234567890123456',
    })
  })

  it('keeps duplicate IDs stable across line wrapping', () => {
    const a = parseCimbScreenshot(incoming)
    const b = parseCimbScreenshot(incoming.replace('SAMPLE SOFTWARE\nINTERN', 'SAMPLE SOFTWARE INTERN'))
    expect(cimbTransactionDocumentId(a.sourceTransactionId)).toBe(cimbTransactionDocumentId(b.sourceTransactionId))
  })

  it('fails closed for incomplete and ambiguous screenshots', () => {
    expect(() => parseCimbScreenshot(card.replace('14 Sep 2026', '31 Sep 2026'))).toThrow('invalid-date')
    expect(() => parseCimbScreenshot(card.replace('RESTORAN SAMPLE SB\nIPOH MY', '-'))).toThrow('missing-party')
    expect(() => parseCimbScreenshot(incoming.replace('AUTOPAY CR', 'AUTOPAY'))).toThrow('ambiguous-direction')
    expect(() => parseCimbScreenshot('Transaction Details\nAmount\nMYR 12.00')).toThrow('missing-date')
  })
})
