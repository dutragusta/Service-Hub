# Segurança do Service Hub

O projeto foi preparado para demonstrar autoatendimento com chamados, pessoas e empresas fictícios.

| Proteção | Como funciona hoje |
| --- | --- |
| Identidade da sessão | Na hospedagem com servidor, o proxy autentica a sessão e o worker usa a identidade fornecida pelo proxy. Na verificação de conta, o worker confere se o e-mail informado pertence à sessão. Uma instalação própria precisa remover cabeçalhos de identidade enviados pelo cliente e bloquear acesso direto ao worker. |
| Permissões administrativas | O servidor verifica as permissões nas rotas de gestão e de cadastro. Configurações fica disponível somente para administradores. A navegação de suporte usa o perfil autorizado da equipe. |
| Convites | O servidor salva o hash do token. O vínculo com o e-mail, a validade de 48 horas e o uso único são verificados ao aceitar. |
| API de resumo | Exige sessão autenticada, método POST, origem do próprio site e conteúdo JSON. Limita tamanho e campos, rejeita formatos comuns de credenciais e e-mails e pede que o navegador não armazene a resposta em cache. |
| Integração com modelo | A credencial fica em variável do servidor. Somente os campos validados do chamado são encaminhados quando o provedor está configurado. A requisição usa `store: false`. O modelo redige a síntese e os campos factuais de triagem continuam separados. Em erro, o servidor retorna um resumo por regras. |
| Escalonamento | Orientações apresentadas e testes realmente executados ficam separados. Lacunas aparecem para validação do analista, e a síntese não executa alterações de conta, fila ou prioridade. |

## Roteiro de apresentação

1. Em **Abrir chamado**, selecione **Portal recusa acesso após recuperação** e registre. Mostre os horários, as tentativas, o impacto e os resultados no resumo.
2. Repita com uma descrição curta e deixe vazios os campos do incidente. Aponte **Informações a confirmar**, sem diagnóstico inventado.
3. Em uma nova solicitação fictícia, digite `Token: exemplo-ficticio` na descrição. O formulário deve pedir a remoção do texto. O teste da API também confirma que esse conteúdo é rejeitado no servidor.
4. Execute `node scripts/check-ticket-summary.mjs`. O teste verifica requisições sem sessão, de origem externa, com formato incorreto, com conteúdo sensível ou acima do limite. O provedor de IA é simulado nesse teste.

## Limites da demonstração

O GitHub Pages usa HTML, JavaScript e armazenamento local, com os resumos gerados por regras no próprio navegador. O acesso aos portais de demonstração é público, os chamados ficam no navegador e o armazenamento não oferece autorização por usuário nem separação segura de dados de organizações. Use exclusivamente dados fictícios. A detecção de credenciais cobre padrões comuns e pode deixar passar outros formatos.

Antes de um piloto com dados reais, implemente autorização por chamado e por organização no servidor, persistência com controle de acesso, trilha de auditoria, limites de uso por identidade para o modelo e políticas de retenção. Valide o fluxo, a aprovação do provedor e o tratamento de dados com a equipe responsável.

## Execução de apresentação no computador

O servidor de demonstração escuta apenas em `127.0.0.1`, valida o host e a origem, descarta cabeçalhos de identidade fornecidos pelo navegador e fornece uma identidade fictícia limitada à fila local. Rotas de gestão autenticada ficam indisponíveis nesse modo. A API de conhecimento retorna apenas as orientações fictícias do portal do cliente e a execução local do resumo não configura provedor externo. Use apenas dados de demonstração.
