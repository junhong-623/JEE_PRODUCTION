import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { parseTngScreenshot, validateCategory, transactionDocumentId } = require('../../functions/jsaveShortcut.js')

const payment = `详情
-RM4.00
+4 points
交易类型 支付
商家 SUNWAY VELOCITY MALL
款项详情 支付 - SUNWAY VELOCITY MALL
付款方式 电子钱包余额
日期/时间 22/09/2026 21:23:15
钱包参考号 2026092210110000010000TEST123
状态 成功
交易编号 TNGTEST12345678`

const receipt = `详情
+RM250.00
交易类型 从钱包接收
接收转账 TEST PERSON
款项详情 Fund Transfer
付款方式 电子钱包余额
日期/时间 19/09/2026 22:14:44
状态 成功
交易编号 aaaaaaaa-1111-4222-a333-
bbbbbbbbbbbb`

const scanPayment = `12:28
RM 13.00
已转账
接收者
TEST PERSON
备注
TEST PERSON
日期与时间
23/09/2026 12:22:42
ELEVATE YOUR DRIVING EXPERIENCE
MICHELIN
Ad Elevate your driving experience with MICHELIN tyres made for every journey.`

describe('TNG shortcut import', () => {
  it('extracts a payment using the transaction date, merchant, and TNG ID', () => {
    expect(parseTngScreenshot(payment)).toEqual({
      type: 'expense', amount: 4, currency: 'MYR',
      date: '2026-09-22', time: '21:23:15',
      note: 'SUNWAY VELOCITY MALL', sourceTransactionId: 'TNGTEST12345678',
    })
  })

  it('extracts a receipt and rejoins a wrapped transaction ID', () => {
    expect(parseTngScreenshot(receipt)).toEqual({
      type: 'income', amount: 250, currency: 'MYR',
      date: '2026-09-19', time: '22:14:44',
      note: 'TEST PERSON', sourceTransactionId: 'AAAAAAAA-1111-4222-A333-BBBBBBBBBBBB',
    })
  })

  it('extracts a scan payment confirmation and ignores advertising text', () => {
    const parsed = parseTngScreenshot(scanPayment)
    expect(parsed).toMatchObject({
      type: 'expense', amount: 13, currency: 'MYR',
      date: '2026-09-23', time: '12:22:42', note: 'TEST PERSON',
    })
    expect(parsed.sourceTransactionId).toMatch(/^RECEIPT-[A-F0-9]{40}$/)
    expect(parseTngScreenshot(scanPayment.replace(/ELEVATE[\s\S]+$/, 'Other ad')).sourceTransactionId)
      .toBe(parsed.sourceTransactionId)
  })

  it('rejects incomplete scan payment confirmations', () => {
    expect(() => parseTngScreenshot(scanPayment.replace('已转账', '转账处理中'))).toThrow('missing-amount')
    expect(() => parseTngScreenshot(scanPayment.replace('接收者\nTEST PERSON', '接收者\n备注'))).toThrow('missing-party')
    expect(() => parseTngScreenshot(scanPayment.replace('23/09/2026', '31/02/2026'))).toThrow('invalid-date')
  })

  it('rejects failed and incomplete screenshots before they can become transactions', () => {
    expect(() => parseTngScreenshot(payment.replace('状态 成功', '状态 失败'))).toThrow('not-successful')
    expect(() => parseTngScreenshot(payment.replace('交易编号 TNGTEST12345678', ''))).toThrow('missing-transaction-id')
    expect(() => parseTngScreenshot(receipt.replace('19/09/2026', '31/02/2026'))).toThrow('invalid-date')
  })

  it('limits categories to the detected transaction direction and gives repeat imports the same ID', () => {
    expect(validateCategory('expense', 'catFood')).toBe(true)
    expect(validateCategory('expense', 'catSalary')).toBe(false)
    expect(validateCategory('income', 'catOtherIncome')).toBe(true)
    expect(transactionDocumentId('ABC123456')).toBe(transactionDocumentId('ABC123456'))
    expect(transactionDocumentId('ABC123456')).not.toBe(transactionDocumentId('ABC123457'))
  })
})
