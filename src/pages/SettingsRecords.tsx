import { Bell, FileText, FolderOpen, GitBranch, Network, ShieldCheck, type LucideIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { requireTeamRole } from '../services/access'

type SettingsRecord = { id: string; name: string; description: string }
type Section = {
  id: string
  title: string
  description: string
  Icon: LucideIcon
  example: Omit<SettingsRecord, 'id'>
}

export const settingsSections: Section[] = [
  { id: 'fluxos', title: 'Fluxos', Icon: GitBranch, description: 'Descreva a triagem, as condições de encaminhamento e o caminho do chamado.', example: { name: 'Encaminhamento ao analista', description: 'Quando a orientação não resolver, encaminhar ao suporte com o relato e as tentativas no mesmo protocolo.' } },
  { id: 'hierarquias', title: 'Hierarquias', Icon: Network, description: 'Registre as equipes responsáveis e a ordem de escalonamento.', example: { name: 'Atendimento ao cliente', description: 'A fila de suporte faz a triagem. A equipe responsável pelo serviço recebe os casos escalonados.' } },
  { id: 'notificacoes', title: 'Notificações', Icon: Bell, description: 'Cadastre modelos de mensagens para eventos do atendimento.', example: { name: 'Confirmação de chamado', description: 'Seu chamado foi aberto. Use o protocolo informado para acompanhar o andamento.' } },
  { id: 'politicas', title: 'Políticas', Icon: ShieldCheck, description: 'Documente regras de atendimento e os limites da automação.', example: { name: 'Respostas do assistente', description: 'Usar orientações aprovadas. Encaminhar à equipe humana quando faltar informação ou houver incerteza.' } },
  { id: 'termos', title: 'Termos', Icon: FileText, description: 'Prepare avisos de uso que a equipe pode revisar antes do piloto.', example: { name: 'Uso da demonstração', description: 'Use dados fictícios. Evite incluir senhas, tokens ou códigos de autenticação nos relatos.' } },
  { id: 'cadastros', title: 'Cadastros', Icon: FolderOpen, description: 'Organize referências de canais, filas e serviços do protótipo.', example: { name: 'Canais de atendimento', description: 'Portal do cliente e chat externo previstos no fluxo. e-mail em fase futura.' } },
]

function readRecords(section: Section): SettingsRecord[] {
  try {
    const saved = localStorage.getItem('service-hub-demo.settings.' + section.id)
    if (saved) return JSON.parse(saved)
  } catch {
    // The demo can still display the example if storage is unavailable.
  }
  return [{ id: 'exemplo', ...section.example }]
}

export function SettingsRecords({ section }: { section: Section }) {
  const [records, setRecords] = useState(() => readRecords(section))
  const [editing, setEditing] = useState<SettingsRecord>()
  const [removing, setRemoving] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>()
  const titleId = 'settings-' + section.id

  async function persist(change: (items: SettingsRecord[]) => SettingsRecord[], message: string) {
    setFeedback(undefined)
    setBusy(true)
    try {
      await requireTeamRole(true)
      const next = change(readRecords(section))
      localStorage.setItem('service-hub-demo.settings.' + section.id, JSON.stringify(next))
      setRecords(next)
      setEditing(undefined)
      setRemoving(undefined)
      setFeedback({ message })
    } catch (failure) {
      setFeedback({ message: failure instanceof Error ? failure.message : 'Não foi possível salvar o rascunho.', error: true })
    } finally {
      setBusy(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const description = String(data.get('description') ?? '').trim()
    if (!name || !description) {
      setFeedback({ message: 'Preencha o nome e a descrição.', error: true })
      return
    }
    const record = { id: editing.id || crypto.randomUUID(), name, description }
    void persist((items) => items.some((item) => item.id === record.id)
      ? items.map((item) => item.id === record.id ? record : item)
      : [...items, record], 'Rascunho salvo neste navegador.')
  }

  return <section className="card team-editor" aria-labelledby={titleId}>
    <header><h2 id={titleId}>{section.title}</h2><p>{section.description}</p></header>
    <p className="alert">Rascunhos da demonstração. As alterações ficam neste navegador.</p>
    {feedback && <p className={'alert ' + (feedback.error ? 'error' : 'success')} role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
    {editing ? <form className="ticket-form" key={editing.id} onSubmit={submit}>
      <label>Nome<input name="name" required maxLength={90} defaultValue={editing.name} /></label>
      <label>Descrição<textarea name="description" required maxLength={1200} rows={4} defaultValue={editing.description} /></label>
      <div className="actions"><button className="button primary" disabled={busy}>Salvar rascunho</button><button className="button secondary" type="button" disabled={busy} onClick={() => setEditing(undefined)}>Cancelar</button></div>
    </form> : <div><button className="button primary" type="button" disabled={busy} onClick={() => { setRemoving(undefined); setEditing({ id: '', name: '', description: '' }) }}>Adicionar rascunho</button></div>}
    {records.length ? <ul className="permission-list settings-records">{records.map((record) => <li key={record.id}>
      <div><strong>{record.name}</strong><p className="preserve">{record.description}</p></div>
      <div className="actions">{removing === record.id ? <>
        <button className="button primary" type="button" disabled={busy} onClick={() => void persist((items) => items.filter((item) => item.id !== record.id), 'Rascunho removido.')}>Confirmar remoção</button>
        <button className="button secondary" type="button" disabled={busy} onClick={() => setRemoving(undefined)}>Cancelar remoção</button>
      </> : <>
        <button className="button secondary" type="button" disabled={busy} onClick={() => { setRemoving(undefined); setEditing(record) }}>Editar</button>
        <button className="button secondary" type="button" disabled={busy} onClick={() => setRemoving(record.id)}>Remover</button>
      </>}</div>
    </li>)}</ul> : <p>Nenhum rascunho cadastrado.</p>}
  </section>
}
