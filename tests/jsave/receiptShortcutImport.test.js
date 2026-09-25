import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { parseReceiptScreenshot, receiptTransactionDocumentId, receiptAccountKey, matchUobCreditAccount } = require('../../functions/jsaveReceiptShortcut.js')
const { transactionDocumentId } = require('../../functions/jsaveShortcut.js')
const { cimbTransactionDocumentId } = require('../../functions/jsaveCimbShortcut.js')

const tng = `详情
-RM4.00
交易类型 支付
商家 SAMPLE MALL
款项详情 支付 - SAMPLE MALL
日期/时间 22/09/2026 21:23:15
状态 成功
交易编号 TNGSAMPLE12345678`

const tngQr = `详情
-RM8.50
交易类型 DuitNow QR TNGD
商家 SAMPLE SHOP
款项详情 SAMPLE SHOP
日期/时间 24/09/2026 19:23:33
状态 成功
交易编号 20260924TNGDMYNB0300QRTEST123`

const tngPaid = `RM 16.90
已付
商家 SAMPLE RAMEN
交易类型 DuitNow QR TNGD
日期/时间 25/09/2026 12:20:38
电子钱包参考编号 2026092510110000010000TNGOW3MYTEST123
付款方式 电子钱包余额
完成`

const cimb = `Transaction Details
Amount
- MYR 43.60
Posted Date 16 Sep 2026
Transacted Date 14 Sep 2026
To RESTORAN SAMPLE IPOH MY
From -
Transfer Type Credit Card
Done`

const cimbTopup = `Transaction Details
Amount
- MYR 12.00
Date 16 Sep 2026
Details POS DEBIT 20260915TNG EWALLET TOPUPA2-EC KUALA L
Done`

const cimbIncome = `Transaction Details
Amount
MYR 381.50
Date 01 Sep 2026
Details AUTOPAY CR SAMPLE SOFTWARE INTERN
Done`

const cimbCardPayment = `Transaction Details
Amount
- MYR 1,690.00
01 Sep 2026 9:14:44 AM
Reference No. 223991066
To JEE JUN HONG United Overseas Bank Berhad 4599 1441 0504 0401
From BASIC SA 7076892808
When 01 Sep 2026
Transfer Method DuitNow to Account
Payment Type Credit Card
Done`

describe('unified receipt shortcut', () => {
  it('routes TNG to the wallet and keeps legacy duplicate IDs', () => {
    const draft = parseReceiptScreenshot(tng)
    expect(draft).toMatchObject({ provider: 'tng', accountKind: 'wallet', type: 'expense' })
    expect(receiptAccountKey(draft)).toBe('tngAccountId')
    expect(receiptTransactionDocumentId(draft)).toBe(transactionDocumentId(draft.sourceTransactionId))
  })

  it('routes TNG DuitNow QR payments to the same wallet import flow', () => {
    const draft = parseReceiptScreenshot(tngQr)
    expect(draft).toMatchObject({ provider: 'tng', accountKind: 'wallet', type: 'expense', amount: 8.5, note: 'SAMPLE SHOP' })
    expect(receiptAccountKey(draft)).toBe('tngAccountId')
    const reordered = tngQr.replace('交易编号 20260924TNGDMYNB0300QRTEST123', '20260924TNGDMYNB0300QRTEST123\n交易编号')
    expect(parseReceiptScreenshot(reordered).sourceTransactionId).toBe(draft.sourceTransactionId)
  })

  it('routes an 已付 confirmation even when OCR omits the transaction-type label', () => {
    const draft = parseReceiptScreenshot(tngPaid.replace('交易类型 ', ''))
    expect(draft).toMatchObject({ provider: 'tng', accountKind: 'wallet', type: 'expense', amount: 16.9, note: 'SAMPLE RAMEN' })
  })

  it('routes CIMB credit card pages and keeps legacy duplicate IDs', () => {
    const draft = parseReceiptScreenshot(cimb)
    expect(draft).toMatchObject({ provider: 'cimb', accountKind: 'credit', type: 'expense' })
    expect(receiptAccountKey(draft)).toBe('cimbCreditAccountId')
    expect(receiptTransactionDocumentId(draft)).toBe(cimbTransactionDocumentId(draft.sourceTransactionId))
  })

  it('routes CIMB wallet top-ups and credited transactions to the bank account', () => {
    const topup = parseReceiptScreenshot(cimbTopup)
    const income = parseReceiptScreenshot(cimbIncome)
    expect(topup.type).toBe('transfer')
    expect(income.type).toBe('income')
    expect(receiptAccountKey(topup)).toBe('cimbBankAccountId')
    expect(receiptAccountKey(income)).toBe('cimbBankAccountId')
  })

  it('routes a CIMB payment to a UOB credit card from the CIMB bank account', () => {
    const draft = parseReceiptScreenshot(cimbCardPayment)
    expect(draft).toMatchObject({ provider: 'cimb', accountKind: 'bank', type: 'transfer', transferTarget: 'uobCredit' })
    expect(receiptAccountKey(draft)).toBe('cimbBankAccountId')
  })

  it('matches one UOB card automatically and refuses an ambiguous or mismatched card', () => {
    const payee = parseReceiptScreenshot(cimbCardPayment).note
    expect(matchUobCreditAccount([{ id: 'uob', name: 'UOB Credit Card', type: 'accCredit' }], payee)).toBe('uob')
    expect(matchUobCreditAccount([
      { id: 'a', name: 'UOB Visa 0504', type: 'accCredit' },
      { id: 'b', name: 'UOB Mastercard 0401', type: 'accCredit' },
    ], payee)).toBe('b')
    expect(matchUobCreditAccount([{ id: 'wrong', name: 'UOB Credit Card 0504', type: 'accCredit' }], payee)).toBe('')
    expect(matchUobCreditAccount([{ id: 'wrong', name: 'UOB Credit Card (0504)', type: 'accCredit' }], payee)).toBe('')
    expect(matchUobCreditAccount([{ id: 'bank', name: 'UOB', type: 'accBank' }], payee)).toBe('')
  })

  it('ignores unrelated screenshots without saving a transaction', () => {
    expect(() => parseReceiptScreenshot('A shopping list\nRM 10.00')).toThrow('unsupported-receipt')
    expect(parseReceiptScreenshot(cimb, 'cimb').provider).toBe('cimb')
    expect(() => parseReceiptScreenshot(cimb, 'maybank')).toThrow('unsupported-provider')
  })
})
