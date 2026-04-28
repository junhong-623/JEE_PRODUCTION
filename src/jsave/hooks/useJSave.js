import { useContext } from 'react'
import { JSaveContext } from '../contexts/JSaveContext'

export function useJSave() {
  return useContext(JSaveContext)
}
