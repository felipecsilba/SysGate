// Fonte única do menu: o Rail mostra os grupos, o PainelLista os itens, o App gera as rotas.
export const GRUPOS = [
  {
    id: 'ferramentas',
    titulo: 'Ferramentas',
    icone: 'ferramentas',
    itens: [
      { id: 'extensoes', rotulo: 'Extensões', icone: 'extensoes', descricao: 'Scripts BFC, fórmulas, anotações e relatórios.' },
      { id: 'analisador-json', rotulo: 'Analisador JSON', icone: 'json', descricao: 'Árvore, tabela, grafo e comparação de JSON.' },
      { id: 'checagem', rotulo: 'Checagem', icone: 'checagem', descricao: 'Valida payloads e arquivos de fonte contra as regras Betha.' },
      { id: 'conhecimento', rotulo: 'Conhecimento', icone: 'conhecimento', descricao: 'FAQs, erros conhecidos e passo a passo.' },
      { id: 'notas', rotulo: 'Notas', icone: 'notas', descricao: 'Notas rápidas, checklists e trechos de código.' },
      { id: 'historico', rotulo: 'Histórico', icone: 'historico', descricao: 'Requisições já executadas e IDs gerados.' },
    ],
  },
  // Grupo de um módulo só (direto): o ícone na barra abre a tela inteira, sem a lista do meio
  {
    id: 'api',
    titulo: 'API',
    icone: 'api',
    direto: true,
    itens: [
      { id: 'api', rotulo: 'API', icone: 'api', descricao: 'Chamadas à API Betha, uma a uma ou em lote.' },
    ],
  },
  {
    id: 'configuracoes',
    titulo: 'Configurações',
    icone: 'configuracoes',
    itens: [
      { id: 'sistemas', rotulo: 'Sistemas', icone: 'sistemas', descricao: 'Sistemas Betha, specs Swagger e endpoints.' },
      { id: 'tokens', rotulo: 'Central de Tokens', icone: 'tokens', descricao: 'Municípios e tokens por sistema.' },
      { id: 'betha-admin', rotulo: 'Betha Admin', icone: 'agente', descricao: 'Acesso do agente que renova tokens.' },
      { id: 'importar', rotulo: 'Importar dados', icone: 'importar', descricao: 'Copia sistemas, endpoints, municípios e tokens do Krakion web.' },
    ],
  },
]

export const MODULOS = GRUPOS.flatMap(g => g.itens.map(item => ({ ...item, grupo: g.id, rota: `/${item.id}` })))

export function grupoDaRota(pathname) {
  const modulo = MODULOS.find(m => pathname === m.rota || pathname.startsWith(m.rota + '/'))
  return GRUPOS.find(g => g.id === modulo?.grupo) ?? GRUPOS[0]
}
