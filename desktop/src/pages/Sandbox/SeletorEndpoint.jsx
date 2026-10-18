import { useEffect, useMemo, useState } from 'react'
import CaixaBusca from '../../components/CaixaBusca'
import { basePath, metodoPadrao, modulosDe, nomeRecurso, recursosDoModulo } from '../../lib/endpoints'

// Igual ao Krakion web: Módulo → Recurso (nome legível, um por recurso — /x e /x/{id} juntos).
// O método se escolhe nos botões logo abaixo; ao escolher o recurso já vem POST, se houver.
export default function SeletorEndpoint({ endpoints, selecionado, onSelecionar, desabilitado }) {
  const [modulo, setModulo] = useState('')

  const opcoesModulo = useMemo(() => modulosDe(endpoints, '').map(m => ({ valor: m.modulo, rotulo: m.modulo })), [endpoints])
  const recursos = useMemo(() => {
    if (!modulo) return []
    return recursosDoModulo(endpoints, modulo)
      .map(r => {
        const colecao = r.endpoints.find(e => !e.path.includes('{')) ?? r.endpoints[0]
        return { ...r, rotulo: nomeRecurso({ nome: colecao.nome, path: r.path }, modulo) }
      })
      .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'))
  }, [endpoints, modulo])

  // Trocou de sistema → recomeça; endpoint escolhido por fora → acompanha o módulo dele
  useEffect(() => { setModulo('') }, [endpoints])
  useEffect(() => { if (selecionado && selecionado.modulo !== modulo) setModulo(selecionado.modulo) }, [selecionado]) // eslint-disable-line react-hooks/exhaustive-deps

  function escolherModulo(m) {
    setModulo(m)
    if (selecionado?.modulo !== m) onSelecionar(null)
  }

  function escolherRecurso(path) {
    const r = recursos.find(x => x.path === path)
    const metodo = metodoPadrao(r.metodos)
    onSelecionar(r.endpoints.find(e => e.metodo === metodo))
  }

  return (
    <div className="space-y-2">
      <div>
        <span className="mb-1 block text-xs text-suave">Módulo</span>
        <CaixaBusca opcoes={opcoesModulo} valor={modulo} onEscolher={escolherModulo} desabilitado={desabilitado}
          placeholder={desabilitado ? 'Escolha o sistema primeiro' : 'Buscar módulo…'} />
      </div>
      <div>
        <span className="mb-1 block text-xs text-suave">Recurso</span>
        <CaixaBusca
          opcoes={recursos.map(r => ({ valor: r.path, rotulo: r.rotulo }))}
          valor={selecionado ? basePath(selecionado.path) : ''}
          onEscolher={escolherRecurso}
          desabilitado={desabilitado || !modulo}
          placeholder="Buscar recurso…"
        />
      </div>
    </div>
  )
}
