import { useEffect, useState } from 'react'
import Abas from '../../components/Abas'
import BotaoIcone from '../../components/BotaoIcone'
import Icone from '../../components/Icone'
import Modal from '../../components/Modal'
import { endpointsApi, mensagemErro } from '../../lib/api'

const VAZIO = { modo: 'url', url: '', nome: '', cabecalhos: [], arquivo: null }

function tamanho(bytes) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
}

// Importar Swagger/OpenAPI para um sistema: por URL (o backend baixa) ou arquivo .json.
// Verificar → prévia com o nº de endpoints → importar (substituindo os atuais, por padrão).
export default function ModalSwagger({ aberto, sistema, totalAtual, onFechar, onImportado }) {
  const [form, setForm] = useState(VAZIO)
  const [previa, setPrevia] = useState(null) // { total, titulo, versao }
  const [substituir, setSubstituir] = useState(true)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setForm(VAZIO)
    setPrevia(null)
    setSubstituir(true)
    setErro('')
  }, [aberto])

  const mudar = novo => { setForm(f => ({ ...f, ...novo })); setPrevia(null); setErro('') }
  const cabecalhos = () => Object.fromEntries(form.cabecalhos.filter(c => c.chave.trim()).map(c => [c.chave.trim(), c.valor]))

  async function lerArquivo(arquivo) {
    if (!arquivo) return
    try {
      const spec = JSON.parse(await arquivo.text())
      if (!spec.paths && !spec.swagger && !spec.openapi) throw new Error('não parece uma spec OpenAPI/Swagger')
      mudar({ arquivo: { nome: arquivo.name, tamanho: arquivo.size, spec } })
    } catch (e) {
      mudar({ arquivo: null })
      setErro(`Não consegui ler ${arquivo.name}: ${e instanceof SyntaxError ? 'não é um JSON válido' : e.message}.`)
    }
  }

  async function verificar() {
    setErro('')
    setOcupado(true)
    try {
      if (form.modo === 'url') {
        const r = await endpointsApi.previaUrl({ url: form.url.trim(), nome: form.nome || undefined, headers: cabecalhos() })
        setPrevia({ total: r.total, titulo: r.info?.title, versao: r.versao })
      } else {
        const r = await endpointsApi.previaArquivo({ nome: form.nome, spec: form.arquivo.spec })
        const spec = form.arquivo.spec
        setPrevia({ total: r.total, titulo: spec.info?.title, versao: spec.openapi || spec.swagger })
      }
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setOcupado(false)
    }
  }

  async function importar() {
    setErro('')
    setOcupado(true)
    try {
      const comum = { nome: form.nome || undefined, sistemaId: sistema.id, substituir }
      const r = form.modo === 'url'
        ? await endpointsApi.importarUrl({ ...comum, url: form.url.trim(), headers: cabecalhos() })
        : await endpointsApi.importarArquivo({ ...comum, spec: form.arquivo.spec })
      onImportado(r)
      onFechar()
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setOcupado(false)
    }
  }

  const pronto = form.modo === 'url' ? !!form.url.trim() : !!form.arquivo

  return (
    <Modal
      aberto={aberto}
      titulo="Importar Swagger"
      subtitulo={sistema ? `Endpoints para ${sistema.nome}` : undefined}
      onFechar={onFechar}
      largura="max-w-xl"
      rodape={
        <>
          <button type="button" className="botao-secundario" onClick={onFechar} disabled={ocupado}>Cancelar</button>
          {previa ? (
            <button type="button" className="botao-primario" onClick={importar} disabled={ocupado || !previa.total}>
              {ocupado ? 'Importando…' : `Importar ${previa.total} endpoints`}
            </button>
          ) : (
            <button type="button" className="botao-primario" onClick={verificar} disabled={ocupado || !pronto}>
              {ocupado ? 'Verificando…' : 'Verificar'}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <Abas
          abas={[{ id: 'url', rotulo: 'Por URL' }, { id: 'arquivo', rotulo: 'Arquivo .json' }]}
          atual={form.modo}
          onMudar={modo => mudar({ modo })}
        />

        {form.modo === 'url' ? (
          <>
            <label className="block">
              <span className="rotulo">URL do swagger.json (ou da página do Swagger UI)</span>
              <input
                className="campo font-mono text-xs"
                value={form.url}
                onChange={e => mudar({ url: e.target.value })}
                placeholder="https://…/swagger.json"
                autoFocus
              />
            </label>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="rotulo mb-0">Cabeçalhos extras <span className="font-normal">(opcional)</span></span>
                <button
                  type="button"
                  className="text-xs font-medium text-acento hover:underline"
                  onClick={() => mudar({ cabecalhos: [...form.cabecalhos, { chave: '', valor: '' }] })}
                >
                  + Cabeçalho
                </button>
              </div>
              {form.cabecalhos.map((c, i) => (
                <div key={i} className="mb-2 flex items-center gap-2">
                  <input
                    className="campo w-40 font-mono text-xs" placeholder="Authorization" value={c.chave}
                    onChange={e => mudar({ cabecalhos: form.cabecalhos.map((x, j) => (j === i ? { ...x, chave: e.target.value } : x)) })}
                  />
                  <input
                    className="campo font-mono text-xs" placeholder="valor" value={c.valor}
                    onChange={e => mudar({ cabecalhos: form.cabecalhos.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)) })}
                  />
                  <BotaoIcone titulo="Remover" icone="fechar" perigo onClick={() => mudar({ cabecalhos: form.cabecalhos.filter((_, j) => j !== i) })} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-borda px-4 py-8 text-center hover:bg-texto/[0.02]">
            <Icone nome="importar" className="h-6 w-6 text-suave" />
            {form.arquivo ? (
              <span className="text-sm"><span className="font-medium">{form.arquivo.nome}</span> <span className="text-suave">· {tamanho(form.arquivo.tamanho)}</span></span>
            ) : (
              <span className="text-sm text-suave">Clique para escolher o arquivo <span className="font-mono">.json</span> da spec</span>
            )}
            <input type="file" accept=".json,application/json" className="hidden" onChange={e => lerArquivo(e.target.files?.[0])} />
          </label>
        )}

        <label className="block">
          <span className="rotulo">Nome no histórico <span className="font-normal">(opcional — padrão: título da spec)</span></span>
          <input className="campo" value={form.nome} onChange={e => mudar({ nome: e.target.value })} />
        </label>

        {previa && (
          <div className="space-y-3 rounded-xl bg-texto/[0.04] p-4">
            <p className="text-sm">
              <span className="font-semibold">{previa.total} endpoints</span> encontrados
              {previa.titulo && <> em <span className="font-medium">{previa.titulo}</span></>}
              {previa.versao && <span className="text-suave"> · OpenAPI {previa.versao}</span>}
            </p>
            <label className="flex items-start gap-2.5 text-sm">
              <input type="checkbox" checked={substituir} onChange={e => setSubstituir(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--acento))]" />
              <span>
                Substituir os endpoints atuais deste sistema
                <span className="block text-xs text-suave">
                  {substituir
                    ? `Os ${totalAtual} endpoints de hoje são trocados pelos ${previa.total} da spec.`
                    : `Os ${previa.total} da spec são somados aos ${totalAtual} de hoje — pode duplicar.`}
                </span>
              </span>
            </label>
          </div>
        )}

        {erro && <p className="text-sm text-perigo">{erro}</p>}
      </div>
    </Modal>
  )
}
