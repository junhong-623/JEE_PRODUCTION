import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import LoadingScreen from '../../src/jsave/components/LoadingScreen'
import { LangProvider } from '../../src/jsave/contexts/LangContext'

function render(language) {
  return renderToStaticMarkup(
    React.createElement(
      LangProvider,
      { initialLang: language },
      React.createElement(LoadingScreen),
    ),
  )
}

describe('JSave startup screen', () => {
  it('announces a branded English loading state', () => {
    const html = render('en')
    expect(html).toContain('role="status"')
    expect(html).toContain('Spend clearly. Save calmly.')
    expect(html).toContain('Preparing your space')
  })

  it('uses the selected Chinese language', () => {
    const html = render('zh')
    expect(html).toContain('花得清楚，存得从容。')
    expect(html).toContain('正在准备你的空间')
  })
})
