export const EXEMPLO_JSON = `{
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "ativo": true,
    "perfil": null,
    "cargos": ["admin", "editor"],
    "endereco": {
      "rua": "Av. Paulista",
      "numero": 1578,
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01310-100"
    },
    "preferencias": {
      "tema": "escuro",
      "idioma": "pt-BR",
      "notificacoes": { "email": true, "sms": false, "push": true }
    }
  },
  "metadata": {
    "versao": "2.1.0",
    "geradoEm": "2026-06-03T10:00:00Z",
    "total": 42,
    "pagina": 1,
    "totalPaginas": 5
  }
}`

export const ABAS = [
  { id: 'formatado', label: 'Formatado' },
  { id: 'arvore',    label: 'Visualização em Árvore' },
  { id: 'grafo',     label: 'Grafo' },
  { id: 'tabela',    label: 'Tabela de Dados' },
  { id: 'stats',     label: 'Estatísticas' },
]
