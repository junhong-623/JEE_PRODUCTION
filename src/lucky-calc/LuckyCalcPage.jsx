import { useCallback, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import HistoryLookup from './features/HistoryLookup'
import LatestDraws from './features/LatestDraws'
import MoreTools from './features/MoreTools'
import PayoutCalculator from './features/PayoutCalculator'
import QianziLookup from './features/QianziLookup'
import { isValidFourD, sanitizeFourDInput } from './lib/fourD'
import './lucky-calc.css'

const NAV_ITEMS = [
  { id: 'latest', label: '最新开奖', shortLabel: '开奖', icon: '◈' },
  { id: 'history', label: '号码历史', shortLabel: '历史', icon: '⌕' },
  { id: 'qianzi', label: '千字图', shortLabel: '千字图', icon: '▧' },
  { id: 'payout', label: '奖金计算', shortLabel: '奖金', icon: 'RM' },
  { id: 'more', label: '更多工具', shortLabel: '更多', icon: '•••' },
]

const VALID_TABS = new Set(NAV_ITEMS.map(item => item.id))

function getInitialNavigation() {
  const params = new URLSearchParams(window.location.search)
  const tab = params.get('tab')
  const number = sanitizeFourDInput(params.get('number'))
  return {
    tab: VALID_TABS.has(tab) ? tab : isValidFourD(number) ? 'history' : 'latest',
    number: isValidFourD(number) ? number : '',
  }
}
function updateUrl(tab, number = '') {
  const url = new URL(window.location.href)
  if (tab === 'latest') url.searchParams.delete('tab')
  else url.searchParams.set('tab', tab)
  if (tab === 'history' && isValidFourD(number)) url.searchParams.set('number', number)
  else url.searchParams.delete('number')
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function PrimaryNav({ activeTab, onChange, mobile = false }) {
  return (
    <nav className={mobile ? 'lc-mobile-nav' : 'lc-primary-nav'} aria-label="Lucky Calc 主要功能">
      {NAV_ITEMS.map(item => (
        <button
          type="button"
          key={item.id}
          className={activeTab === item.id ? 'is-active' : ''}
          aria-current={activeTab === item.id ? 'page' : undefined}
          onClick={() => onChange(item.id)}
        >
          <span className="lc-nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{mobile ? item.shortLabel : item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default function LuckyCalcPage() {
  const initial = useMemo(getInitialNavigation, [])
  const [activeTab, setActiveTab] = useState(initial.tab)
  const [historyNumber, setHistoryNumber] = useState(initial.number)

  const navigate = useCallback((tab, number = '') => {
    setActiveTab(tab)
    if (isValidFourD(number)) setHistoryNumber(number)
    updateUrl(tab, number || historyNumber)
    window.scrollTo({ top: 0, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [historyNumber])

  const openHistory = useCallback(number => navigate('history', number), [navigate])
  const syncHistoryUrl = useCallback(number => {
    setHistoryNumber(number)
    updateUrl('history', number)
  }, [])

  return (
    <div className="lc-shell">
      <Helmet>
        <html lang="zh-CN" />
        <title>4D 历史开奖查询与奖金计算器 | Jee Production</title>
        <meta name="description" content="查询 Magnum、Sports Toto 与 Da Ma Cai 最新及历史 4D 开奖记录、千字图与直注奖金。" />
        <meta name="theme-color" content="#10090a" />
        <meta property="og:title" content="4D 历史开奖查询 | Lucky Calc" />
        <meta property="og:description" content="最新开奖、号码历史、千字图与正确的直注奖金计算。" />
        <meta property="og:url" content="https://www.jeeprod.com/lucky-calc" />
        <link rel="canonical" href="https://www.jeeprod.com/lucky-calc" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Lucky Calc',
          url: 'https://www.jeeprod.com/lucky-calc',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          inLanguage: 'zh-CN',
          description: '马来西亚 4D 最新开奖、历史号码与奖金计算工具。',
        })}</script>
      </Helmet>

      <header className="lc-site-header">
        <div className="lc-header-inner">
          <button type="button" className="lc-brand" onClick={() => navigate('latest')} aria-label="Lucky Calc 首页">
            <span className="lc-brand-mark" aria-hidden="true">
              <img src="/luck-calc/lucky-ingot-logo.png" alt="" />
            </span>
            <span><strong>幸运计算器</strong><small>LUCKY CALC · MALAYSIA</small></span>
          </button>
          <PrimaryNav activeTab={activeTab} onChange={navigate} />
        </div>
      </header>

      <main className="lc-main">
        <h1 className="lc-sr-only">4D 历史开奖查询与奖金计算器</h1>
        {activeTab === 'latest' && <LatestDraws onLookup={openHistory} />}
        {activeTab === 'history' && <HistoryLookup initialNumber={historyNumber} onSearched={syncHistoryUrl} />}
        {activeTab === 'qianzi' && <QianziLookup />}
        {activeTab === 'payout' && <PayoutCalculator />}
        {activeTab === 'more' && <MoreTools />}
      </main>

      <footer className="lc-footer">
        <div>
          <strong>21+ · 理性参与</strong>
          <p>本页仅供历史资料查询、工具计算与娱乐用途。历史结果无法预测未来中奖号码。</p>
        </div>
        <a href="https://www.magnum4d.my/our-responsibility/play-responsibly" target="_blank" rel="noreferrer">负责任游戏资讯 ↗</a>
      </footer>

      <PrimaryNav activeTab={activeTab} onChange={navigate} mobile />
    </div>
  )
}
