# Service Hub

Protótipo navegável para autoatendimento de colaboradores e clientes. Os portais têm catálogos, conversas e chamados de demonstração próprios.

## Executar localmente

Requisitos: Node.js 20.19+ ou 22.12+ e npm. Na pasta do projeto:

```bash
npm ci
npm run dev
```

Abra o endereço que o Vite imprimir. Para compilar e revisar a versão de produção:

```bash
npm run build
npm run preview
```

A pasta `dist/` contém o resultado estático. A navegação por hash permite abrir links diretos sem configuração de redirecionamento no servidor.

## GitHub Pages

A [demonstração pública](https://dutragusta.github.io/Service-Hub/) é publicada a partir da raiz de `main`. Use `npm ci` e `npm run build:pages` para atualizar o `index.html` e os arquivos compilados em `pages/assets/`. Envie essas alterações com as mudanças do código-fonte.

Para navegar pelos portais no Pages, escolha um perfil e selecione **Explorar demonstração**. Verificação de e-mail, cadastro, administração e fila autorizada dependem do ambiente com autenticação e worker.

## Roteiro para o Hackathon

1. Escolha **Sou colaborador** e abra **Acesso à VPN**.
2. Responda à pergunta do assistente, siga as orientações e selecione **Continuo com o problema**.
3. Abra o **Diagnóstico guiado**, conclua as etapas e escolha **Ainda preciso de suporte**.
4. Abra um chamado, descreva o teste com dados fictícios e registre. Consulte número, status e histórico. Recarregue a página para demonstrar a persistência.
5. Volte ao início e repita com **Login e senha** ou **Microsoft Teams**. Marque o problema como resolvido para demonstrar o outro desfecho.
6. Troque para **Sou cliente**. Mostre **Acesso ao portal**, **Documentação** e **Suporte a serviços**, além da busca e dos chamados próprios do portal.

## Funcionalidades

- Seleção de perfil, páginas iniciais, busca por assunto e acesso aos chamados recentes.
- Assistente determinístico com detecção de assuntos, perguntas, sugestões, histórico na sessão e encaminhamento.
- Diagnóstico em três etapas com orientações ajustadas à resposta e desfecho de resolução ou abertura de chamado.
- Formulário com validação acessível, categoria pré-selecionada no encaminhamento e armazenamento local.
- Lista com filtro por status, detalhes e histórico com dados fictícios.
- Base de conhecimento com busca sem distinção de acentos, filtro por categoria e artigos próprios de cada portal.
- Estados de ausência de resultados, lista vazia, carregamento do assistente, falha de formulário e confirmação.

## Arquitetura e design

`src/main.tsx` organiza a navegação e a sessão. `src/pages/` contém as telas, `src/components/` reúne componentes compartilhados e `src/services/` contém busca, detecção de assunto e persistência. `src/demo.ts` centraliza o catálogo e os chamados iniciais. `src/types.ts` define os contratos.

A interface usa tons de vermelho e neutros quentes, ícones Lucide e a fonte Manrope Variable. Os tokens de cor, espaçamento, foco e bordas ficam em `src/styles.css`. A solução usa React, TypeScript, Vite, React Router e CSS próprio.

## Limitações e integrações pendentes

O assistente é baseado em regras e possui um catálogo limitado. O contexto da conversa vive na memória da sessão e é reiniciado ao recarregar. Os chamados são mantidos no navegador e usam registros de demonstração. O encaminhamento prepara o registro local com uma categoria sugerida. Atendimento humano, Service Desk, autenticação corporativa, autorização no servidor, base oficial de conhecimento e um modelo de IA conectado são integrações futuras. Os dois portais são separados na interface e no armazenamento de demonstração. Essa separação não constitui controle de acesso de produção. Use apenas dados fictícios.

## Referências

- [Frontend Design, Anthropic](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- [Web Design Guidelines e React Best Practices, Vercel](https://github.com/vercel-labs/agent-skills)
- [Web Interface Guidelines, Vercel](https://vercel.com/design/guidelines)
- [WCAG 2.2, W3C](https://www.w3.org/TR/WCAG22/)

## Alimentar o assistente do protótipo

Edite `src/data/base-atendimento.json` e gere novamente a aplicação com `npm run build`. Cada assunto tem um identificador único no perfil, título, descrição, palavras-chave, pergunta de triagem e listas de orientações (`steps` e `alternate`). Use termos reais que as pessoas digitem, mantendo conteúdo exclusivo de colaboradores na seção `colaborador`. Em `cliente`, cadastre apenas orientações liberadas para clientes.

A mesma base alimenta a busca, os artigos e o diagnóstico. As orientações vinculam o artigo da base de demonstração. Ao abrir um chamado com contexto, a referência, o relato e as orientações apresentadas seguem com o resultado dos testes informado pelo usuário. O título do artigo é preservado com o chamado. O assistente identifica assuntos por termos, interpreta respostas comuns e encaminha casos fora da base. Ele funciona localmente, sem modelo generativo ou serviço externo. Use exclusivamente dados fictícios: a separação dos perfis é simulada, e as bases são incluídas no código entregue ao navegador.

## Área da equipe

Entre como colaborador. A **Fila de suporte** aparece para as contas autorizadas de suporte e administração. Nessa área, assuma, responda ou resolva chamados dos dois portais. Use **Ver como solicitante** para conferir a atualização e a solução na linha do tempo.

**Configurações** aparece na engrenagem da barra superior somente para administradores. A seção reúne Usuários (acessos e convites de suporte e administração), Colaboradores, Clientes, Centros de custo e Visão geral.

Chamados, rascunhos, artigos editados e indicadores da demonstração usam a persistência local no navegador. A consulta e a gestão de permissões dependem do worker autenticado. A versão estática, por si só, não fornece essa API.

## Entrada e cadastro

A tela inicial oferece entradas por perfil. Na versão hospedada, o login usa a identidade da sessão do ChatGPT. O colaborador informa apenas o e-mail corporativo. Clientes informam nome, e-mail e empresa no cadastro. O servidor compara o e-mail digitado com o da sessão autenticada. A equipe administradora revisa os pedidos nas abas correspondentes. Novos acessos administrativos e de suporte usam os convites de Usuários. Os cadastros não alteram o compartilhamento do site privado.

Os portais de demonstração continuam disponíveis pelos links de demonstração e usam dados fictícios neste navegador. Em produção, fluxos corporativos e dados reais precisarão de vinculação às contas autorizadas.

A revisão de prontidão e as limitações para submissão constam em [VERIFICACOES.md](VERIFICACOES.md).


## Encaminhamento por centro de custo

Na demonstração de colaborador, abra dois chamados de **Login e senha**, selecionando **DEMO-100 · Serviços Gerais** e **DEMO-200 · Operações**. Cada protocolo mostra a fila escolhida pelo par centro e assunto. Abra um chamado sem centro ou com um assunto sem regra para ver a **Triagem geral**.

Administradores podem editar centros e regras em **Configurações → Centros de custo** e usar **Simular responsável (demo)** na fila. A tela de suporte filtra os encaminhamentos pelo e-mail autenticado e mostra a triagem à equipe. O centro interno não é pedido ao cliente. Alterações na configuração valem para chamados novos. As regras e chamados permanecem neste navegador, com dados fictícios. A autorização por chamado em um banco compartilhado e a integração com sistema de chamados são etapas de homologação.

A edição Service Hub usa armazenamento local separado para iniciar a demonstração com exemplos fictícios. Registros de versões anteriores do navegador ficam fora desta edição. O ambiente hospedado usa a conta autenticada apenas para controle de acesso e cadastro.
A edição usa tabelas próprias de contas e convites. Cadastros anteriores ficam arquivados no banco e fora do painel da demonstração.

## Hospedar o worker

Para uma instalação com autenticação, use um ambiente que forneça o binding D1 `DB`, aplique as migrações em `drizzle/` e configure uma camada de autenticação confiável. O proxy de autenticação deve remover cabeçalhos de identidade enviados pelo cliente e injetar os cabeçalhos esperados pelo worker após validar a sessão. Mantenha o worker acessível somente por essa camada.

O identificador da hospedagem e o hash do e-mail do administrador inicial são configurações locais. Se necessário, configure o hash em `worker/owner.sha256`. O build funciona sem esse arquivo e o ambiente fica sem administrador inicial. Os fluxos de autenticação precisam da infraestrutura que fornece a identidade. A prévia estática serve para navegar pela demonstração com dados fictícios.

## Casos fictícios e resumo para o suporte

Em **Abrir chamado → Preencher com caso fictício**, escolha um incidente do perfil e revise as condições antes do registro. Há exemplos de VPN, login, Teams, acesso ao portal e uma solicitação que exige atendimento humano. A demonstração por e-mail também mostra o resumo no encaminhamento ao analista.

O worker gera o resumo em `POST /api/tickets/summary`. Sem configuração de IA, a síntese usa regras no servidor. Para habilitar a redação por modelo, configure `OPENAI_API_KEY` como segredo e `OPENAI_SUMMARY_MODEL` com um modelo da API Responses que suporte respostas estruturadas. Use apenas dados fictícios. A versão estática preserva o fluxo com regras locais.

Veja [Segurança e roteiro de demonstração](SEGURANCA.md). Execute `node scripts/check-ticket-summary.mjs` para validar a API, a estrutura do resumo e o tratamento de falha do provedor simulado.
