// ---------------------------------------------------------------------------
// Exporta TODOS os dados dos débitos de um crédito tributário para CSV.
//
// O CSV sai com o nome de todos os campos no cabeçalho, mesmo os que vierem
// em branco em todos os débitos.
//
// Como o cabeçalho é montado:
//   1) CAMPOS_FIXOS -> sempre entram, na ordem da lista, mesmo vazios.
//   2) Descobertos  -> qualquer outro campo que a API devolver (1ª passada
//                      lê todos os débitos só para levantar os nomes) entra
//                      depois dos fixos, em ordem alfabética.
//   Objetos aninhados viram colunas com ponto: referente.tipo, referente.codigo
//   Enum devolvido como objeto {valor, descricao} vira: campo e campo.descricao
//   Listas viram texto separado por vírgula.
//
// A 2ª passada lê os débitos de novo e escreve as linhas. São duas leituras
// da API para não guardar todos os débitos em memória.
//
// Saída: 1 zip com 2 arquivos, ambos em UTF-8
//   - CSV   -> uma coluna por campo (achatado), como descrito acima.
//   - JSONL -> uma linha por débito, cada linha é o JSON completo do débito
//              exatamente como a API devolveu (sem achatar).
//
// Fonte: Dados.tributos.v2.debitos (sem 'campos' = devolve todos os campos)
// ---------------------------------------------------------------------------

// ============================ CONFIGURAÇÃO =================================

ID_CREDITO_TRIBUTARIO = 0

NOME_ARQUIVO      = "debitos_credito_${ID_CREDITO_TRIBUTARIO}.csv"
NOME_ARQUIVO_JSON = "debitos_credito_${ID_CREDITO_TRIBUTARIO}.jsonl"
NOME_ARQUIVO_ZIP  = "debitos_credito_${ID_CREDITO_TRIBUTARIO}.zip"

// Colunas garantidas no cabeçalho (entram mesmo se a API não devolver).
// Acrescente aqui qualquer campo que precise aparecer sempre.
CAMPOS_FIXOS = [
  "id",
  "idCredito",
  "abreviaturaCredito",
  "descricaoCredito",
  "idLancamento",
  "idGuia",
  "idContribuinte",
  "cpfCnpj",
  "idImovel",
  "idEconomico",
  "idReceitaDiversa",
  "referente.tipo",
  "referente.tipoDescricao",
  "referente.codigo",
  "referente.descricao",
  "ano",
  "nroParcela",
  "unica",
  "situacao",
  "dtVencimento",
  "vlLancado",
  "sistemaOrigem"
]

// ===========================================================================

if (!ID_CREDITO_TRIBUTARIO) {
  imprimir "Informe ID_CREDITO_TRIBUTARIO na configuração."
  return
}

criterio = "idCredito = ${ID_CREDITO_TRIBUTARIO}"
imprimir "Critério: " + criterio

limpar = { valor ->
  return valor == null ? "" : valor.toString().replace(";", " ").replace("\r", " ").replace("\n", " ").trim()
}

formatar = { valor ->
  if (valor == null) return ""
  if (valor instanceof Number) return valor.toString().replace(".", ",")
  return limpar(valor)
}

// Transforma o débito em um mapa plano: nomeDaColuna -> valor
achatar = null
achatar = { objeto, prefixo, destino ->
  objeto.each { chave, valor ->
    nome = prefixo ? prefixo + "." + chave : chave.toString()

    if (valor instanceof Map) {
      // enum como objeto {valor, descricao}
      if (valor.containsKey("valor") && valor.keySet().every { it in ["valor", "descricao"] }) {
        destino[nome] = valor.valor
        destino[nome + ".descricao"] = valor.descricao
      } else if (valor.isEmpty()) {
        destino[nome] = null
      } else {
        achatar(valor, nome, destino)
      }
    } else if (valor instanceof List) {
      destino[nome] = valor.collect { it instanceof Map ? it.values().join("|") : it }.join(",")
    } else {
      destino[nome] = valor
    }
  }
  return destino
}

buscaDebitos = {
  return Dados.tributos.v2.debitos.busca(criterio: criterio, ordenacao: "id asc")
}

// --- 1ª passada: levanta todos os nomes de campo ---------------------------

descobertos = [:]
totalDebitos = 0

buscaDebitos().each { debito ->
  totalDebitos = totalDebitos + 1
  achatar(debito, "", [:]).keySet().each { nome ->
    if (!CAMPOS_FIXOS.contains(nome)) descobertos[nome] = true
  }
}

colunas = CAMPOS_FIXOS + descobertos.keySet().toList().sort()

imprimir "Débitos encontrados: " + totalDebitos
imprimir "Colunas: " + colunas.size() + " (" + CAMPOS_FIXOS.size() + " fixas + " + descobertos.size() + " descobertas)"

// --- 2ª passada: escreve o CSV e o JSONL -----------------------------------

arquivo = Arquivo.novo(NOME_ARQUIVO, 'csv', [delimitador: ';', entreAspas: 'N', encoding: 'utf-8'])
arquivoJson = Arquivo.novo(NOME_ARQUIVO_JSON, 'txt', [encoding: 'utf-8'])

arquivo.escrever(colunas.join(";"))
arquivo.novaLinha()

escritos = 0

buscaDebitos().each { debito ->
  plano = achatar(debito, "", [:])
  arquivo.escrever(colunas.collect { formatar(plano[it]) }.join(";"))
  arquivo.novaLinha()

  // JSON completo do débito em uma única linha
  arquivoJson.escrever(JSON.escrever(debito).replace("\r", " ").replace("\n", " "))
  arquivoJson.novaLinha()

  escritos = escritos + 1
}

imprimir "Linhas escritas: " + escritos + " (CSV e JSONL)"

// Resultado.arquivos([...]) não existe nesta versão do BFC-Script
// ("A função arquivos(CsvFileWriter, TxtFileWriter) não existe").
// Os dois arquivos vão juntos num zip.
zip = Arquivo.novo(NOME_ARQUIVO_ZIP, 'zip', [encoding: 'utf-8'])
zip.adicionar(arquivo)
zip.adicionar(arquivoJson)

Resultado.nome(NOME_ARQUIVO_ZIP)
Resultado.arquivo(zip)
