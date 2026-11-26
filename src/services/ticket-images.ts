import type { TicketImage } from '../types'

export const ticketImageLimit = 3
const formats = ['image/jpeg', 'image/png', 'image/webp']
const maxDataLength = 280_000

export async function readTicketImage(file: File): Promise<TicketImage> {
  if (!formats.includes(file.type) || file.size > 5 * 1024 * 1024) {
    throw new Error('Selecione uma imagem JPG, PNG ou WebP de até 5 MB.')
  }
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Não foi possível abrir esta imagem.')
  })
  try {
    const ratio = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio))
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar a imagem.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    let dataUrl = canvas.toDataURL('image/webp', .82)
    if (dataUrl.length > maxDataLength) dataUrl = canvas.toDataURL('image/webp', .55)
    if (!dataUrl.startsWith('data:image/webp;base64,') || dataUrl.length > maxDataLength) {
      throw new Error('A imagem ainda é grande após a redução. Selecione uma captura menor.')
    }
    return { name: file.name.replace(/\.[^.]+$/, '').slice(0, 96) + '.webp', dataUrl }
  } finally {
    bitmap.close()
  }
}
