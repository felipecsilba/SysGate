# -*- coding: utf-8 -*-
"""
fonte.py — consulta de fontes de dados do BFC-Script (Betha Tributos).

Roda sobre `catalogo_v2.json`, que separa corretamente as 4 dimensões de uma
fonte:
    campos de retorno | filtros (criterio:) | ordenação (ordem:) | parâmetros

COMANDOS
--------
  python fonte.py ver <nome-da-fonte> [operacao]
        Mostra as 4 dimensões da fonte + esqueleto de código BFC-Script
        pronto, já com os parâmetros OBRIGATÓRIOS preenchidos.

  python fonte.py campo <termo>
        Em quais fontes esse campo aparece — separando se dá pra usar como
        FILTRO, como PARÂMETRO, ou se só vem no RETORNO.

  python fonte.py rel <nome-da-fonte>
        Com quais outras fontes essa se relaciona e por qual campo.

  python fonte.py buscar <termo> [natureza]
        Procura fontes por nome/descrição/path/nome-no-script.
        natureza opcional: leitura | criacao | alteracao | exclusao

  python fonte.py obrigatorios
        Lista todas as fontes que exigem parâmetro obrigatório.

  python fonte.py escrita
        Lista tudo que NÃO é consulta — cria, altera ou exclui dados.

NATUREZA DA OPERAÇÃO
--------------------
  🔍 LEITURA    (GET .busca)     — consulta, não altera nada   [423]
  ➕ CRIAÇÃO    (POST .cria)     — insere                       [51]
  ✏️ ALTERAÇÃO  (PUT .altera/.preenche) — modifica              [42]
  🗑️ EXCLUSÃO   (DELETE .exclui) — remove                       [58]

Atenção: existem 16 operações `busca` que usam POST (não GET) — provavelmente
por causa de filtro grande demais pra querystring. Elas continuam sendo
LEITURA; a classificação leva em conta o nome da operação, não só o verbo.

REGRAS QUE VALEM A PENA LEMBRAR
-------------------------------
* Parâmetro do PATH (`/imoveis/{idImovel}/...`) é OBRIGATÓRIO — sem ele a
  chamada falha. Vai em `parametros:`.
* `criterio:` só aceita campos que estão em FILTROS. Fonte com 0 filtros
  (ex.: `certidoes-negativas`) não aceita `criterio:` nenhum — só os
  parâmetros dela.
* Campo que só existe no RETORNO não pode ser usado pra filtrar.
"""
import json, sys, io, re, unicodedata
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
ROOT = Path(__file__).parent
CAT = json.loads((ROOT / "catalogo_v2.json").read_text(encoding="utf-8"))

# nome REST (catálogo) -> nome usado no BFC-Script, confirmado no corpus.
# O catálogo chama de `certidoes-negativas` o que no editor é `certidaoNegativa`.
# O mapa por OPERAÇÃO é o mais preciso: no BFC cada sub-rota tem nome próprio
# (`indexadores` vs `indexadores.movimentacoes` = mesma fonte REST).
_MAPA = ROOT / "mapa_bfc_rest.json"
NOMES_BFC = json.loads(_MAPA.read_text(encoding="utf-8")) if _MAPA.exists() else {}
POR_OPERACAO = NOMES_BFC.get("por_operacao", {})
REST_PARA_BFC = NOMES_BFC.get("rest_para_bfc", {})


def nome_bfc(fonte):
    """Retorna (nome_no_script, usos_em_producao) — usos=0 se não confirmado."""
    ident = f"{fonte['nome']}|{fonte['operacao']}|{fonte['path']}"
    info = POR_OPERACAO.get(ident) or REST_PARA_BFC.get(fonte["nome"])
    if info:
        return info["bfc"], info.get("usos_producao", 0)
    return fonte["nome"], 0


# ---------------------------------------------------------------- utilidades
def _limpar(txt):
    """minúsculo, sem acento, sem hífen/underscore/espaço."""
    if not txt:
        return ""
    t = unicodedata.normalize("NFKD", txt).encode("ascii", "ignore").decode()
    return re.sub(r"[-_\s]", "", t).lower()


