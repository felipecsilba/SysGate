# -*- coding: utf-8 -*-
"""
Extrai os nomes REAIS de fonte usados no BFC-Script, a partir do corpus de
scripts em produção (`Scripts/` e `Formulas/`).

POR QUE ISSO EXISTE
-------------------
O catálogo de fontes (`raw/`, `catalogo_v2.json`) usa o nome da rota REST
(ex.: `certidoes-negativas`), que **não é** o nome usado no BFC-Script
(ex.: `Dados.tributos.v2.certidaoNegativa`).

O nome BFC não está em lugar nenhum do export. Mas está implícito em ~20 mil
chamadas reais espalhadas pelos scripts da base — que são código que roda em
produção, logo é a fonte de verdade mais confiável que existe pra isso.

Descoberto quando o usuário reportou que não achava `certidoes-negativas` no
editor da Betha; o nome de verdade é `certidaoNegativa`.

Saída: `nomes_bfc.json`  { "certidaoNegativa": {"usos": 70, ...}, ... }
"""
import re, json, io, sys
from collections import Counter
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
BASE = Path(__file__).parent.parent
DESTINO = Path(__file__).parent / "nomes_bfc.json"

CHAMADA = re.compile(r"Dados\.tributos\.v2((?:\.[A-Za-z_][A-Za-z0-9_]*)+)")

# sufixos que são operação, não parte do nome da fonte
OPERACAO = re.compile(
    r"\.(busca|buscar|preenche|cria|criar|altera|alterar|calcula|calcular|"
    r"metadados|soma|somar|remove|remover|exclui|excluir|atualiza|atualizar|"
    r"indefere|deferir|each|find|collect|size|sort|toString)"
    r"[A-Za-z0-9_]*$"
)


def extrair():
    usos = Counter()
    onde = {}
    for pasta in ("Scripts", "Formulas"):
        raiz = BASE / pasta
        if not raiz.exists():
            continue
        for arq in raiz.rglob("*.txt"):
            try:
                texto = arq.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            for m in CHAMADA.finditer(texto):
                caminho = m.group(1).lstrip(".")
                # remove sufixo de operação, repetidamente (ex: .busca.each)
                anterior = None
                while anterior != caminho:
                    anterior = caminho
                    caminho = OPERACAO.sub("", caminho)
                if not caminho:
                    continue
                usos[caminho] += 1
                onde.setdefault(caminho, set()).add(f"{pasta}/{arq.name}")
    return usos, onde


if __name__ == "__main__":
    usos, onde = extrair()
    dados = {
        nome: {
            "usos": qtd,
            "raiz": nome.split(".")[0],
            "exemplos": sorted(onde[nome])[:3],
        }
        for nome, qtd in usos.most_common()
    }
    DESTINO.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")

    raizes = Counter(v["raiz"] for v in dados.values())
    print(f"Nomes de fonte distintos usados no BFC-Script: {len(dados)}")
    print(f"Raízes distintas: {len(raizes)}")
    print(f"Total de chamadas analisadas: {sum(usos.values())}")
    print(f"\nSalvo em: {DESTINO}")
