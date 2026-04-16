'use client'

import { useEffect } from 'react'
import { prepareCmsClient, startRevisionPolling } from '@/lib/cms-client'

export function CmsClientBootstrap() {
  useEffect(() => {
    void prepareCmsClient().then(() => startRevisionPolling())
  }, [])
  return null
}
