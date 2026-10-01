import {createRequire} from 'node:module'
import {describe, expect, it} from 'vitest'
const require=createRequire(import.meta.url)
const {receiptSuggestions,manualReceiptDraft,universalReceiptDraft,universalDocumentId,resolveUniversalAccounts,rememberUniversalAccounts}=require('../../functions/jsaveReceiptUniversal')
const {receiptTransactionDocumentId}=require('../../functions/jsaveReceiptShortcut')
const text=`Shopee\nOrder ID ABC12345\nMerchant KEDAI SAMPLE\nPaid RM 85.00\n01 Oct 2026`
const fields={sourceLabel:'Shopee',type:'expense',amount:'85.00',date:'2026-10-01',note:'KEDAI SAMPLE',reference:'ABC12345'}
const accounts=[{id:'bank',name:'Maybank Savings',type:'accBank'},{id:'wallet',name:'TNG',type:'accEwallet'},
  {id:'cash',name:'Cash',type:'accCash'},{id:'card',name:'CIMB Visa',type:'accCredit'}]

describe('universal receipt review',()=>{
  it('suggests unique values and leaves ambiguous totals or dates for the user',()=>{
    expect(receiptSuggestions(text)).toMatchObject({sourceLabel:'Shopee',amount:'85.00',date:'2026-10-01',note:'KEDAI SAMPLE',reference:'ABC12345'})
    expect(receiptSuggestions(text+'\nRM 15.00\n02 Oct 2026')).toMatchObject({amount:'',date:''})
  })
  it('does not infer a bank from a common English heading',()=>{
    expect(universalReceiptDraft({text:'Transaction Details\nAmount\n- MYR 10.00\nDate 01 Oct 2026\nDetails POS DEBIT SAMPLE'}).pending.error).toBe('source-selection-required')
    expect(universalReceiptDraft({text}).pending.error).toBe('manual-review-required')
  })
  it('asks to complete likely receipts and skips unrelated screenshots',()=>{
    expect(universalReceiptDraft({text}).pending.receiptLike).toBe('1')
    expect(universalReceiptDraft({text:'Shopping ideas\nRM 85.00\n01 Oct 2026'}).pending.receiptLike).toBe('0')
    expect(universalReceiptDraft({text:'Happy birthday\n01 Oct 2026'}).pending.receiptLike).toBe('0')
  })
  it('validates all user fields including impossible dates and ambiguous number formats',()=>{
    for(const date of ['2026-02-29','2026-13-01','2026-04-31','01/10/2026']) expect(()=>manualReceiptDraft(text,{...fields,date})).toThrow('invalid-review-date')
    for(const amount of ['0','-85','1,5','1.001','NaN','Infinity','1000001']) expect(()=>manualReceiptDraft(text,{...fields,amount})).toThrow('invalid-review-amount')
    expect(()=>manualReceiptDraft(text,{...fields,note:''})).toThrow('invalid-review-note')
    expect(()=>manualReceiptDraft(text,{...fields,type:'refund'})).toThrow('invalid-review-type')
    expect(manualReceiptDraft(text,{...fields,amount:'RM 1,200.50',note:'Sample\nShop'})).toMatchObject({amount:1200.5,note:'Sample Shop'})
  })
  it('keeps reference-based duplicate ids stable when a note is edited',()=>{
    expect(universalDocumentId(manualReceiptDraft(text,fields))).toBe(universalDocumentId(manualReceiptDraft(text,{...fields,note:'Edited note'})))
  })
  it('preserves native duplicate ids when reviewing an already supported screenshot',()=>{
    const native='详情\n-RM4.00\n交易类型 支付\n商家 SAMPLE MALL\n日期/时间 22/09/2026 21:23:15\n状态 成功\n交易编号 TNGSAMPLE12345678'
    const original=universalReceiptDraft({text:native}).draft
    const reviewed=universalReceiptDraft({text:native,manualFields:{...fields,date:'2026-09-22',amount:'4.00'}}).draft
    expect(universalDocumentId(reviewed)).toBe(receiptTransactionDocumentId(original))
  })
  it('offers all owned account types for manual expenses and allows changing a remembered choice',()=>{
    const draft=manualReceiptDraft(text,fields)
    const first=resolveUniversalAccounts(draft,text,accounts,{})
    expect(Object.values(first.pending.accountOptions)).toEqual(['bank','wallet','cash','card'])
    const selected=resolveUniversalAccounts(draft,text,accounts,{}, {source:'bank'})
    const saved={accountLinks:selected.preferences}
    expect(resolveUniversalAccounts(draft,text,accounts,saved).sourceAccountId).toBe('bank')
    expect(resolveUniversalAccounts(draft,text,accounts,saved,{},true).pending.error).toBe('account-selection-required')
    expect(resolveUniversalAccounts(draft,text,accounts,saved,{source:'card'}).sourceAccountId).toBe('card')
  })
  it('offers separate transfer accounts and rejects same, foreign, or malformed ids',()=>{
    const draft=manualReceiptDraft(text,{...fields,type:'transfer'})
    const source=resolveUniversalAccounts(draft,text,accounts,{}, {source:'bank'})
    expect(source.pending.selectionRole).toBe('target')
    expect(Object.values(source.pending.accountOptions)).not.toContain('bank')
    expect(()=>resolveUniversalAccounts(draft,text,accounts,{}, {source:'bank',target:'bank'})).toThrow('invalid-account-selection')
    expect(()=>resolveUniversalAccounts(draft,text,accounts,{}, {source:'foreign'})).toThrow('invalid-account-selection')
    expect(()=>resolveUniversalAccounts(draft,text,accounts,{}, {source:42})).toThrow('invalid-account-selection')
  })
  it('limits remembered contexts to 100 while retaining unrelated choices',()=>{
    const saved=Object.fromEntries(Array.from({length:100},(_,i)=>[`context${i}`,{accountId:'bank'}]))
    const result=rememberUniversalAccounts(saved,{new:{accountId:'card'}})
    expect(Object.keys(result)).toHaveLength(100)
    expect(result.new.accountId).toBe('card')
    expect(result.context99.accountId).toBe('bank')
  })
})
