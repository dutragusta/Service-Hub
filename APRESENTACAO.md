# Apresentar o Service Hub localmente

## Abrir a demonstração

Instale **Node.js 22** na máquina da apresentação. Se você recebeu a versão compilada, extraia todo o ZIP. No Windows, execute `iniciar-demo.cmd`. No macOS ou Linux, abra um terminal na pasta e execute `node scripts/serve-demo.mjs`. Abra **http://127.0.0.1:4173/** e mantenha o terminal aberto.

O pacote compilado inclui a interface, as fontes, a API, a base fictícia e o resumo por regras. Depois de instalar o Node.js e extrair o pacote, é possível executar a apresentação sem internet. No repositório de código-fonte, rode `npm ci` e `npm run build` uma vez antes de `npm run demo`.

Use o mesmo navegador e o mesmo endereço durante toda a demonstração. Os chamados da apresentação são salvos localmente nessa origem. Para começar com os exemplos iniciais, use um novo perfil de navegador ou uma nova sessão anônima.

## Roteiro principal

1. Abra o endereço local. O Service Hub abre direto no **Portal do cliente**. Entre no **Assistente**.
2. Em **Testar um caso fictício**, selecione **Portal recusa acesso após recuperação**. O assistente identifica o assunto no catálogo da API local e pergunta se a página de entrada abre.
3. Responda **Sim**. Abra a referência **KB-CLI-201 · Rev. 1.4** para mostrar o procedimento e o ponto de escalonamento. Volte ao assistente.
4. Clique em **Continuo com o problema → Revisar e abrir chamado → Preencher evidências fictícias**. Confira o início às 10h20, a nova tentativa às 10h45 e a necessidade de consultar uma solicitação antes das 12h. Registre e anote o protocolo.
5. No rodapé, selecione **Acesso da equipe → Abrir fila do analista · simulação local**. Abra o protocolo e confira o resumo, a referência e a fila **Acesso ao portal**.
6. Clique em **Assumir chamado**. Registre uma solução fictícia, como “A equipe regularizou a associação da conta de demonstração. O cliente confirmou o acesso”. Clique em **Registrar solução e resolver** e abra **Ver como solicitante** para mostrar a atualização no mesmo protocolo.

## Caminhos adicionais

| Caso | O que mostrar |
| --- | --- |
| Localizar manual do serviço | No assistente, escolha **Documentação**, indique que consegue acessar a área de documentos e conclua com **Sim, resolveu** após seguir a orientação. |
| Declaração para auditoria | No assistente do cliente, selecione **Pedido de declaração para auditoria**. O pedido vai para triagem humana. O fluxo preserva o relato e indica que a equipe precisa validar o procedimento e a autorização. |
| Retorno por e-mail | Em **Ver demonstração por e-mail**, simule o recebimento e selecione **Ainda preciso de ajuda**. A continuação acontece no mesmo protocolo, com resumo para o analista. |

## O que funciona neste ambiente

A API local lê registros fictícios, exclusivos do portal do cliente. O assistente aplica regras ao catálogo recebido e exibe a referência. O backend local monta o resumo detalhado a partir dos fatos informados. O papel de analista é simulado e fica disponível nesta execução em loopback. O painel administrativo, convites e cadastro autenticado dependem da hospedagem com controle de acesso.

A integração com modelo externo é opcional no servidor da hospedagem. A edição offline usa regras e não faz chamadas externas. Registro de chamados, troca de status e notificações do protótipo têm persistência no navegador. Banco compartilhado, autenticação corporativa e integrações de atendimento exigem homologação.

## Conta de demonstração

Use **Cadastrar** e **Entrar** no cabeçalho. No pacote offline e no GitHub Pages, o cadastro usa dados fictícios e um e-mail `@example.test`. Após cadastrar, use o mesmo e-mail para entrar e ver **Meu perfil**. O cadastro é local ao navegador, sem envio de e-mail ou senha, e serve apenas para apresentar a jornada da conta.
