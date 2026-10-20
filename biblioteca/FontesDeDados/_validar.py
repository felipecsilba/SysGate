# -*- coding: utf-8 -*-
"""
Teste de regressão do mapeamento de nomes de fonte.

Valida a ferramenta contra CÓDIGO QUE RODA EM PRODUÇÃO: os nomes de fonte
usados nos scripts da base são a verdade; se `fonte.py` não encontra um deles,
ou gera um nome diferente, é bug da ferramenta.

Rodar depois de qualquer mexida em `_mapear_bfc_rest.py` ou `fonte.py`.

    python _validar.py
"""
import json, io, sys, importlib.util
from pathlib import Path

R = Path(__file__).parent
spec = importlib.util.spec_from_file_location("fonte", R / "fonte.py")
_m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(_m)
sys.stdout = io.TextIOWrapper(open(sys.__stdout__.fileno(), "wb", closefd=False),
                              encoding="utf-8")

# Casos confirmados manualmente pelo usuário na tela do sistema e/ou
# presentes em scripts validados em produção (Placas, Andradas).
CASOS = [
    # (nome no editor,            fonte REST,           operação)
    ("imoveis",                   "imoveis",            "busca"),
    ("imovel.camposAdicionais",   "imoveis",            "buscaCamposAdicionais"),
    # confirmado rodando no Studio em 31/08/2026: são DUAS leituras distintas
    # — a plural é a de lote (aceita criterio), a singular exige idImovel
    ("imoveis.camposAdicionais",  "imoveis",            "buscarCampos"),
    ("imovel.campoAdicional",     "imoveis",            "preenche"),
    ("imovel.testadas",           "imoveis",            "buscaTestadas"),
    ("indexadores.movimentacoes", "indexadores",        None),
    ("certidaoNegativa",          "certidoes-negativas", "busca"),
    ("certidaoITBI",              "certidoes-itbi",     None),
    ("contribuinte.emails",       "contribuinte",       None),
    ("dividas.debitosInscritos",  "dividas",            None),
]

# Fatos confirmados na tela do sistema pelo usuário
FATOS = [
    ("certidaoNegativa", "filtros", 0),
    ("contribuinte.emails", "parametros_obrigatorios", 1),
    ("dividas.debitosInscritos", "filtros", 4),
    ("dividas.debitosInscritos", "campos_retorno", 4),
]

if __name__ == "__main__":
    falhas = []

    print("== 1. a ferramenta encontra o nome que aparece no editor? ==")
    for nome_editor, rest, operacao in CASOS:
        achadas = _m.achar_fontes(nome_editor)
        if not achadas:
            falhas.append(f"não encontrou '{nome_editor}'")
            print(f"  ✗ {nome_editor:28} NÃO ENCONTRADA")
            continue
        if operacao:
            achadas = [f for f in achadas if f["operacao"] == operacao] or achadas
        f = achadas[0]
        gerado, _ = _m.nome_bfc(f)
        ok = f["nome"] == rest and gerado == nome_editor
        print(f"  {'✓' if ok else '✗'} {nome_editor:28} -> {f['nome']} / {f['operacao']}"
              f"{'' if gerado == nome_editor else f'   (gerou: {gerado})'}")
        if not ok:
            falhas.append(f"{nome_editor}: esperava {rest}, gerou nome '{gerado}'")

    print("\n== 2. os números batem com o que foi conferido na tela? ==")
    for nome_editor, dimensao, esperado in FATOS:
        achadas = _m.achar_fontes(nome_editor)
        if not achadas:
            falhas.append(f"não encontrou '{nome_editor}' para checar {dimensao}")
            continue
        obtido = len(achadas[0][dimensao])
        ok = obtido == esperado
        print(f"  {'✓' if ok else '✗'} {nome_editor:28} {dimensao:24} "
              f"esperado={esperado} obtido={obtido}")
        if not ok:
            falhas.append(f"{nome_editor}.{dimensao}: esperava {esperado}, veio {obtido}")

    print("\n== 3. leitura x gravação não se confundem ==")
    ler = [f for f in _m.CAT if f["nome"] == "imoveis" and f["operacao"] == "buscaCamposAdicionais"]
    gravar = [f for f in _m.CAT if f["nome"] == "imoveis" and f["operacao"] == "preenche"]
    if ler and gravar:
        n_ler, n_gravar = _m.nome_bfc(ler[0])[0], _m.nome_bfc(gravar[0])[0]
        ok = n_ler != n_gravar
        print(f"  {'✓' if ok else '✗'} leitura={n_ler}  gravação={n_gravar}")
        if not ok:
            falhas.append("leitura e gravação de campo adicional com o mesmo nome")

    print()
    if falhas:
        print(f"FALHOU — {len(falhas)} problema(s):")
        for f in falhas:
            print(f"   - {f}")
        sys.exit(1)
    print("TUDO OK — mapeamento bate com o uso real em produção.")