def _flexionar(p):
    """Formas singular/plural de UMA palavra, cobrindo plural português."""
    v = {p}
    regras = [
        ("eis", "el"), ("el", "eis"),        # imovel    <-> imoveis
        ("ores", "or"), ("or", "ores"),      # indexador <-> indexadores
        ("oes", "ao"), ("ao", "oes"),        # opcao     <-> opcoes
        ("aes", "ao"),
        ("ais", "al"), ("al", "ais"),        # adicional <-> adicionais
        ("ns", "m"), ("m", "ns"),            # bem       <-> bens
        ("is", "il"), ("il", "is"),          # fossil    <-> fosseis
    ]
    for suf, troca in regras:
        if p.endswith(suf):
            v.add(p[: -len(suf)] + troca)
    v.add(p[:-1] if p.endswith("s") else p + "s")
    return v


def variantes(txt):
    """
    Gera formas equivalentes singular/plural de um nome de entidade/fonte.

    Precisa tratar dois casos que a normalização ingênua erra:
      1. plural irregular  — 'imovel' x 'imoveis' (esse bug fez `dividas`
         não listar `imoveis`), 'indexador' x 'indexadores'
      2. plural COMPOSTO em camelCase — 'campoAdicional' x 'camposAdicionais',
         'guiaUnificada' x 'guiasUnificadas': flexiona cada parte.
    """
    if not txt:
        return set()
    bruto = re.sub(r"[-_\s]", "", unicodedata.normalize("NFKD", txt)
                   .encode("ascii", "ignore").decode())
    partes = re.findall(r"[A-Z]?[a-z0-9]+", bruto) or [bruto]
    partes = [p.lower() for p in partes]

    v = _flexionar("".join(partes))
    if len(partes) > 1:
        # flexiona todas as partes juntas (campoAdicional -> camposadicionais)
        combos = [_flexionar(p) for p in partes]
        for forma in ("".join(c) for c in __import__("itertools").product(*combos)):
            v.add(forma)
    return v


def normalizar(txt):
    return _limpar(txt)


# entidade referenciada -> fonte(s) que fornecem essa entidade
_INDICE_FONTES = {}
for _f in CAT:
    for _v in variantes(_f["nome"]):
        _INDICE_FONTES.setdefault(_v, set()).add(_f["nome"])

# casos que a normalização sozinha não resolve
APELIDOS = {
    "receitadiversa": "receitas-diversas",
    "receitadiversalancamento": "receitas-diversas",
    "notaavulsa": "notas-avulsas",
    "transferenciaimovei": "transferenciaImovel",
    "creditotributario": "creditosTributarios",
    "contribmelhoriaimovel": "contribuicaoMelhoriaImovel",
    "parcelamentoparcela": "parcelamentos",
    "parcelapagaemparcelamento": "parcelamentos",
    "debitooriginal": "debitos",
    "pessoa": "contribuintes",
    "guia": "guiasUnificadas",
    "calculotributario": "CalculoTributarioController",
}


def entidade_para_fonte(entidade):
    for v in variantes(entidade):
        if v in APELIDOS:
            return APELIDOS[v]
    for v in variantes(entidade):
        achado = _INDICE_FONTES.get(v)
        if achado:
            return sorted(achado)[0]
    return None


def entidade_do_campo(campo):
    """'idEconomico' -> 'Economico'; 'divida.economico.id' -> 'economico'."""
    base = campo.split(".")[-1]
    m = re.match(r"^id([A-Z]\w*)$", base)
    if m:
        return m.group(1)
    partes = campo.split(".")
    if base == "id" and len(partes) >= 2:
        return partes[-2]
    return None


def _filtro_exemplo(filtros):
    """Escolhe o filtro mais representativo pro esqueleto (não o 1º alfabético)."""
    nomes = [c["campo"] for c in filtros]
    for preferido in ("id", "codigo", "situacao", "ano"):
        if preferido in nomes:
            return preferido
    simples = [n for n in nomes if "." not in n]
    return (simples or nomes)[0]


def achar_fontes(nome):
    """Aceita tanto o nome REST do catálogo quanto o nome usado no BFC-Script
    (inclusive com ponto: `imovel.testadas`, `contribuinte.emails`)."""
    n = normalizar(nome)
    ident_por_fonte = {}
    for ident, info in POR_OPERACAO.items():
        ident_por_fonte.setdefault(normalizar(info["bfc"]), []).append(ident)

    exatas = [f for f in CAT if normalizar(f["nome"]) == n]
    if exatas:
        return exatas

    # nome BFC exato (o que aparece no editor da Betha)
    if n in ident_por_fonte:
        alvo = set(ident_por_fonte[n])
        achadas = [f for f in CAT
                   if f"{f['nome']}|{f['operacao']}|{f['path']}" in alvo]
        if achadas:
            return achadas

    for rest, info in REST_PARA_BFC.items():
        if normalizar(info["bfc"]) == n:
            achadas = [f for f in CAT if f["nome"] == rest]
            if achadas:
                return achadas

    parciais = [f for f in CAT if n in normalizar(f["nome"])]
    if parciais:
        return parciais

    # última tentativa: nome BFC parcial
    alvo = {i for chave, ids in ident_por_fonte.items() if n in chave for i in ids}
    return [f for f in CAT if f"{f['nome']}|{f['operacao']}|{f['path']}" in alvo]


