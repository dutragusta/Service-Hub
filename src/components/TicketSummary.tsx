import type { TicketSummary } from '../types'

const sources = {
  local: 'Demonstração local · Regras',
  regras: 'Gerado no servidor · Regras',
  modelo: 'Gerado no servidor · Modelo de IA',
}

export function SummaryDetails({ summary }: { summary: TicketSummary }) {
  return <section className="saved-context ticket-summary" aria-label="Resumo para o suporte">
    <h3>Resumo para o suporte</h3>
    <p className="muted">{sources[summary.origin]}</p>
    <p className="preserve">{summary.synopsis}</p>
    <dl>
      <dt>Encaminhamento</dt><dd>{summary.destination}</dd>
      {summary.conditions.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      {summary.assessment && <><dt>Informação de triagem</dt><dd>{summary.assessment}</dd></>}
      {summary.article && <><dt>Referência da base de demonstração</dt><dd>{summary.article}</dd></>}
      <dt>Testes que o solicitante executou</dt><dd className="preserve">{summary.executedTests}</dd>
      <dt>Resultado informado ou situação atual</dt><dd className="preserve">{summary.handoff}</dd>
    </dl>
    {summary.guidance.length > 0 && <><h4>Orientações apresentadas no autoatendimento</h4>
      <ul>{summary.guidance.map((guidance, index) => <li key={index}>{guidance}</li>)}</ul></>}
    {summary.gaps.length > 0 && <><h4>Informações a confirmar</h4><ul>{summary.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></>}
    <h4>Próximo passo sugerido</h4><p>{summary.nextAction}</p>
  </section>
}
