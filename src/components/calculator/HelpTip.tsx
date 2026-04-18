'use client'

import { useId } from 'react'

type Props = {
  text: string
}

/** Short, plain-English hint on hover/focus (accessible). */
export default function HelpTip({ text }: Props) {
  const tipId = useId()
  return (
    <span className="cic-help-tip" tabIndex={0} aria-describedby={tipId}>
      <span className="cic-help-tip__trigger" aria-hidden>
        ?
      </span>
      <span id={tipId} className="cic-help-tip__bubble" role="tooltip">
        {text}
      </span>
    </span>
  )
}
