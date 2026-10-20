# -*- coding: utf-8 -*-
"""
Reconstrói o catálogo de fontes a partir dos arquivos RAW, separando
corretamente as 4 dimensões que uma fonte tem no BFC-Script.

POR QUE ISSO EXISTE
-------------------
O `fontes_catalog_completo.json` (consolidado antigo) tinha 2 defeitos graves:

1. Misturou "campos de retorno" com "campos filtráveis" numa lista só
   chamada `campos`, com um flag `filtravel` inventado na consolidação.
   Resultado: `certidoes-negativas` aparecia com 319 campos "não filtráveis",
   quando na verdade essa fonte tem ZERO expressions (não aceita `criterio:`
   nenhum) — os 319 eram só a estrutura de retorno.
2. Jogou fora `pathParams` e `queryParams` — ou seja, perdeu completamente a
   informação de PARÂMETROS, inclusive os obrigatórios.

AS 4 DIMENSÕES (nomenclatura do sistema Betha -> onde está no raw)
------------------------------------------------------------------
  1. Campos de retorno  -> `types` + `representation.type`
                           (o que vem no resultado; vai em `campos:`)
  2. Filtros            -> `expressions`, exceto as marcadas `filter: false`
                           (vai em `criterio:`)
  3. Ordenação          -> `expressions`, exceto as marcadas `sort: false`
                           (vai em `ordem:`)
  4. Parâmetros         -> `method.pathParams`  = OBRIGATÓRIOS
                           `method.queryParams` = opcionais/especiais
                           (vai em `parametros:`)

REGRA DESCOBERTA (importante): no raw, `filter` e `sort` só aparecem quando
valem `false`. São exceções negativas — o padrão é que o campo É filtrável e
ordenável. Foi exatamente por inverter isso que o consolidado antigo errou.

Uso:  python _construir_catalogo_v2.py
Saída: catalogo_v2.json
"""
import json, glob, io, sys, re
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
ROOT = Path(__file__).parent

PREFIXO_API = re.compile(r'^https?://[^/]+/tributos/(dados|services/v\d+)/api')


def carregar_raw():
    todos = []
    for f in sorted(glob.glob(str(ROOT / "raw" / "*.json"))):
        todos.extend(json.loads(Path(f).read_text(encoding="utf-8")))
    return todos


def achatar_tipo(types, tipo_raiz, prefixo="", nivel=0, visto=None):
    """Expande recursivamente a estrutura de retorno em caminhos planos."""
    if visto is None:
        visto = set()
    if nivel > 3 or tipo_raiz not in types:
        return []
    if tipo_raiz in visto:      # evita recursão infinita em tipos cíclicos
        return []
    visto = visto | {tipo_raiz}

    saida = []
    for nome, meta in (types.get(tipo_raiz) or {}).items():
        caminho = f"{prefixo}{nome}"
        tipo = meta.get("type")
        saida.append({
            "campo": caminho,
            "tipo": tipo or meta.get("enum") or "?",
            "descricao": meta.get("description", ""),
            "eh_enum": "enum" in meta,
        })
        if tipo and tipo in types:
            saida.extend(achatar_tipo(types, tipo, caminho + ".", nivel + 1, visto))
    return saida


# operações que são consulta mesmo quando o verbo não é GET
# (há 16 casos de POST /busca — provavelmente por payload grande no filtro)
_LEITURA = ("busca", "buscar", "metadados", "contagem", "soma", "existe",
            "pendentes", "configuracao", "saldo")


def classificar(verbo, operacao):
    """LEITURA | CRIACAO | ALTERACAO | EXCLUSAO — natureza da operação."""
    op = (operacao or "").lower()
    if op.startswith(_LEITURA):
        return "LEITURA"
    return {"GET": "LEITURA", "POST": "CRIACAO",
            "PUT": "ALTERACAO", "DELETE": "EXCLUSAO"}.get(verbo, "LEITURA")


def construir():
    raw = carregar_raw()
    fontes = []

    for e in raw:
        metodo = e.get("method") or {}
        expressions = e.get("expressions") or {}
        types = e.get("types") or {}
        representation = e.get("representation") or {}

        filtros, ordenacao = [], []
        for nome, exp in expressions.items():
            pode_filtrar = str(exp.get("filter", "true")).lower() != "false"
            pode_ordenar = str(exp.get("sort", "true")).lower() != "false"
            item = {
                "campo": nome,
                "tipo": exp.get("type") or exp.get("enum") or "?",
                "descricao": exp.get("description", ""),
                "eh_enum": "enum" in exp,
            }
            if pode_filtrar:
                filtros.append(item)
            if pode_ordenar:
                ordenacao.append(item)

        path_params = [
            {"nome": p.get("name"), "tipo": (p.get("metadata") or {}).get("type", "?")}
            for p in (metodo.get("pathParams") or [])
        ]

        # queryParams de paginação/busca são infraestrutura, não parâmetro de negócio
        INFRA = {"offset", "limit", "filter", "sort", "fields"}
        query_params, query_infra = [], []
        for nome, meta in (metodo.get("queryParams") or {}).items():
            item = {"nome": nome, "tipo": meta.get("type") or meta.get("enum") or "?",
                    "eh_enum": "enum" in meta}
            (query_infra if nome in INFRA else query_params).append(item)

        caminho = metodo.get("path", "")
        fontes.append({
            "id": e.get("id"),
            "nome": e.get("name"),
            "descricao": e.get("description", ""),
            "operacao": metodo.get("name"),
            "verbo": metodo.get("verb"),
            "natureza": classificar(metodo.get("verb"), metodo.get("name")),
            "descricao_op": metodo.get("description", ""),
            "path": PREFIXO_API.sub("", caminho),
            "tipo_retorno": representation.get("type"),
            # --- as 4 dimensões ---
            "campos_retorno": achatar_tipo(types, representation.get("type")),
            "filtros": sorted(filtros, key=lambda x: x["campo"]),
            "ordenacao": sorted(ordenacao, key=lambda x: x["campo"]),
            "parametros_obrigatorios": path_params,
            "parametros_opcionais": query_params,
            "_query_infra": query_infra,
            "enums": e.get("enums") or {},
        })

    return fontes


if __name__ == "__main__":
    fontes = construir()
    destino = ROOT / "catalogo_v2.json"
    destino.write_text(json.dumps(fontes, ensure_ascii=False, indent=2), encoding="utf-8")

    from collections import Counter
    com_obrig = [f for f in fontes if f["parametros_obrigatorios"]]
    sem_filtro = [f for f in fontes if not f["filtros"]]
    print(f"Fontes processadas: {len(fontes)}")
    print(f"  com parâmetro OBRIGATÓRIO: {len(com_obrig)}")
    print(f"  sem nenhum filtro disponível: {len(sem_filtro)}")
    print(f"  com parâmetros opcionais de negócio: {len([f for f in fontes if f['parametros_opcionais']])}")
    print("  por natureza:", dict(Counter(f["natureza"] for f in fontes)))
    print(f"\nSalvo em: {destino}")
