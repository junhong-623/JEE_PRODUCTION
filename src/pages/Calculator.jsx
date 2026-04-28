import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { useLang } from '../contexts/LangContext'

const BUTTONS = [
  ['C', '(', ')', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', 'DEL', '='],
]

export default function Calculator() {
  const { lang, t } = useLang()
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState('0')
  const [justEvaluated, setJustEvaluated] = useState(false)

  const appendValue = (value) => {
    setExpression((current) => {
      if (justEvaluated && /[0-9.(]/.test(value)) {
        setJustEvaluated(false)
        return value
      }
      setJustEvaluated(false)
      return current + value
    })
  }

  const clearAll = () => {
    setExpression('')
    setResult('0')
    setJustEvaluated(false)
  }

  const deleteLast = () => {
    setExpression((current) => current.slice(0, -1))
    setJustEvaluated(false)
  }

  const evaluateExpression = () => {
    const safeExpression = expression.replace(/\s+/g, '')
    if (!safeExpression) return

    if (!/^[0-9+\-*/().]+$/.test(safeExpression)) {
      setResult(t('calculatorError'))
      setJustEvaluated(true)
      return
    }

    try {
      const value = Function(`"use strict"; return (${safeExpression})`)()
      if (!Number.isFinite(value)) throw new Error('Invalid result')
      const nextResult = Number(value.toFixed(10)).toString()
      setResult(nextResult)
      setExpression(nextResult)
      setJustEvaluated(true)
    } catch {
      setResult(t('calculatorError'))
      setJustEvaluated(true)
    }
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      const { key } = event
      if (/^[0-9+\-*/().]$/.test(key)) {
        event.preventDefault()
        appendValue(key)
        return
      }
      if (key === 'Enter') {
        event.preventDefault()
        evaluateExpression()
      }
      if (key === 'Backspace') {
        event.preventDefault()
        deleteLast()
      }
      if (key === 'Escape') {
        event.preventDefault()
        clearAll()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [expression, justEvaluated])

  const helperText = useMemo(
    () => (lang === 'zh' ? '支持键盘输入、括号与小数。' : 'Supports keyboard input, brackets, and decimals.'),
    [lang]
  )

  const handleButton = (value) => {
    if (value === 'C') return clearAll()
    if (value === 'DEL') return deleteLast()
    if (value === '=') return evaluateExpression()
    appendValue(value)
  }

  return (
    <div className="min-h-screen midnight-bg text-paper">
      <Navbar />

      <main className="px-6 pb-24 pt-28 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="flex flex-col justify-between rounded-[2.8rem] border border-paper/10 bg-paper/[0.06] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur md:p-10">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-paper/45">
                {t('portfolio')}
              </p>
              <h1 className="mt-4 font-display text-5xl leading-none md:text-7xl">
                {t('calculatorTitle')}
              </h1>
              <p className="mt-6 max-w-lg text-sm leading-8 text-paper/65">
                {t('calculatorIntro')}
              </p>
            </div>

            <div className="mt-10 space-y-4">
              <div className="rounded-[2rem] border border-paper/10 bg-paper/[0.04] p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-paper/40">
                  {t('calculatorTips')}
                </p>
                <p className="mt-3 text-sm leading-7 text-paper/70">{helperText}</p>
              </div>

              <div className="rounded-[2rem] border border-paper/10 bg-gradient-to-br from-accent/20 to-transparent p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-paper/40">
                  {t('calculatorPath')}
                </p>
                <p className="mt-3 font-display text-3xl">/calculator</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2.8rem] border border-paper/10 bg-[#11161b]/88 p-5 shadow-[0_36px_100px_rgba(0,0,0,0.34)] backdrop-blur md:p-6">
            <div className="rounded-[2.2rem] border border-paper/8 bg-black/30 p-6 md:p-8">
              <div className="rounded-[1.8rem] bg-[#0b0f13] px-5 py-6 shadow-inner">
                <p className="min-h-[1.5rem] break-all text-right font-mono text-sm tracking-[0.18em] text-paper/35">
                  {expression || t('calculatorReady')}
                </p>
                <p className="mt-4 break-all text-right font-display text-5xl leading-none md:text-6xl">
                  {result}
                </p>
              </div>

              <div className="mt-6 grid gap-3">
                {BUTTONS.map((row) => (
                  <div key={row.join('-')} className="grid grid-cols-4 gap-3">
                    {row.map((value) => {
                      const accent =
                        value === '='
                          ? 'bg-accent text-paper hover:bg-[#ff6d39]'
                          : ['+', '-', '*', '/', 'C', 'DEL'].includes(value)
                            ? 'bg-paper/10 text-paper hover:bg-paper/16'
                            : 'bg-white/6 text-paper hover:bg-white/10'

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleButton(value)}
                          className={`h-16 rounded-[1.3rem] border border-paper/8 font-mono text-sm uppercase tracking-[0.18em] transition-all duration-200 hover:-translate-y-0.5 ${accent}`}
                        >
                          {value}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
