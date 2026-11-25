import knowledgeBase from "./data/base-atendimento.json"
import type { Profile, Topic, Ticket } from './types'

export const profiles = {
  colaborador: { title: 'Colaborador', portal: 'Portal do colaborador', description: 'Suporte para acesso à VPN, contas corporativas e Microsoft Teams.', hero: 'Encontre orientações para resolver problemas de acesso e das ferramentas de trabalho.' },
  cliente: { title: 'Cliente', portal: 'Portal do cliente', description: 'Suporte para acesso ao portal, documentação e serviços contratados.', hero: 'Encontre orientações para acessar o portal, consultar documentação e solicitar suporte.' },
} satisfies Record<Profile, object>

export const catalog: Record<Profile, Topic[]> = knowledgeBase

export const seed: Record<Profile, Ticket[]> = {
  colaborador: [
    { id: 'SH-1042', title: 'Acesso à VPN indisponível', category: 'Acesso à VPN', description: 'O aplicativo de VPN encerra a conexão logo após a tentativa de acesso.', priority: 'Normal', status: 'Em atendimento', date: '2026-11-23T13:30:00Z',
      assignee: 'Equipe de conectividade', dueAt: '2026-11-24T16:00:00Z',
      events: [
        { type: 'status', status: 'Em atendimento', at: '2026-11-23T13:50:00Z' },
        { type: 'reply', author: 'Equipe de conectividade', text: 'Recebemos o relato e estamos analisando a tentativa de conexão.', at: '2026-11-23T14:10:00Z' },
        { type: 'attachment', name: 'registro-de-conexao-exemplo.txt', text: 'Registro fictício para demonstração\nTentativa de conexão interrompida antes do estabelecimento da sessão.\nNenhum dado real de rede foi incluído.', at: '2026-11-23T14:15:00Z' },
      ],
    },
    { id: 'SH-1038', title: 'Falha de áudio em reunião', category: 'Microsoft Teams', description: 'O microfone deixou de ser detectado em uma chamada de teste.', priority: 'Normal', status: 'Resolvido', date: '2026-11-20T15:30:00Z',
      assignee: 'Equipe de suporte ao colaborador',
      resolution: 'Foi selecionado o microfone correto nas configurações do Teams. Em uma chamada de teste, o áudio funcionou normalmente.',
      events: [
        { type: 'status', status: 'Em atendimento', at: '2026-11-20T15:45:00Z' },
        { type: 'reply', author: 'Equipe de suporte ao colaborador', text: 'A seleção do microfone foi ajustada em uma chamada de teste.', at: '2026-11-20T16:05:00Z' },
        { type: 'status', status: 'Resolvido', at: '2026-11-20T16:15:00Z' },
      ],
    },
  ],
  cliente: [
    { id: 'SH-2041', title: 'Consulta de documentação do serviço', category: 'Documentação', description: 'Solicitação de orientação para localizar documentação contratual.', priority: 'Normal', status: 'Em atendimento', date: '2026-11-23T14:00:00Z',
      assignee: 'Equipe de atendimento ao cliente', dueAt: '2026-11-25T15:00:00Z',
      events: [{ type: 'status', status: 'Em atendimento', at: '2026-11-23T14:20:00Z' }],
    },
  ],
}
