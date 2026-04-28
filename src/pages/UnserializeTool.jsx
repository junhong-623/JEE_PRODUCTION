import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useLang } from '../contexts/LangContext'

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })

export default function UnserializeTool() {
  const { t } = useLang()
  const [format, setFormat] = useState('json')
  const [mode, setMode] = useState('serialize')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState('')
  const [isError, setIsError] = useState(false)
  const [copied, setCopied] = useState(false)

  const runTransform = () => {
    setStatus('')
    setIsError(false)
    setCopied(false)

    try {
      const nextOutput = transformValue({ format, mode, input })
      setOutput(nextOutput)
      setStatus(t('toolSuccess'))
    } catch (error) {
      setOutput('')
      setIsError(true)
      setStatus(buildFriendlyError({ t, format, mode, error }))
    }
  }

  const copyOutput = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const clearAll = () => {
    setInput('')
    setOutput('')
    setStatus('')
    setIsError(false)
    setCopied(false)
  }

  return (
    <div className="min-h-screen midnight-bg text-paper">
      <Navbar />

      <main className="px-6 pb-24 pt-28 md:px-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="rounded-[2.8rem] border border-paper/10 bg-paper/[0.05] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur md:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-paper/45">
              {t('portfolio')}
            </p>
            <h1 className="mt-4 font-display text-5xl leading-none md:text-7xl">
              {t('unserializeTitle')}
            </h1>
            <p className="mt-6 max-w-3xl text-sm leading-8 text-paper/65">
              {t('unserializeIntro')}
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="rounded-[2.4rem] border border-paper/10 bg-[#11161b]/88 p-6 shadow-[0_36px_100px_rgba(0,0,0,0.34)] backdrop-blur">
              <div className="space-y-6">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-paper/40">
                    {t('toolFormat')}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {['json', 'php'].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormat(value)}
                        className={`rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] transition-colors ${
                          format === value ? 'bg-accent text-paper' : 'border border-paper/12 text-paper/65 hover:border-paper/30'
                        }`}
                      >
                        {value === 'json' ? 'JSON' : 'PHP serialize'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-paper/40">
                    {t('toolMode')}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {['serialize', 'unserialize'].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMode(value)}
                        className={`rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] transition-colors ${
                          mode === value ? 'bg-paper text-ink' : 'border border-paper/12 text-paper/65 hover:border-paper/30'
                        }`}
                      >
                        {value === 'serialize' ? t('serializeAction') : t('unserializeAction')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-paper/10 bg-paper/[0.04] p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-paper/40">
                    {t('toolHowItWorks')}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-paper/68">
                    {format === 'json'
                      ? (mode === 'serialize' ? t('jsonSerializeHelp') : t('jsonUnserializeHelp'))
                      : (mode === 'serialize' ? t('phpSerializeHelp') : t('phpUnserializeHelp'))}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={runTransform}
                  className="w-full rounded-full bg-accent px-5 py-3 font-mono text-xs uppercase tracking-[0.24em] text-paper transition-colors hover:bg-[#ff6d39]"
                >
                  {mode === 'serialize' ? t('serializeAction') : t('unserializeAction')}
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                  className="w-full rounded-full border border-paper/12 px-5 py-3 font-mono text-xs uppercase tracking-[0.24em] text-paper/72 transition-colors hover:border-paper/28 hover:text-paper"
                >
                  {t('clear')}
                </button>

                {status && (
                  <p className={`text-sm ${isError ? 'text-orange-300' : 'text-emerald-300'}`}>
                    {status}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6">
              <Panel
                title={t('toolInput')}
                value={input}
                onChange={setInput}
                placeholder={format === 'json' ? '{\n  "name": "Jee"\n}' : 'a:1:{s:4:"name";s:3:"Jee";}'}
              />
              <div className="rounded-[2.4rem] border border-paper/10 bg-[#11161b]/88 p-6 shadow-[0_36px_100px_rgba(0,0,0,0.34)] backdrop-blur">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-paper/40">
                      {t('toolOutput')}
                    </p>
                    <h2 className="mt-2 font-display text-3xl">{t('toolResult')}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={copyOutput}
                    className="rounded-full border border-paper/12 px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] text-paper/70 transition-colors hover:border-paper/30"
                  >
                    {copied ? t('copied') : t('copy')}
                  </button>
                </div>

                <textarea
                  value={output}
                  readOnly
                  rows={14}
                  className="min-h-[20rem] w-full resize-y rounded-[1.7rem] border border-paper/10 bg-black/30 px-5 py-4 font-mono text-sm leading-7 text-paper outline-none"
                  placeholder={t('toolOutputPlaceholder')}
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function Panel({ title, value, onChange, placeholder }) {
  const { t } = useLang()

  return (
    <div className="rounded-[2.4rem] border border-paper/10 bg-[#11161b]/88 p-6 shadow-[0_36px_100px_rgba(0,0,0,0.34)] backdrop-blur">
      <div className="mb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-paper/40">
          {title}
        </p>
        <h2 className="mt-2 font-display text-3xl">{t('toolEditor')}</h2>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={14}
        className="min-h-[20rem] w-full resize-y rounded-[1.7rem] border border-paper/10 bg-black/30 px-5 py-4 font-mono text-sm leading-7 text-paper outline-none"
        placeholder={placeholder}
      />
    </div>
  )
}

function transformValue({ format, mode, input }) {
  if (format === 'json') {
    const parsed = parseJsonInput(input)
    return mode === 'serialize' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2)
  }

  if (mode === 'serialize') {
    const parsed = parseJsonInput(input)
    return phpSerialize(parsed)
  }

  return JSON.stringify(parsePhpSerialized(input), null, 2)
}

function buildFriendlyError({ t, format, mode, error }) {
  if (format === 'php' && mode === 'serialize') {
    if (error instanceof SyntaxError) {
      return t('phpSerializeInputError')
    }
    return `${t('phpSerializeError')} ${error?.message || ''}`.trim()
  }

  if (format === 'php' && mode === 'unserialize') {
    return `${t('phpUnserializeError')} ${error?.message || ''}`.trim()
  }

  if (format === 'json' && mode === 'serialize') {
    return `${t('jsonSerializeError')} ${error?.message || ''}`.trim()
  }

  return `${t('jsonUnserializeError')} ${error?.message || ''}`.trim()
}

function parseJsonInput(input) {
  return JSON.parse(input)
}

function phpSerialize(value) {
  if (value === null) return 'N;'
  if (typeof value === 'boolean') return `b:${value ? 1 : 0};`
  if (typeof value === 'number') return Number.isInteger(value) ? `i:${value};` : `d:${value};`
  if (typeof value === 'string') return `s:${encoder.encode(value).length}:"${value}";`

  if (Array.isArray(value)) {
    const items = value.map((item, index) => phpSerialize(index) + phpSerialize(item)).join('')
    return `a:${value.length}:{${items}}`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
    const items = entries.map(([key, item]) => phpSerialize(normalizePhpObjectKey(key)) + phpSerialize(item)).join('')
    return `a:${entries.length}:{${items}}`
  }

  throw new Error('Unsupported value for PHP serialize.')
}

function normalizePhpObjectKey(key) {
  return /^-?\d+$/.test(key) ? Number(key) : String(key)
}

function parsePhpSerialized(input) {
  const parser = createPhpParser(input)
  const result = parser.parseValue()
  parser.ensureFinished()
  return result
}

function createPhpParser(input) {
  const bytes = encoder.encode(input.trim())
  let index = 0

  const isDigit = (byte) => byte >= 48 && byte <= 57

  const ensureByte = (byte, message) => {
    if (bytes[index] !== byte) {
      throw new Error(message)
    }
    index += 1
  }

  const readAsciiUntil = (delimiter) => {
    const start = index
    while (index < bytes.length && bytes[index] !== delimiter) {
      index += 1
    }
    if (index >= bytes.length) {
      throw new Error('Unexpected end of PHP serialized value.')
    }
    const value = decoder.decode(bytes.slice(start, index))
    index += 1
    return value
  }

  const readNumber = (delimiter) => {
    const value = readAsciiUntil(delimiter)
    if (!value || !/^[-]?\d+$/.test(value)) {
      throw new Error(`Invalid numeric value "${value || ''}".`)
    }
    return Number(value)
  }

  const readFloat = () => {
    const value = readAsciiUntil(59)
    const number = Number(value)
    if (Number.isNaN(number)) {
      throw new Error(`Invalid floating-point value "${value}".`)
    }
    return number
  }

  const readStringByByteLength = (length) => {
    ensureByte(34, 'Expected opening quote for PHP string.')
    const endIndex = index + length
    if (endIndex > bytes.length) {
      throw new Error('PHP string length exceeds available bytes.')
    }

    const value = decoder.decode(bytes.slice(index, endIndex))
    index = endIndex
    ensureByte(34, 'Expected closing quote for PHP string.')
    ensureByte(59, 'Expected semicolon after PHP string.')
    return value
  }

  const parseValue = () => {
    const typeByte = bytes[index]
    if (typeByte == null) {
      throw new Error('Unexpected end of PHP serialized value.')
    }

    index += 1
    const type = String.fromCharCode(typeByte)

    if (type === 'N') {
      ensureByte(59, 'Expected semicolon after null value.')
      return null
    }

    ensureByte(58, `Expected ":" after PHP type "${type}".`)

    if (type === 'b') {
      const value = readAsciiUntil(59)
      if (value !== '0' && value !== '1') {
        throw new Error(`Invalid boolean value "${value}".`)
      }
      return value === '1'
    }

    if (type === 'i') {
      return readNumber(59)
    }

    if (type === 'd') {
      return readFloat()
    }

    if (type === 's') {
      const length = readNumber(58)
      return readStringByByteLength(length)
    }

    if (type === 'a') {
      const count = readNumber(58)
      ensureByte(123, 'Expected "{" to start PHP array.')
      const pairs = []
      for (let pairIndex = 0; pairIndex < count; pairIndex += 1) {
        const key = parseValue()
        const value = parseValue()
        pairs.push([key, value])
      }
      ensureByte(125, 'Expected "}" to end PHP array.')
      return convertPhpPairs(pairs)
    }

    if (type === 'O') {
      throw new Error('PHP object serialization is not supported yet.')
    }

    throw new Error(`Unsupported PHP serialized type "${type}".`)
  }

  const ensureFinished = () => {
    while (index < bytes.length && [9, 10, 13, 32].includes(bytes[index])) {
      index += 1
    }
    if (index !== bytes.length) {
      throw new Error('Unexpected trailing characters after PHP value.')
    }
  }

  return {
    parseValue,
    ensureFinished,
    isDigit,
  }
}

function convertPhpPairs(pairs) {
  const isSequentialArray = pairs.every(([key], pairIndex) => key === pairIndex)

  if (isSequentialArray) {
    return pairs.map(([, value]) => value)
  }

  return Object.fromEntries(pairs.map(([key, value]) => [String(key), value]))
}
