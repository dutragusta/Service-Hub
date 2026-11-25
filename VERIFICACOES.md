# Verificações do Service Hub

Verificações executadas no desenvolvimento em 23 de novembro de 2026.

| Verificação | Resultado observado |
| --- | --- |
| Compilação | TypeScript e Vite concluíram. O Vite emitiu avisos sobre diretivas internas de React Router, sem interromper a compilação. |
| Colaborador, VPN | Assistente reconheceu o assunto, apresentou orientação, encaminhou para diagnóstico guiado e permitiu registrar um chamado depois da tentativa de resolução. |
| Colaborador, login e senha | Mensagem livre identificou o assunto, resposta negativa acionou orientação contextual e o usuário conseguiu marcar a conversa como resolvida. |
| Colaborador, Teams | O assistente perguntou sobre o navegador autorizado, preservou o contexto ao sair e voltar e apresentou orientação correspondente à resposta. |
| Formulário e persistência | A ausência de descrição acionou erro. Após o preenchimento, o chamado apareceu com número, status e histórico e permaneceu disponível após recarregar. |
| Cliente | Busca por VPN mostrou ausência de resultados. Busca de documentação sem acento encontrou o artigo. O portal permitiu abrir e consultar um chamado referente a acesso ao portal. |
| Separação dos perfis | O portal do cliente exibiu seu próprio catálogo e bloqueou na interface a exibição do chamado de VPN por URL. |
| Layout | Revisão visual em Chromium desktop e em quadros de 320 e 768 pixels. A medição do formulário estreito e do portal do cliente confirmou a ausência de rolagem horizontal. O menu abaixo de 420 pixels foi reorganizado em duas colunas após a revisão. |
| Teclado | Enter enviou a mensagem do assistente e ativou o atalho de pular para o conteúdo, que moveu o foco para a área principal. |

A revisão de acessibilidade foi pontual, com foco, navegação por teclado, rótulos e mensagens de validação. Ainda não foi feita auditoria completa de conformidade WCAG 2.2 AA, teste em leitor de tela dedicado ou validação em dispositivo físico e ultrawide.

## Revisão de prontidão — 24/11/2026

Referência: regulamento entregue com o projeto. A revisão cobre requisitos técnicos e de entrega. Elegibilidade, autorização de ferramentas, nota e aceite cabem à organização.

| Requisito | Evidência atual | Pendência |
| --- | --- | --- |
| §5 e §10 · Ambientes, dados e autorização | O site hospedado tem acesso restrito. A demonstração usa dados fictícios. | Confirmar formalmente hospedagem, autenticação, repositório e dados autorizados. Usar um repositório autorizado e privado para material interno e comprovar acesso dos avaliadores. |
| §7 · Solução executável e versão | O código compila com `npm run build`. O README descreve execução local. | Reproduzir a implantação em homologação aprovada, fixar o commit final e conferir os acessos. |
| §7 · Apresentação, vídeo e dossiê | Existe um roteiro de demonstração e registros técnicos no repositório. | Entregar PDF de até 10 slides, vídeo narrado de até 3 minutos, solução executável versionada e dossiê completo. A janela vai de 27/11 às 9h a 30/11 às 18h, em Brasília. |
| §8 · Controle de acesso | APIs exigem sessão. A verificação compara o e-mail digitado ao autenticado. Revisão de cadastro é administrativa e cadastros não concedem perfil de equipe. | Validar identidade corporativa e acesso ao portal por empresa. Chamados da demonstração estão no navegador e não têm segregação por conta no servidor. |
| §8 · Integrações, operação e evidências | O assistente usa regras e catálogo local. A API registra erros internos de forma resumida, sem conteúdo do formulário. | Validar abertura e consulta no sistema de chamados de homologação com o mesmo protocolo, documentar operação e alertas e executar um teste de rollback. chat externo, ERP e e-mail continuam fora do fluxo real. |
| §10 · Dependências e propriedade intelectual | Licenças das dependências diretas principais verificadas: React, React DOM, React Router e Vite (MIT), Lucide (ISC), TypeScript (Apache-2.0), Manrope (OFL-1.1). | Consolidar licenças transitivas, ativos de marca, permissões e custos de hospedagem e integrações. |

**Testes desta revisão.** Compilação TypeScript/Vite, `git diff --check` e `npm audit` concluídos. O `npm audit` retornou zero alertas de dependências na execução, com alcance limitado ao catálogo do npm. Na API local com SQLite em memória, foram validados sessão ausente, e-mail divergente, origem divergente, cadastro, duplicidade, aprovação e bloqueio para perfil de suporte. Na prévia do navegador, com respostas sintéticas, foram validados os campos e o resultado em análise para ambos os perfis. O login real com novas contas não foi exercitado nessa verificação.

**Prioridade de homologação.** Demonstrar Portal → sistema de chamados → Analista → Portal com dados sintéticos, autenticação aprovada e histórico compartilhado no servidor. Registrar sinais de erro e reimplantar a versão anterior em homologação como ensaio de rollback. A prontidão para produção continua pendente de evidências. O regulamento estabelece mínimo de 80/100 geral, 70/100 em prontidão e ausência de veto.
