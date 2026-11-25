import { ArrowUp } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'

export default function PromptBar({ onSend, describedBy }: {
  onSend: (text: string) => boolean
  describedBy: string
}) {
  const [draft, setDraft] = useState('')
  const input = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const field = input.current
    if (!field) return
    field.style.height = 'auto'
    field.style.height = Math.min(field.scrollHeight, 126) + 'px'
  }, [draft])

  function send() {
    if (draft.trim() && onSend(draft.trim())) setDraft('')
    input.current?.focus()
  }

  return <form className="prompt-composer" onSubmit={(event) => { event.preventDefault(); send() }}>
    <textarea ref={input} rows={1} maxLength={500} aria-label="Sua mensagem" aria-describedby={describedBy}
      placeholder="Descreva o problema que você está enfrentando"
      value={draft} onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
          event.preventDefault()
          send()
        }
      }} />
    <button type="submit" aria-label="Enviar" disabled={!draft.trim()}><ArrowUp size={21} aria-hidden /></button>
  </form>
}