MARCA = {"LEITURA": "🔍 LEITURA", "CRIACAO": "➕ CRIAÇÃO",
         "ALTERACAO": "✏️ ALTERAÇÃO", "EXCLUSAO": "🗑️ EXCLUSÃO"}


def rotulo(f):
    script, usos = nome_bfc(f)
    apelido = f"  (no script: {script})" if usos else ""
    nat = MARCA.get(f.get("natureza", ""), f.get("natureza", ""))
    return f"{f['nome']} / {f['operacao']}  [{nat} · {f['verbo']}] {f['path']}{apelido}"


# ------------------------------------------------------------------ comandos
def cmd_ver(nome, operacao=None):
    fontes = achar_fontes(nome)
    if not fontes:
        print(f"Nenhuma fonte encontrada para '{nome}'. Tente: python fonte.py buscar {nome}")
        return
    if operacao:
        fontes = [f for f in fontes if normalizar(f["operacao"] or "") == normalizar(operacao)] or fontes

    if len(fontes) > 1:
        print(f"{len(fontes)} operações encontradas para '{nome}':\n")
        for i, f in enumerate(fontes, 1):
            obrig = ", ".join(p["nome"] for p in f["parametros_obrigatorios"]) or "—"
            print(f"  [{i}] {rotulo(f)}")
            print(f"      retorno={f['tipo_retorno']} | filtros={len(f['filtros'])} | obrigatórios: {obrig}")
        print("\nMostrando a primeira em detalhe. Use: python fonte.py ver <nome> <operacao>\n")
        print("=" * 78)

    f = fontes[0]
    print(f"\n{rotulo(f)}")
    if f["descricao_op"]:
        print(f"  {f['descricao_op']}")
    if f.get("natureza") in ("ALTERACAO", "EXCLUSAO", "CRIACAO"):
        print(f"  ⚠ OPERAÇÃO DE ESCRITA ({f['natureza']}) — altera dados no sistema.")
    print("=" * 78)

    print(f"\n[1] PARÂMETROS")
    if f["parametros_obrigatorios"]:
        print("  ⚠ OBRIGATÓRIOS (sem eles a chamada falha):")
        for p in f["parametros_obrigatorios"]:
            print(f"      • {p['nome']} ({p['tipo']})")
    else:
        print("  (nenhum obrigatório)")
    if f["parametros_opcionais"]:
        print("  Opcionais:")
        for p in f["parametros_opcionais"]:
            print(f"      • {p['nome']} ({p['tipo']})")

    print(f"\n[2] FILTROS — o que pode ir em criterio:  ({len(f['filtros'])})")
    if not f["filtros"]:
        print("  ⚠ NENHUM. Esta fonte não aceita `criterio:` — use só os parâmetros acima.")
    else:
        for c in f["filtros"][:40]:
            desc = f"  — {c['descricao']}" if c["descricao"] else ""
            print(f"      {c['campo']} ({c['tipo']}){desc}")
        if len(f["filtros"]) > 40:
            print(f"      ... e mais {len(f['filtros']) - 40}")

    print(f"\n[3] ORDENAÇÃO — o que pode ir em ordem:  ({len(f['ordenacao'])})")
    naoordena = {c["campo"] for c in f["filtros"]} - {c["campo"] for c in f["ordenacao"]}
    if naoordena:
        print(f"  (filtra mas NÃO ordena: {', '.join(sorted(naoordena)[:10])})")
    else:
        print("  (mesmos campos dos filtros)")

    print(f"\n[4] CAMPOS DE RETORNO — o que pode ir em campos:  ({len(f['campos_retorno'])})")
    for c in f["campos_retorno"][:25]:
        print(f"      {c['campo']} ({c['tipo']})")
    if len(f["campos_retorno"]) > 25:
        print(f"      ... e mais {len(f['campos_retorno']) - 25}")

    if f["enums"]:
        print(f"\n[+] ENUMS")
        for nome_enum, meta in f["enums"].items():
            vals = meta.get("values", meta) if isinstance(meta, dict) else meta
            print(f"      {nome_enum}: {json.dumps(vals, ensure_ascii=False)[:200]}")

    # ---------------- esqueleto de código
    print("\n" + "=" * 78)
    print("ESQUELETO BFC-SCRIPT")
    print("=" * 78)
    nome_script, usos = nome_bfc(f)
    var = re.sub(r"[^a-zA-Z]", "", nome_script.split(".")[-1])
    var = "fonte" + (var[0].upper() + var[1:] if var else "X")
    # nome com hífen/espaço não aceita notação de ponto em Groovy
    acesso = (f".{nome_script}" if re.fullmatch(r"[A-Za-z_][\w.]*", nome_script or "")
              else f'["{nome_script}"]')
    if usos:
        print(f"// nome da fonte confirmado em {usos} usos reais na base")
    else:
        print(f"// ⚠ ATENÇÃO: '{f['nome']}' é o nome da rota REST no catálogo.")
        print("//   O nome no editor da Betha pode ser DIFERENTE (ex.: o catálogo")
        print("//   diz 'certidoes-negativas', mas no script é 'certidaoNegativa').")
        print("//   Confirme na lista de fontes do editor antes de usar.")
    print(f"{var} = Dados.tributos.v2{acesso}")
    print()
    args = []
    if f["filtros"]:
        args.append(f'  criterio: "{_filtro_exemplo(f["filtros"])} = :valor"')
    params = [p["nome"] for p in f["parametros_obrigatorios"]] + [p["nome"] for p in f["parametros_opcionais"]]
    if params:
        args.append("  parametros: [" + ", ".join(f'"{p}": {p}' for p in params) + "]")
    if f["ordenacao"]:
        args.append(f'  ordem: "{f["ordenacao"][0]["campo"]} desc"')
    campos_ex = ", ".join(c["campo"] for c in f["campos_retorno"][:4])
    if campos_ex:
        args.append(f'  campos: "{campos_ex}"')
    chamada = f"{var}.{f['operacao']}(" + (
        "\n" + ",\n".join(args) + "\n" if args else "") + ")"
    print(f"dados = {chamada}")
    print()
    print("percorrer(dados) { item ->")
    print("  imprimir item")
    print("}")
    if f["parametros_obrigatorios"]:
        ps = f["parametros_obrigatorios"]
        nomes = ", ".join(p["nome"] for p in ps)
        verbo = "é obrigatório" if len(ps) == 1 else "são obrigatórios"
        print(f"\n// ⚠ LEMBRE: {nomes} {verbo} — defina antes de chamar,")
        print("//   senão a fonte retorna erro.")


