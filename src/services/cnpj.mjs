export function validCnpj(value) {
  if (typeof value !== 'string' || !/^[0-9A-Za-z./-]{14,18}$/.test(value.trim())) return null
  const cnpj = value.trim().toUpperCase().replace(/[./-]/g, '')
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return null

  function digit(base) {
    const sum = Array.from(base).reduce((total, char, index) => {
      const weight = (base.length - 1 - index) % 8 + 2
      return total + (char.charCodeAt(0) - 48) * weight
    }, 0)
    const remainder = sum % 11
    return remainder < 2 ? '0' : String(11 - remainder)
  }

  const base = cnpj.slice(0, 12)
  const first = digit(base)
  return cnpj.endsWith(first + digit(base + first)) ? cnpj : null
}
