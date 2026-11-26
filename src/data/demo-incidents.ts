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
    // Cenários adaptados da base sintética de Offmoura/Hackathon (casos 1, 7, 14, 16 e 27).
    {
      id: 'segunda-via-boleto', topic: 'boleto', title: 'Segunda via de boleto que vence amanhã',
      opening: 'Não encontrei o boleto deste mês. A cobrança vence amanhã e preciso da segunda via.',
      description: 'O boleto deste mês vence amanhã. Preciso da segunda via para programar o pagamento.',
      startedAt: 'Percebi hoje ao conferir os pagamentos do mês.',
      environment: 'Área de cobranças no portal do cliente.',
      scope: 'Uma cobrança da empresa.',
      impact: 'O pagamento ainda não pode ser agendado.',
      errorMessage: 'A cobrança aparece na lista, mas o PDF não está disponível.',
      tests: 'Conferi a área de cobranças e procurei pelo boleto no e-mail de faturamento.',
      priority: 'Normal',
    },
    {
      id: 'correcao-nota-fiscal', topic: 'nota-fiscal', title: 'Nota fiscal saiu com a razão social antiga',
      opening: 'Recebemos uma nota fiscal com a razão social antiga. Como solicito a correção?',
      description: 'A nota fiscal mais recente foi emitida com a razão social anterior. A contabilidade precisa da orientação para corrigir o documento.',
      startedAt: 'Hoje, durante a conferência da nota recebida.',
      environment: 'PDF da nota fiscal e cadastro da empresa no portal.',
      scope: 'Uma nota fiscal.',
      impact: 'A contabilidade aguarda a confirmação de como corrigir o documento.',
      errorMessage: 'A razão social no documento é diferente da que aparece no cadastro.',
      tests: 'Comparei a nota com os dados atuais da empresa no portal.',
      priority: 'Normal',
    },
    {
      id: 'copia-contrato', topic: 'contrato', title: 'Cópia assinada do contrato vigente',
      opening: 'Preciso de uma cópia assinada do contrato atual. No portal só encontrei a proposta comercial.',
      description: 'Estamos revisando os documentos do serviço e precisamos da versão assinada do contrato vigente.',
      startedAt: 'Nesta manhã, durante a revisão dos documentos.',
      environment: 'Área de documentos do portal do cliente.',
      scope: 'Um contrato de prestação de serviços.',
      impact: 'A revisão interna aguarda o documento assinado.',
      errorMessage: 'A área de documentos mostra somente a proposta comercial.',
      tests: 'Consultei os documentos do serviço e conferi os arquivos disponíveis.',
      priority: 'Normal',
    },
    {
      id: 'cobranca-duplicada', topic: 'financeiro', title: 'Cobrança em duplicidade na fatura',
      opening: 'A fatura deste mês veio com uma cobrança em duplicidade. Podem conferir se cabe estorno?',
      description: 'O mesmo serviço aparece duas vezes na fatura deste mês, com o mesmo valor. Preciso que confiram a cobrança e orientem o próximo passo.',
      startedAt: 'Hoje, na conferência da fatura mensal.',
      environment: 'Fatura baixada no portal do cliente.',
      scope: 'Dois lançamentos na mesma fatura.',
      impact: 'A aprovação do pagamento ficou pendente até a conferência dos lançamentos.',
      errorMessage: 'O serviço aparece em duas linhas com o mesmo valor.',
      tests: 'Comparei a descrição, o período e o valor dos lançamentos.',
      priority: 'Normal',
    },
    {
      id: 'erro-exportacao', topic: 'servicos', title: 'Erro 500 ao exportar relatório mensal',
      opening: 'A exportação do relatório mensal falha com erro 500 para toda a equipe desde as 09h.',
      description: 'Desde as 09h, a plataforma mostra erro 500 ao exportar o relatório mensal. Precisamos do arquivo para concluir o fechamento.',
      startedAt: 'Hoje, desde as 09h, em todas as tentativas.',
      environment: 'Tela de relatórios da plataforma.',
      scope: 'Duas pessoas da mesma equipe confirmaram a falha.',
      impact: 'O fechamento mensal está parado até que a equipe consiga exportar o arquivo.',
      errorMessage: 'Erro 500 ao clicar em Exportar.',
      tests: 'Recarregamos a página e tentamos em dois navegadores. A consulta funciona, mas a exportação falha.',
      priority: 'Alta',
    },
  ],
}
