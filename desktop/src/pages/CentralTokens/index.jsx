import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Confirmar from '../../components/Confirmar'
import Icone from '../../components/Icone'
import Pagina from '../../components/Pagina'
import { mensagemErro, municipiosApi, sistemasApi } from '../../lib/api'
import DetalheMunicipio from './DetalheMunicipio'
import ListaMunicipios from './ListaMunicipios'
import ModalMunicipio from './ModalMunicipio'
import ModalToken from './ModalToken'
import ModalRenovacao from './ModalRenovacao'

export default function CentralTokens() {
  const navegar = useNavigate()
  const [municipios, setMunicipios] = useState(null) // null = carregando
  const [sistemas, setSistemas] = useState([])
  const [selecionadoId, setSelecionadoId] = useState(null)
  const [tokens, setTokens] = useState([])
  const [carregandoTokens, setCarregandoTokens] = useState(false)
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')
  // modais: { tipo: 'municipio' | 'token' | 'excluirMunicipio' | 'removerToken', alvo }
  const [modal, setModal] = useState(null)
  const fechar = useCallback(() => setModal(null), [])
  // Cada modal recebe o alvo só quando é o dele (um município não é um vínculo de token)
  const alvoDe = tipo => (modal?.tipo === tipo ? modal.alvo : null)

  const carregarMunicipios = useCallback(async () => {
    try {
      const lista = await municipiosApi.listar()
      setMunicipios(lista)
      setSelecionadoId(atual =>
        lista.some(m => m.id === atual) ? atual : (lista.find(m => m.ativo) ?? lista[0])?.id ?? null)
    } catch (err) {
      setErro(mensagemErro(err))
      setMunicipios([])
    }
  }, [])

  const carregarTokens = useCallback(async id => {
    if (!id) return setTokens([])
    setCarregandoTokens(true)
    try {
      setTokens(await municipiosApi.tokens(id))
    } finally {
      setCarregandoTokens(false)
    }
  }, [])

  useEffect(() => {
    carregarMunicipios()
    sistemasApi.listar().then(setSistemas).catch(() => {})
  }, [carregarMunicipios])

  useEffect(() => { carregarTokens(selecionadoId) }, [selecionadoId, carregarTokens])

  const selecionado = municipios?.find(m => m.id === selecionadoId)

  // Ações
  async function salvarMunicipio(dados) {
    if (modal.alvo) {
      await municipiosApi.atualizar(modal.alvo.id, dados)
    } else {
      const novo = await municipiosApi.criar(dados)
      setSelecionadoId(novo.id)
    }
    await carregarMunicipios()
  }

  async function ativar() {
    await municipiosApi.ativar(selecionado.id)
    await carregarMunicipios()
  }

  async function excluirMunicipio() {
    await municipiosApi.excluir(modal.alvo.id)
    setSelecionadoId(null)
    await carregarMunicipios()
  }

  async function salvarToken(dados) {
    await municipiosApi.salvarToken(selecionado.id, dados)
    await Promise.all([carregarTokens(selecionado.id), carregarMunicipios()])
  }

  async function removerToken() {
    await municipiosApi.excluirToken(selecionado.id, modal.alvo.sistemaId)
    await Promise.all([carregarTokens(selecionado.id), carregarMunicipios()])
  }

  const botaoNovo = (
    <button type="button" className="botao-secundario h-8 px-3 text-xs" onClick={() => setModal({ tipo: 'municipio', alvo: null })}>
      <Icone nome="mais" className="h-3.5 w-3.5" /> Município
    </button>
  )

  return (
    <Pagina titulo="Central de Tokens" icone="tokens" acoes={municipios?.length ? botaoNovo : null}>
      {municipios === null ? (
        <div className="flex flex-1 items-center justify-center text-sm text-suave">Carregando…</div>
      ) : !municipios.length ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-acento-suave text-acento">
              <Icone nome="tokens" className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold">Nenhum município ainda</h3>
            <p className="mt-1.5 text-sm text-suave">Traga seus municípios e tokens do Krakion web ou cadastre o primeiro aqui.</p>
            {erro && <p className="mt-3 text-sm text-perigo">{erro}</p>}
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" className="botao-primario" onClick={() => navegar('/importar')}>
                <Icone nome="importar" className="h-4 w-4" /> Importar dados
              </button>
              <button type="button" className="botao-secundario" onClick={() => setModal({ tipo: 'municipio', alvo: null })}>Novo município</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <ListaMunicipios
            municipios={municipios}
            selecionadoId={selecionadoId}
            onSelecionar={setSelecionadoId}
            busca={busca}
            onBusca={setBusca}
          />
          {selecionado ? (
            <DetalheMunicipio
              municipio={selecionado}
              tokens={tokens}
              carregando={carregandoTokens}
              onAtivar={ativar}
              onEditar={() => setModal({ tipo: 'municipio', alvo: selecionado })}
              onExcluir={() => setModal({ tipo: 'excluirMunicipio', alvo: selecionado })}
              onNovoToken={() => setModal({ tipo: 'token', alvo: null })}
              onRenovarToken={v => setModal({ tipo: 'token', alvo: v })}
              onRenovarBetha={window.krakion?.betha ? vs => setModal({ tipo: 'renovar', alvo: vs.map(v => ({ municipioId: selecionado.id, municipioNome: selecionado.nome, sistemaId: v.sistemaId, sistemaNome: v.sistema.nome })) }) : null}
              onRemoverToken={v => setModal({ tipo: 'removerToken', alvo: v })}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-suave">Selecione um município.</div>
          )}
        </div>
      )}

      <ModalMunicipio aberto={modal?.tipo === 'municipio'} municipio={alvoDe('municipio')} onFechar={fechar} onSalvar={salvarMunicipio} />
      <ModalToken
        aberto={modal?.tipo === 'token'}
        vinculo={alvoDe('token')}
        sistemas={sistemas}
        sistemasOcupados={tokens.map(t => t.sistemaId)}
        onFechar={fechar}
        onSalvar={salvarToken}
      />
      <ModalRenovacao
        aberto={modal?.tipo === 'renovar'}
        itens={alvoDe('renovar') || []}
        onFechar={fechar}
        onConcluido={() => Promise.all([carregarTokens(selecionadoId), carregarMunicipios()])}
      />
      <Confirmar
        aberto={modal?.tipo === 'excluirMunicipio'}
        titulo={`Excluir ${alvoDe('excluirMunicipio')?.nome ?? ''}?`}
        mensagem="O município, os tokens dele e o histórico de requisições serão apagados desta máquina."
        onConfirmar={excluirMunicipio}
        onFechar={fechar}
      />
      <Confirmar
        aberto={modal?.tipo === 'removerToken'}
        titulo={`Remover token de ${alvoDe('removerToken')?.sistema?.nome ?? ''}?`}
        mensagem="O token deixa de existir neste município. Você pode adicionar outro depois."
        rotulo="Remover"
        onConfirmar={removerToken}
        onFechar={fechar}
      />
    </Pagina>
  )
}
