const missing = 'Não informado pelo solicitante.'
const sensitive = /(?:senha|token|c[oó]digo|segredo|authorization)\s*(?:[:=]|[eé]\s)\s*\S+|\bBearer\s+\S+|\b\d{6,}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i
const fields = ['title', 'description', 'category', 'priority', 'channel', 'queue', 'center', 'report',
  'assessment', 'article', 'outcome', 'startedAt', 'environment', 'scope', 'impact', 'errorMessage', 'tests']

export function cleanSummaryInput(value) {
  if (!value || !['cliente', 'colaborador'].includes(value.profile)) return null
  const input = { profile: value.profile }
  for (const key of fields) {
    if (value[key] == null) continue
    if (typeof value[key] !== 'string' || value[key].length > 1200 || sensitive.test(value[key])) return null
    if (value[key].trim()) input[key] = value[key].trim()
  }
  if (!input.title || !input.description || !input.category || !['Normal', 'Alta'].includes(input.priority)) return null
  if (value.guidance != null) {
    if (!Array.isArray(value.guidance) || value.guidance.length > 12 ||
        value.guidance.some((step) => typeof step !== 'string' || step.length > 350 || sensitive.test(step))) return null
    input.guidance = value.guidance.filter((step) => step.trim())
  }
  return input
}

export function createTicketSummary(input, origin = 'local') {
  const gaps = [
    ['startedAt', 'Início e frequência da falha'],
    ['environment', 'Ambiente ou dispositivo afetado'],
    ['scope', 'Quantidade de pessoas afetadas'],
    ['impact', 'Atividade afetada e impacto operacional'],
    ['errorMessage', 'Mensagem exibida ou confirmação de que não houve mensagem'],
    ['tests', 'Testes executados e resultado de cada teste'],
  ].filter(([field]) => !input[field]).map(([, label]) => label)
  const handoff = input.outcome || (input.guidance?.length
    ? 'Houve orientação de autoatendimento. A resolução ainda precisa ser confirmada.'
    : 'Solicitação registrada para triagem humana.')
  return {
    origin,
    synopsis: [input.description, input.report && input.report !== input.description ? 'Relato anterior: ' + input.report : ''].filter(Boolean).join('\n'),
    conditions: [
      ['Início e frequência', input.startedAt || missing],
      ['Ambiente', input.environment || missing],
      ['Abrangência', input.scope || missing],
      ['Impacto relatado', input.impact || missing],
      ['Mensagem exibida', input.errorMessage || missing],
    ],
    executedTests: input.tests || missing,
    assessment: input.assessment,
    guidance: input.guidance ?? [],
    article: input.article,
    handoff,
    destination: [input.channel || 'Portal', input.category, 'Prioridade ' + input.priority.toLowerCase(),
      input.queue || 'Triagem de suporte', input.center].filter(Boolean).join(' · '),
    gaps,
    nextAction: gaps.length
      ? 'Confirme as informações pendentes com o solicitante e valide a categoria e a prioridade na triagem.'
      : 'Valide a categoria e a prioridade, compare os resultados informados com os registros disponíveis à equipe e registre o próximo passo no protocolo.',
  }
}
