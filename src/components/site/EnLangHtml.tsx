'use client'

import { useEffect } from 'react'

export function EnLangHtml() {
  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])
  return null
}
