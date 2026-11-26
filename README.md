# Service Hub

Protótipo de autoatendimento para clientes com base de conhecimento, abertura e acompanhamento de chamados e uma fila interna de analistas.

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

O Pages abre na tela de acesso do **Portal do Cliente**, com as opções **Entrar** e **Cadastrar**. Verificação de e-mail, cadastro, administração e fila autorizada dependem do ambiente com autenticação e worker.

## Roteiro para o Hackathon

O [roteiro de apresentação](APRESENTACAO.md) acompanha um cliente que continua sem acesso ao portal após recuperar a conta e mostra o atendimento do mesmo chamado na fila interna.

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

O assistente é baseado em regras e possui um catálogo limitado. O contexto da conversa vive na memória da sessão e é reiniciado ao recarregar. Os chamados são mantidos no navegador e usam registros de demonstração. O encaminhamento prepara o registro local com uma categoria sugerida. Atendimento humano, Service Desk, autenticação corporativa, autorização no servidor, base oficial de conhecimento e um modelo de IA conectado são integrações futuras. O portal de demonstração e a área da equipe têm rotas próprias. Chamados ficam no navegador e exigem autorização no servidor antes de qualquer uso em produção. Use apenas dados fictícios.

## Referências

- [Frontend Design, Anthropic](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- [Web Design Guidelines e React Best Practices, Vercel](https://github.com/vercel-labs/agent-skills)
- [Web Interface Guidelines, Vercel](https://vercel.com/design/guidelines)
- [WCAG 2.2, W3C](https://www.w3.org/TR/WCAG22/)

## Alimentar o assistente do protótipo

Edite `src/data/base-atendimento.json` e gere novamente a aplicação com `npm run build`. Cada assunto tem um identificador único no perfil, título, descrição, palavras-chave, pergunta de triagem e listas de orientações (`steps` e `alternate`). Em `cliente`, use termos que as pessoas digitariam e cadastre orientações liberadas para clientes.

A mesma base alimenta a busca, os artigos e o diagnóstico. As orientações vinculam o artigo da base de demonstração. Ao abrir um chamado com contexto, a referência, o relato e as orientações apresentadas seguem com o resultado dos testes informado pelo usuário. O título do artigo é preservado com o chamado. O assistente identifica assuntos por termos, interpreta respostas comuns e encaminha casos fora da base. Ele funciona localmente, sem modelo generativo ou serviço externo. O catálogo é fictício. O pacote offline inclui os artigos e usa dados salvos no navegador.

## Área da equipe

Use **Acesso da equipe**, no rodapé, para chegar à área interna. O **Painel de atendimento** mostra chamados ativos, prazos de primeira resposta, resoluções e avaliações. Na **Fila de suporte**, a equipe pode buscar pelo protocolo, filtrar, assumir chamados e usar respostas rápidas editáveis ou notas internas da demonstração. Use **Ver como solicitante** para conferir a atualização e a solução na linha do tempo.

**Configurações**, na área interna, reúne Usuários, Clientes e Visão geral para administradores autenticados.

Chamados, rascunhos, artigos editados e indicadores da demonstração usam a persistência local no navegador. A consulta e a gestão de permissões dependem do worker autenticado. A versão estática, por si só, não fornece essa API.

## Entrada e cadastro

A tela inicial apresenta a opção **Sou cliente**, com entrada e cadastro. Na versão hospedada, o cadastro do cliente usa a sessão autenticada para verificar o e-mail. A equipe administradora revisa os pedidos e concede acessos de equipe por convites. Os cadastros não alteram o compartilhamento do site privado.

Os portais de demonstração continuam disponíveis pelos links de demonstração e usam dados fictícios neste navegador. Em produção, fluxos corporativos e dados reais precisarão de vinculação às contas autorizadas.

A revisão de prontidão e as limitações para submissão constam em [VERIFICACOES.md](VERIFICACOES.md).


## Encaminhamento ao suporte

O chamado de cliente segue para a fila correspondente à categoria. Assuntos que exigem análise fora do catálogo seguem para triagem geral.

## Hospedar o worker

Para uma instalação com autenticação, use um ambiente que forneça o binding D1 `DB`, aplique as migrações em `drizzle/` e configure uma camada de autenticação confiável. O proxy de autenticação deve remover cabeçalhos de identidade enviados pelo cliente e injetar os cabeçalhos esperados pelo worker após validar a sessão. Mantenha o worker acessível somente por essa camada.

O identificador da hospedagem e o hash do e-mail do administrador inicial são configurações locais. Se necessário, configure o hash em `worker/owner.sha256`. O build funciona sem esse arquivo e o ambiente fica sem administrador inicial. Os fluxos de autenticação precisam da infraestrutura que fornece a identidade. A prévia estática serve para navegar pela demonstração com dados fictícios.

## Casos fictícios e resumo para o suporte

Em **Abrir chamado → Preencher com caso fictício**, escolha um incidente do perfil e revise as condições antes do registro. O portal do cliente inclui exemplos de boleto, nota fiscal, contrato, cobrança duplicada, erro de exportação e falha de acesso. Os cinco primeiros foram adaptados dos [cenários sintéticos do Offmoura/Hackathon](https://github.com/Offmoura/Hackathon/blob/main/data/chamados_sinteticos.json). A demonstração por e-mail também mostra o resumo no encaminhamento ao analista.

O worker gera o resumo em `POST /api/tickets/summary`. Sem configuração de IA, a síntese usa regras no servidor. Para habilitar a redação por modelo, configure `OPENAI_API_KEY` como segredo e `OPENAI_SUMMARY_MODEL` com um modelo da API Responses que suporte respostas estruturadas. Use apenas dados fictícios. A versão estática preserva o fluxo com regras locais.

Veja [Segurança e roteiro de demonstração](SEGURANCA.md). Execute `node scripts/check-ticket-summary.mjs` para validar a API, a estrutura do resumo e o tratamento de falha do provedor simulado.

## Apresentação offline

Para executar a aplicação completa localmente, rode `npm ci`, `npm run build` e `npm run demo`. Abra `http://127.0.0.1:4173/`. O pacote compilado pode ser iniciado diretamente com `node scripts/serve-demo.mjs` ou pelo `iniciar-demo.cmd` no Windows.

Para ativar o resumo com Llama, instale e abra o Ollama no mesmo computador e baixe o modelo com `ollama pull llama3.1:8b`. Inicie o Service Hub e aguarde a mensagem **Ollama · Modelo pronto** no terminal. Depois do download, o modelo roda offline e a aplicação chama o Ollama pelo endereço local. Em computadores mais lentos, baixe `ollama pull llama3.2:3b` e inicie a demo com `OLLAMA_MODEL` configurada para `llama3.2:3b`. No PowerShell, use `$env:OLLAMA_MODEL = 'llama3.2:3b'` antes de `npm run demo`.

O Llama escreve a síntese. Categoria, prioridade e fila seguem as regras do portal. Se o Ollama estiver indisponível, demorar mais de 7,5 segundos ou devolver uma resposta inválida, o atendimento segue com o resumo por regras. O GitHub Pages usa o resumo por regras do navegador.

O ambiente local serve a base fictícia por API, gera o resumo no servidor e permite concluir o atendimento pela fila de analista simulada. O catálogo e as citações exibem referência, revisão e equipe fictícia responsável. Consulte [APRESENTACAO.md](APRESENTACAO.md) para demonstrar a jornada e seus limites.

No pacote offline e no GitHub Pages, **Entrar** e **Cadastrar** demonstram a conta do cliente com dados fictícios e e-mail `@example.test`. O cadastro fica no navegador. O ambiente autenticado usa a verificação de conta do servidor.

O cliente pode complementar chamados em andamento e avaliar o atendimento concluído. Os indicadores são calculados a partir dos dados de demonstração deste navegador.