def cmd_campo(termo):
    t = termo.lower()
    como_filtro, como_param, so_retorno = {}, {}, {}
    for f in CAT:
        chave = rotulo(f)
        fil = [c["campo"] for c in f["filtros"] if t in c["campo"].lower()]
        par = [p["nome"] for p in f["parametros_obrigatorios"] + f["parametros_opcionais"]
               if t in p["nome"].lower()]
        ret = [c["campo"] for c in f["campos_retorno"] if t in c["campo"].lower()]
        if fil:
            como_filtro.setdefault(f["nome"], set()).update(fil)
        if par:
            como_param.setdefault(f["nome"], set()).update(par)
        if ret and not fil and not par:
            so_retorno.setdefault(f["nome"], set()).update(ret)

    print(f"Termo: '{termo}'\n")
    print(f"■ COMO FILTRO (criterio:) — {len(como_filtro)} fontes")
    for k in sorted(como_filtro):
        print(f"   {k}: {', '.join(sorted(como_filtro[k])[:6])}")
    print(f"\n■ COMO PARÂMETRO (parametros:) — {len(como_param)} fontes")
    for k in sorted(como_param):
        print(f"   {k}: {', '.join(sorted(como_param[k]))}")
    print(f"\n■ SÓ NO RETORNO (não filtra por ele) — {len(so_retorno)} fontes")
    for k in sorted(so_retorno):
        print(f"   {k}: {', '.join(sorted(so_retorno[k])[:4])}")


