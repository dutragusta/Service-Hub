type DemoCustomer = { name: string, company: string, email: string }

const accountsKey = 'service-hub-demo-customer-accounts-v1'
const sessionKey = 'service-hub-demo-customer-session-v1'

function readAccounts(): DemoCustomer[] {
  return JSON.parse(localStorage.getItem(accountsKey) ?? '[]')
}

export function enterDemoCustomer(email: string, registration?: { name: string, company: string }) {
  if (!/^[a-z0-9._+-]+@example\.test$/i.test(email)) throw new Error('Use um e-mail fictício terminado em @example.test.')
  const normalizedEmail = email.toLowerCase()
  const accounts = readAccounts()
  const existing = accounts.find((account) => account.email === normalizedEmail)
  if (registration) {
    const { name, company } = registration
    if (!name || !company) throw new Error('Informe um nome e uma empresa fictícios.')
    if (existing) throw new Error('Esse e-mail já foi cadastrado neste navegador. Use Entrar.')
    localStorage.setItem(accountsKey, JSON.stringify([...accounts, { name, company, email: normalizedEmail }]))
    return
  }
  if (!existing) throw new Error('Conta de demonstração não encontrada. Crie um cadastro neste navegador.')
  sessionStorage.setItem(sessionKey, normalizedEmail)
}

export function currentDemoCustomer() {
  try {
    const email = sessionStorage.getItem(sessionKey)
    return readAccounts().find((account) => account.email === email)
  } catch {
    return undefined
  }
}

export function leaveDemoCustomer() {
  sessionStorage.removeItem(sessionKey)
}
