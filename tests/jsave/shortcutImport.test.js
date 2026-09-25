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

const duitNowQrPayment = `详情
-RM8.50
+8 points
交易类型
DuitNow QR TNGD
商家 SAMPLE SHOP
款项详情 SAMPLE SHOP
付款方式 电子钱包余额
日期/时间 24/09/2026 19:23:33
钱包参考号 2026092410110000010000TEST123
状态 成功
交易编号 20260924TNGDMYNB0300QRTEST123`

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

const paidConfirmation = `12:20
RM 16.90
已付
+16 分
商家
SAMPLE RAMEN AND DONBURI
MALL AEON MALURI
交易类型
DuitNow QR TNGD
日期/时间
25/09/2026 12:20:38
电子钱包参考编号
2026092510110000010000TNG
OW3MY171256347717885
付款方式
电子钱包余额
无需充值即可付款!
立即设置
完成`

describe('TNG shortcut import', () => {
  it('extracts a payment using the transaction date, merchant, and TNG ID', () => {
    expect(parseTngScreenshot(payment)).toEqual({
      type: 'expense', amount: 4, currency: 'MYR',
      date: '2026-09-22', time: '21:23:15',
      note: 'SUNWAY VELOCITY MALL', sourceTransactionId: 'TNGTEST12345678',
    })
  })

  it('accepts a successful DuitNow QR TNGD payment when OCR misses the word 支付', () => {
    expect(parseTngScreenshot(duitNowQrPayment)).toEqual({
      type: 'expense', amount: 8.5, currency: 'MYR',
      date: '2026-09-24', time: '19:23:33',
      note: 'SAMPLE SHOP', sourceTransactionId: '20260924TNGDMYNB0300QRTEST123',
    })
    expect(parseTngScreenshot(duitNowQrPayment.replace('交易类型\n', '')).type).toBe('expense')
    expect(() => parseTngScreenshot(duitNowQrPayment.replace('状态 成功', '状态 失败'))).toThrow('not-successful')
    expect(() => parseTngScreenshot(duitNowQrPayment.replace('交易类型\nDuitNow QR TNGD', '交易类型\nOther QR'))).toThrow('invalid-type')
  })

  it('finds a DuitNow QR transaction ID when OCR reorders or splits the right column', () => {
    const id = '20260924TNGDMYNB0300QRTEST123'
    const reordered = duitNowQrPayment.replace(`状态 成功\n交易编号 ${id}`, `交易编号\n状态 成功\n${id}`)
    const beforeLabel = duitNowQrPayment.replace(`交易编号 ${id}`, `${id}\n交易编号`)
    const split = duitNowQrPayment.replace(id, '20260924TNGDMYNB0300QR\nTEST123')
    expect(parseTngScreenshot(reordered).sourceTransactionId).toBe(id)
    expect(parseTngScreenshot(beforeLabel).sourceTransactionId).toBe(id)
    expect(parseTngScreenshot(split).sourceTransactionId).toBe(id)
    expect(() => parseTngScreenshot(duitNowQrPayment.replace(`交易编号 ${id}`, '交易编号')))
      .toThrow('missing-transaction-id')
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

  it('imports a successful TNG 已付 QR confirmation without a signed amount or transaction ID', () => {
    const parsed = parseTngScreenshot(paidConfirmation)
    expect(parsed).toMatchObject({
      type: 'expense', amount: 16.9, currency: 'MYR',
      date: '2026-09-25', time: '12:20:38',
      note: 'SAMPLE RAMEN AND DONBURI MALL AEON MALURI',
    })
    expect(parsed.sourceTransactionId).toMatch(/^RECEIPT-[A-F0-9]{40}$/)
    expect(parseTngScreenshot(paidConfirmation.replace('无需充值即可付款!', 'Other promotion')).sourceTransactionId)
      .toBe(parsed.sourceTransactionId)
    const columns = paidConfirmation.replace(
      '商家\nSAMPLE RAMEN AND DONBURI\nMALL AEON MALURI\n交易类型\nDuitNow QR TNGD\n日期/时间',
      '商家\n交易类型\n日期/时间\nSAMPLE RAMEN AND DONBURI\nMALL AEON MALURI\nDuitNow QR TNGD',
    )
    expect(parseTngScreenshot(columns).note).toBe(parsed.note)
    expect(() => parseTngScreenshot(paidConfirmation.replace('已付', '付款处理中'))).toThrow('missing-amount')
    expect(() => parseTngScreenshot(paidConfirmation.replace('商家', '店铺'))).toThrow('missing-party')
    expect(() => parseTngScreenshot(paidConfirmation.replace('25/09/2026', '31/09/2026'))).toThrow('invalid-date')
  })

  it('finds a scan payment date when iPhone OCR separates or reorders its label', () => {
    const splitDate = scanPayment.replace('日期与时间\n23/09/2026 12:22:42', '日期与时间\n23/09/2026\n12:22:42')
    const movedLabel = scanPayment.replace('日期与时间\n23/09/2026 12:22:42', '23/09/2026 12:22:42\n日期与时问')
    expect(parseTngScreenshot(splitDate).date).toBe('2026-09-23')
    expect(parseTngScreenshot(movedLabel).time).toBe('12:22:42')
  })

  it('finds the recipient when OCR emits all labels before their values', () => {
    const columns = scanPayment.replace(
      '接收者\nTEST PERSON\n备注\nTEST PERSON\n日期与时间',
      '接收者\n备注\n日期与时间\nTEST PERSON\nDINNER',
    )
    expect(parseTngScreenshot(columns).note).toBe('TEST PERSON')
  })

  it('rejects incomplete scan payment confirmations', () => {
    expect(() => parseTngScreenshot(scanPayment.replace('已转账', '转账处理中'))).toThrow('missing-amount')
    expect(() => parseTngScreenshot(scanPayment.replaceAll('TEST PERSON', ''))).toThrow('missing-party')
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
