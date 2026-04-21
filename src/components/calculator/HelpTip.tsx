'use client'

import { useId } from 'react'

type Props = {
  text: string
  /** 'help' = blue ?, 'info' = gray (i) like reference form */
  icon?: 'help' | 'info'
}

/** Short, plain-English hint on hover/focus (accessible). */
export default function HelpTip({ text, icon = 'help' }: Props) {
  const tipId = useId()
  return (
    <span
      className={icon === 'info' ? 'cic-help-tip cic-help-tip--info' : 'cic-help-tip'}
      tabIndex={0}
      aria-describedby={tipId}
    >
      <span className="cic-help-tip__trigger" aria-hidden>
        {icon === 'info' ? 'i' : '?'}
      </span>
      <span id={tipId} className="cic-help-tip__bubble" role="tooltip">
        {text}
      </span>
    </span>
  )
}
