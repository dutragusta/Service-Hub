# Apresentar o Service Hub localmente

## Abrir a demonstração

Instale **Node.js 22** na máquina da apresentação. Se você recebeu a versão compilada, extraia todo o ZIP. No Windows, execute `iniciar-demo.cmd`. No macOS ou Linux, abra um terminal na pasta e execute `node scripts/serve-demo.mjs`. Abra **http://127.0.0.1:4173/** e mantenha o terminal aberto.

O pacote compilado inclui a interface, as fontes, a API, a base fictícia e o resumo por regras. Depois de instalar o Node.js e extrair o pacote, é possível executar a apresentação sem internet. No repositório de código-fonte, rode `npm ci` e `npm run build` uma vez antes de `npm run demo`.

Use o mesmo navegador e o mesmo endereço durante toda a demonstração. Os chamados da apresentação são salvos localmente nessa origem. Para começar com os exemplos iniciais, use um novo perfil de navegador ou uma nova sessão anônima.

## Roteiro principal

1. Entre como **colaborador**, escolha **Explorar demonstração** e abra o **Assistente**.
2. Em **Testar um caso fictício**, selecione **VPN expira antes de concluir a conexão**. O assistente identifica a intenção, consulta o catálogo carregado da API local e faz uma pergunta de diagnóstico.
3. Responda **Sim** para indicar que um site público abre. Mostre as orientações e clique na fonte **KB-COL-101 · Rev. 2.1**. O artigo exibe revisão, equipe responsável e condição de encaminhamento. Volte ao assistente.
4. Clique em **Continuo com o problema** e em **Revisar e abrir chamado**. Use **Preencher evidências fictícias** e confira o relato, o início às 08h40, a mensagem, o resultado nas duas redes e o impacto no relatório. Registre o chamado.
5. Abra **Fila de suporte**, selecione o protocolo recém-criado e mostre o **Resumo para o suporte**. O resumo guarda a referência da base, separa testes feitos de orientações apresentadas e indica lacunas quando faltam dados. Confira a fila **Conectividade · Serviços Gerais**.
6. Clique em **Assumir chamado**. Registre uma solução fictícia como “A equipe reaplicou a configuração de acesso. O solicitante confirmou conexão estável e acesso à intranet.” Clique em **Registrar solução e resolver** e use **Ver como solicitante** para mostrar a atualização e a linha do tempo do mesmo protocolo.

## Caminhos adicionais

| Caso | O que mostrar |
| --- | --- |
| Teams sem áudio | Selecione o caso no assistente, confirme que funciona no navegador e conclua com **Sim, resolveu**. O atendimento se resolve com uma referência e sem abrir chamado. |
| Declaração para auditoria | No assistente do cliente, selecione **Pedido de declaração para auditoria**. O pedido vai para triagem humana. O fluxo preserva o relato e indica que a equipe precisa validar o procedimento e a autorização. |
| Retorno por e-mail | Em **Ver demonstração por e-mail**, simule o recebimento e selecione **Ainda preciso de ajuda**. A continuação acontece no mesmo protocolo, com resumo para o analista. |

## O que funciona neste ambiente

A API local lê registros fictícios, com escopo por perfil. O assistente aplica regras ao catálogo recebido e exibe a referência. O backend local monta o resumo detalhado a partir dos fatos informados. O papel de analista é simulado e fica disponível nesta execução em loopback. O painel administrativo, convites e cadastro autenticado dependem da hospedagem com controle de acesso.

A integração com modelo externo é opcional no servidor da hospedagem. A edição offline usa regras e não faz chamadas externas. Registro de chamados, troca de status e notificações do protótipo têm persistência no navegador. Banco compartilhado, autenticação corporativa e integrações de atendimento exigem homologação.
