import type { IncidentDetails, Priority, Profile } from '../types'

type DemoIncident = Required<IncidentDetails> & {
  id: string
  topic: string
  title: string
  description: string
  opening: string
  priority: Priority
  center?: string
}

export const demoIncidents: Record<Profile, DemoIncident[]> = {
  colaborador: [
    {
      id: 'vpn', topic: 'vpn', title: 'VPN expira antes de concluir a conexão',
      opening: 'Desde as 08h40 a VPN expira ao conectar no notebook. Preciso acessar a intranet para conferir um relatório até as 10h.',
      description: 'A VPN passou a expirar na conexão. O acesso à intranet fica indisponível durante o trabalho remoto.',
      startedAt: 'Hoje às 08h40 (horário de Brasília). Falha em todas as tentativas desde então.',
      environment: 'Notebook de demonstração com Windows 11. Falha observada no Wi-Fi residencial e em uma segunda rede.',
      scope: 'Um colaborador confirmou a falha. A situação dos demais ainda não foi verificada.',
      impact: 'A conferência de um relatório interno com entrega às 10h está parada.',
      errorMessage: 'Tempo limite da conexão atingido.',
      tests: 'Wi-Fi residencial: site público abriu normalmente. Em uma segunda rede, site público também abriu. A VPN expirou nas duas redes depois de reiniciar o aplicativo.',
      priority: 'Alta', center: 'DEMO-100',
    },
    {
      id: 'login', topic: 'login', title: 'Conta permanece bloqueada após recuperação',
      opening: 'Minha conta está bloqueada. Concluí a recuperação às 09h32 e a mensagem de bloqueio apareceu de novo.',
      description: 'A conta continua bloqueada ao tentar acessar o ambiente de trabalho, mesmo após a confirmação da recuperação.',
      startedAt: 'Hoje às 09h15. O bloqueio apareceu novamente na tentativa das 09h32.',
      environment: 'Notebook de demonstração com Windows 11. Página de entrada aberta no navegador.',
      scope: 'Uma conta envolvida. Outra pessoa da equipe informou acesso normal usando sua própria conta.',
      impact: 'O registro de uma solicitação interna foi adiado. A atividade pode ser retomada pela equipe.',
      errorMessage: 'Conta temporariamente bloqueada.',
      tests: 'Página de recuperação abriu em janela privativa e exibiu confirmação. Nova tentativa em janela privativa retornou o bloqueio. Nenhum segredo foi compartilhado.',
      priority: 'Normal', center: 'DEMO-200',
    },
    {
      id: 'teams', topic: 'teams', title: 'Teams não capta áudio no aplicativo',
      opening: 'O microfone do Teams fica mudo no aplicativo. O mesmo headset funciona no navegador.',
      description: 'Na reunião de teste, o aplicativo desktop do Teams deixa o microfone mudo. O mesmo equipamento capta áudio no navegador.',
      startedAt: 'Hoje às 14h05, em duas chamadas de teste consecutivas.',
      environment: 'Teams desktop em notebook de demonstração no Windows 11, com headset USB.',
      scope: 'Uma estação de trabalho. Os demais participantes conseguiam falar na reunião de teste.',
      impact: 'O colaborador entrou pelo navegador e conseguiu participar. Precisa restabelecer o aplicativo desktop.',
      errorMessage: 'Sem mensagem de erro. O nível de entrada do aplicativo permanece zerado.',
      tests: 'Headset gravou áudio no sistema. O navegador captou áudio com o mesmo headset. Selecionar o dispositivo no Teams desktop e reabrir o aplicativo não resolveu.',
      priority: 'Normal',
    },
  ],
  cliente: [
    {
      id: 'portal', topic: 'portal', title: 'Portal recusa acesso após recuperação',
      opening: 'Desde as 10h20 o portal recusa o acesso depois que concluo a recuperação da conta.',
      description: 'A página de entrada abre, mas a conta da empresa de demonstração recebe acesso negado após a recuperação.',
      startedAt: 'Hoje às 10h20. O mesmo problema ocorreu às 10h45 após a recuperação.',
      environment: 'Navegador autorizado de demonstração, em janela normal e privativa.',
      scope: 'Um cliente relatou a falha. O acesso de outros usuários ainda não foi confirmado.',
      impact: 'O cliente precisa consultar o andamento de uma solicitação antes das 12h.',
      errorMessage: 'Acesso indisponível para esta conta.',
      tests: 'Endereço oficial de demonstração abriu nas duas janelas. O portal confirmou a recuperação e voltou a recusar o acesso.',
      priority: 'Normal',
    },
    {
      id: 'solicitacao-especial', topic: 'outro', title: 'Pedido de declaração para auditoria',
      opening: 'Preciso de uma declaração assinada do histórico de atendimento para uma auditoria.',
      description: 'A empresa de demonstração pediu uma declaração assinada sobre o histórico de atendimento de um período fictício.',
      startedAt: 'Pedido recebido hoje às 11h30.',
      environment: 'Solicitação administrativa no portal do cliente.',
      scope: 'Um cliente. Pedido sem falha técnica ou indisponibilidade do portal.',
      impact: 'A equipe do cliente precisa do documento para uma simulação de auditoria na próxima semana.',
      errorMessage: 'Sem erro técnico. Pedido fora dos procedimentos do catálogo.',
      tests: 'O solicitante procurou por declaração e auditoria na base do cliente e não encontrou instruções aplicáveis.',
      priority: 'Normal',
    },
  ],
}