def cmd_rel(nome):
    fontes = achar_fontes(nome)
    if not fontes:
        print(f"Fonte '{nome}' não encontrada.")
        return
    nome_real = fontes[0]["nome"]
    grupo = [f for f in CAT if f["nome"] == nome_real]

    saida = {}   # fonte destino -> {via, tipo}
    for f in grupo:
        for c in f["filtros"]:
            ent = entidade_do_campo(c["campo"])
            alvo = entidade_para_fonte(ent) if ent else None
            if alvo and alvo != nome_real:
                saida.setdefault(alvo, set()).add(f"{c['campo']} (filtro)")
        for p in f["parametros_obrigatorios"]:
            ent = entidade_do_campo(p["nome"])
            alvo = entidade_para_fonte(ent) if ent else None
            if alvo and alvo != nome_real:
                saida.setdefault(alvo, set()).add(f"{p['nome']} (PARÂMETRO OBRIGATÓRIO)")

    print(f"■ {nome_real} pode ser filtrada/parametrizada pelo ID de:\n")
    for alvo in sorted(saida):
        print(f"   → {alvo}")
        for via in sorted(saida[alvo]):
            print(f"       via {via}")

    inverso = {}
    for f in CAT:
        if f["nome"] == nome_real:
            continue
        for c in f["filtros"] + [{"campo": p["nome"]} for p in f["parametros_obrigatorios"]]:
            ent = entidade_do_campo(c["campo"])
            if ent and entidade_para_fonte(ent) == nome_real:
                inverso.setdefault(f["nome"], set()).add(c["campo"])
    print(f"\n■ Quem aponta PARA {nome_real} ({len(inverso)} fontes):\n")
    for k in sorted(inverso):
        print(f"   ← {k}: {', '.join(sorted(inverso[k])[:5])}")


def cmd_buscar(termo, natureza=None):
    t = termo.lower()
    achados = [f for f in CAT
               if t in (f["nome"] or "").lower()
               or t in (f["descricao"] or "").lower()
               or t in (f["descricao_op"] or "").lower()
               or t in (f["path"] or "").lower()
               or t in nome_bfc(f)[0].lower()]
    if natureza:
        n = natureza.upper().replace("Ç", "C").replace("Ã", "A")
        achados = [f for f in achados if f.get("natureza", "").startswith(n[:5])]
    print(f"{len(achados)} resultado(s) para '{termo}'"
          f"{' [' + natureza + ']' if natureza else ''}:\n")
    for f in sorted(achados, key=lambda x: (x.get("natureza", ""), x["nome"] or "", x["path"] or "")):
        obrig = ",".join(p["nome"] for p in f["parametros_obrigatorios"])
        marca = f"  ⚠ obrigatórios: {obrig}" if obrig else ""
        print(f"  {rotulo(f)}{marca}")


def cmd_escrita():
    """Lista tudo que NÃO é leitura — o que altera dados no sistema."""
    escrita = [f for f in CAT if f.get("natureza") != "LEITURA"]
    por_nat = {}
    for f in escrita:
        por_nat.setdefault(f["natureza"], []).append(f)
    print(f"{len(escrita)} operações de ESCRITA (de {len(CAT)} totais)\n")
    for nat in ("CRIACAO", "ALTERACAO", "EXCLUSAO"):
        itens = por_nat.get(nat, [])
        print(f"\n{MARCA[nat]} — {len(itens)} operações")
        print("=" * 70)
        for f in sorted(itens, key=lambda x: (x["nome"] or "").lower()):
            script, usos = nome_bfc(f)
            obrig = ",".join(p["nome"] for p in f["parametros_obrigatorios"])
            print(f"  {script if usos else f['nome']} . {f['operacao']}")
            print(f"      [{f['verbo']}] {f['path']}" + (f"   ⚠ {obrig}" if obrig else ""))


def cmd_obrigatorios():
    com = [f for f in CAT if f["parametros_obrigatorios"]]
    print(f"{len(com)} fontes exigem parâmetro obrigatório:\n")
    for f in sorted(com, key=lambda x: (x["nome"] or "")):
        ps = ", ".join(f"{p['nome']}({p['tipo']})" for p in f["parametros_obrigatorios"])
        print(f"  {f['nome']} / {f['operacao']}")
        print(f"      {f['path']}")
        print(f"      ⚠ {ps}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == "ver" and args:
        cmd_ver(args[0], args[1] if len(args) > 1 else None)
    elif cmd == "campo" and args:
        cmd_campo(args[0])
    elif cmd == "rel" and args:
        cmd_rel(args[0])
    elif cmd == "buscar" and args:
        cmd_buscar(args[0], args[1] if len(args) > 1 else None)
    elif cmd == "obrigatorios":
        cmd_obrigatorios()
    elif cmd == "escrita":
        cmd_escrita()
    else:
        print(__doc__)
