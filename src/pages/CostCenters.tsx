import { useState, type FormEvent } from 'react'
import { requireTeamRole } from '../services/access'
import { getTopics } from '../services/operations'
import { readCostCenters, saveCenter, saveRule } from '../services/routing'

export function CostCenters() {
  const [centers, setCenters] = useState(readCostCenters)
  const [code, setCode] = useState(centers[0]?.code ?? '')
  const [topic, setTopic] = useState('login')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const center = centers.find((item) => item.code === code)
  const currentRule = center?.rules.find((item) => item.topic === topic)
  const topics = getTopics('colaborador')
  const subjectName = (id: string) => id === '*' ? 'Demais assuntos' : id === 'other' ? 'Outro assunto' : topics.find((item) => item.id === id)?.title ?? id

  async function change(action: () => void, message: string) {
    setBusy(true)
    setError('')
    setStatus('')
    try {
      await requireTeamRole(true)
      action()
      setStatus(message)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível salvar a configuração.')
    } finally {
      setBusy(false)
    }
  }

  function submitCenter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const enteredCode = center?.code ?? String(fields.get('code') ?? '').trim().toUpperCase()
    const name = String(fields.get('name') ?? '').trim()
    void change(() => {
      if (!/^[A-Z0-9][A-Z0-9-]{1,19}$/.test(enteredCode) || !name) throw new Error('Informe um nome e um código de 2 a 20 letras, números ou hífens.')
      setCenters(saveCenter(enteredCode, name, Boolean(center)))
      setCode(enteredCode)
    }, 'Centro de custo salvo.')
  }

  function submitRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const queue = String(fields.get('queue') ?? '').trim()
    const responsible = [...new Set(String(fields.get('responsible') ?? '').split(/[\n,;]+/).map((item) => item.trim().toLowerCase()).filter(Boolean))]
    void change(() => {
      if (!queue || !responsible.length || responsible.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        throw new Error('Informe a fila e pelo menos um e-mail válido de responsável.')
      }
      setCenters(saveRule(code, topic, { topic, queue, responsible }))
    }, 'Regra de encaminhamento salva.')
  }

  return <section className="card team-editor" aria-labelledby="cost-centers-title">
    <header><h2 id="cost-centers-title">Centros de custo</h2><p>Defina qual fila e quais responsáveis atendem cada assunto por centro de custo.</p></header>
    <p className="alert">Demonstração local. Use dados fictícios. Alterações valem para novos chamados neste navegador.</p>
    <label>Centro de custo<select value={code} onChange={(event) => setCode(event.target.value)}>
      {centers.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}<option value="">Novo centro de custo</option>
    </select></label>
    <form className="ticket-form" key={code} onSubmit={submitCenter}>
      <div className="filter-bar">
        <label>Código<input name="code" defaultValue={center?.code} readOnly={!!center} required maxLength={20} /></label>
        <label>Nome do centro<input name="name" defaultValue={center?.name} required maxLength={80} /></label>
      </div>
      <div><button className="button secondary" disabled={busy}>Salvar centro</button></div>
    </form>
    {center && <>
      <h3>Regras de encaminhamento</h3>
      <label>Assunto<select value={topic} onChange={(event) => setTopic(event.target.value)}>
        {topics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        <option value="other">Outro assunto</option><option value="*">Demais assuntos sem regra específica</option>
      </select></label>
      <form className="ticket-form" key={code + ':' + topic + ':' + String(Boolean(currentRule))} onSubmit={submitRule}>
        <label>Fila responsável<input name="queue" defaultValue={currentRule?.queue} required maxLength={80} /></label>
        <label>Responsáveis (e-mails separados por vírgula ou linha)
          <textarea name="responsible" rows={3} maxLength={2000} required defaultValue={currentRule?.responsible.join('\n')} />
        </label>
        <div className="actions">
          <button className="button primary" disabled={busy}>Salvar regra</button>
          {currentRule && <button type="button" className="button secondary" disabled={busy} onClick={() => void change(() => setCenters(saveRule(code, topic)), 'Regra removida.')}>Remover regra</button>}
        </div>
      </form>
      {center.rules.length ? <ul className="permission-list settings-records">{center.rules.map((item) => <li key={item.topic}>
        <div><strong>{subjectName(item.topic)}</strong><small>{item.queue} · {item.responsible.join(', ')}</small></div>
        <button className="button secondary" type="button" onClick={() => setTopic(item.topic)}>Editar regra</button>
      </li>)}</ul> : <p>Nenhuma regra cadastrada. Os chamados deste centro seguem para a triagem geral.</p>}
    </>}
    {status && <p className="alert success" role="status">{status}</p>}
    {error && <p className="alert error" role="alert">{error}</p>}
  </section>
}
