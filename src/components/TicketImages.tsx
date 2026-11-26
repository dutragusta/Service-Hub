import { useState } from 'react'
import { readTicketImage, ticketImageLimit } from '../services/ticket-images'
import type { TicketImage } from '../types'

export function TicketImages({ images, onChange, existing = 0, onReading }: {
  images: TicketImage[]
  onChange: (images: TicketImage[]) => void
  existing?: number
  onReading: (reading: boolean) => void
}) {
  const [error, setError] = useState('')
  const [reading, setReading] = useState(false)
  const remaining = ticketImageLimit - existing - images.length

  async function add(files: File[]) {
    setError('')
    if (!files.length) return
    if (files.length > remaining) {
      setError('O chamado aceita até três imagens.')
      return
    }
    setReading(true)
    onReading(true)
    try {
      onChange([...images, ...await Promise.all(files.map(readTicketImage))])
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível anexar a imagem.')
    } finally {
      setReading(false)
      onReading(false)
    }
  }

  return <div className="incident-fields">
    <label>Imagens (opcional)
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={reading || remaining < 1}
        onChange={(event) => { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ''; void add(files) }} />
      <small>Até três imagens por chamado. JPG, PNG ou WebP de até 5 MB por arquivo.</small>
    </label>
    {reading && <p role="status">Preparando imagens…</p>}
    {error && <p className="field-error" role="alert">{error}</p>}
    {images.length > 0 && <ul className="ticket-image-list">{images.map((image, index) =>
      <li key={index}><img src={image.dataUrl} alt="" /><span>{image.name}</span>
        <button type="button" className="text-button" disabled={reading} aria-label={'Remover ' + image.name}
          onClick={() => { setError(''); onChange(images.filter((_, item) => item !== index)) }}>Remover</button>
      </li>)}</ul>}
  </div>
}
