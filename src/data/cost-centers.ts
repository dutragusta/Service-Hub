import type { CostCenter } from '../types'

export const demoCostCenters: CostCenter[] = [
  {
    code: 'DEMO-100', name: 'Serviços Gerais',
    rules: [{ topic: 'login', queue: 'Acessos · Serviços Gerais', responsible: ['suporte.servicos-gerais@example.test'] }],
  },
  {
    code: 'DEMO-200', name: 'Operações',
    rules: [{ topic: 'login', queue: 'Acessos · Operações', responsible: ['suporte.operacoes@example.test'] }],
  },
]
