import { createContext, useContext } from 'react'

const SiteContext = createContext(null)

export function SiteProvider({ value, children }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useHAgencySite() {
  const context = useContext(SiteContext)
  if (!context) throw new Error('useHAgencySite must be used inside SiteProvider')
  return context
}
