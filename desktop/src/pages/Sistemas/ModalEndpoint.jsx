import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import { mensagemErro } from '../../lib/api'

const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export default function ModalEndpoint({ aberto, endpoint, onFechar, onSalvar }) {
  const [form, setForm] = useState({ modulo: '', nome: '', metodo: 'GET', path: '', descricao: '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto || !endpoint) return
    setErro('')
    setForm({
      modulo: endpoint.modulo ?? '', nome: endpoint.nome ?? '', metodo: endpoint.metodo ?? 'GET',
      path: endpoint.path ?? '', descricao: endpoint.descricao ?? '',
    })
  }, [aberto, endpoint])

  const campo = nome => ({ value: form[nome], onChange: e => setForm(f => ({ ...f, [nome]: e.target.value })) })

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      await onSalvar({ ...form, descricao: form.descricao.trim() || null })
      onFechar()
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      aberto={aberto}
      titulo="Editar endpoint"
      onFechar={onFechar}
      largura="max-w-lg"
      rodape={
        <>
          <button type="button" className="botao-secundario" onClick={onFechar}>Cancelar</button>
          <button type="submit" form="form-endpoint" className="botao-primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      }
    >
      <form id="form-endpoint" onSubmit={salvar} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="rotulo">Módulo</span>
            <input className="campo" {...campo('modulo')} required />
          </label>
          <label className="block">
            <span className="rotulo">Nome</span>
            <input className="campo" {...campo('nome')} required />
          </label>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <label className="block">
            <span className="rotulo">Método</span>
            <select className="campo" {...campo('metodo')}>
              {METODOS.map(m => <option key={m}>{m}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="rotulo">Path</span>
            <input className="campo font-mono text-xs" {...campo('path')} required />
          </label>
        </div>
        <label className="block">
          <span className="rotulo">Descrição</span>
          <textarea className="campo min-h-[72px] resize-y" {...campo('descricao')} />
        </label>
        {erro && <p className="text-sm text-perigo">{erro}</p>}
      </form>
    </Modal>
  )
}
