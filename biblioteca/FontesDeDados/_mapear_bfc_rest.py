# -*- coding: utf-8 -*-
"""
Liga os dois mundos: catálogo REST  <->  nome usado no BFC-Script.

PROBLEMA QUE ISSO RESOLVE
-------------------------
O catálogo exportado nomeia as fontes pela rota REST (`certidoes-negativas`),
mas no editor da Betha a fonte se chama `certidaoNegativa`. O nome do editor
NÃO está em lugar nenhum do export — foi preciso extraí-lo de ~18 mil chamadas
reais nos scripts em produção (`nomes_bfc.json`).

Sem esse mapa, todo esqueleto de código gerado sai com o nome errado.

GRANULARIDADE: o casamento é por OPERAÇÃO (path), não por fonte. No BFC cada
sub-rota vira um nome próprio — `indexadores` e `indexadores.movimentacoes`
são a mesma fonte REST (`indexadores`), mas nomes diferentes no script:
    /indexadores               -> indexadores
    /indexadores/movimentacoes -> indexadores.movimentacoes
    /imoveis/{idImovel}/testadas -> imovel.testadas

PRINCÍPIO: nome errado quebra o script. Quando o casamento é ambíguo,
prefere-se NÃO mapear e avisar, em vez de chutar.

Saída: `mapa_bfc_rest.json`
"""
import json, io, sys, importlib.util, itertools
from pathlib import Path
from collections import Counter

R = Path(__file__).parent

# fonte.py reatribui sys.stdout ao ser importado; reabrir depois
spec = importlib.util.spec_from_file_location("fonte", R / "fonte.py")
_m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(_m)
_flexionar, CAT = _m._flexionar, _m.CAT
sys.stdout = io.TextIOWrapper(open(sys.__stdout__.fileno(), "wb", closefd=False),
                              encoding="utf-8")

bfc = json.loads((R / "nomes_bfc.json").read_text(encoding="utf-8"))


def chaves_do_path(path):
    """
    Gera as formas que um path pode assumir como nome BFC.

    Precisa flexionar CADA PALAVRA, inclusive dentro de segmento composto:
    `campos-adicionais` tem que gerar tanto `camposAdicionais` (leitura)
    quanto `campoAdicional` (gravação) — são nomes diferentes no script
    apontando pro mesmo path.

    /imoveis/{idImovel}/testadas   -> {imoveistestadas, imoveltestadas, ...}
    /imoveis/campos-adicionais     -> {imovelcampoadicional,
                                       imovelcamposadicionais, ...}
    """
    segs = [s for s in (path or "").split("/") if s and not s.startswith("{")]
    if not segs:
        return set()
    opcoes = []
    for seg in segs:
        palavras = [p for p in seg.lower().split("-") if p]
        if len(palavras) == 1:
            opcoes.append(_flexionar(palavras[0]))
        else:
            # flexiona cada palavra e recombina o segmento
            combos = itertools.product(*[_flexionar(p) for p in palavras])
            opcoes.append({"".join(c) for c in combos})
    total = 1
    for o in opcoes:
        total *= len(o)
    if total > 20000:            # trava contra explosão combinatória
        opcoes = [{sorted(o)[0]} for o in opcoes]
    return {"".join(c) for c in itertools.product(*opcoes)}


def chave_bfc(nome):
    return nome.replace(".", "").replace("-", "").lower()


if __name__ == "__main__":
    # índice: chave-de-path -> entradas do catálogo
    por_chave = {}
    for f in CAT:
        for k in chaves_do_path(f["path"]):
            por_chave.setdefault(k, []).append(f)

    # índice auxiliar por tipo de retorno (pra casos como certidaoNegativa)
    por_tipo = {}
    for f in CAT:
        if f["tipo_retorno"]:
            por_tipo.setdefault(f["tipo_retorno"].lower(), []).append(f)

    # Casos CONFIRMADOS rodando no Studio — vencem qualquer heurística.
    # O desempate por natureza (mais abaixo) separa leitura de escrita, mas
    # NÃO separa duas LEITURAS do mesmo cadastro. É o caso dos campos
    # adicionais de imóvel, confirmado em 31/08/2026:
    #   /imoveis/campos-adicionais          -> imoveis.camposAdicionais (lote,
    #                                          aceita criterio, sem parâmetro)
    #   /imoveis/{idImovel}/campos-adicionais -> imovel.camposAdicionais
    #                                          (exige parametros:[idImovel:..])
    # Usar o singular na rota de lote dá:
    #   "Os parâmetros 'idImovel' não foram definidos para fonte de dados".
    CONFIRMADOS = {
        "imoveis|buscarCampos|/imoveis/campos-adicionais":
            "imoveis.camposAdicionais",
        "imoveis|buscaCamposAdicionais|/imoveis/{idImovel}/campos-adicionais":
            "imovel.camposAdicionais",
    }

    bfc_para_rest, orfaos = {}, []
    # (nome_fonte, operacao, path) -> nome BFC
    por_operacao = {}
    vias = Counter()

    for nome, info in bfc.items():
        k = chave_bfc(nome)
        achados, via = por_chave.get(k), "path"
        if not achados:
            achados, via = por_tipo.get(k), "tipo_retorno"
        if not achados:
            orfaos.append({"nome_bfc": nome, "usos": info["usos"]})
            continue

        vias[via] += 1
        bfc_para_rest[nome] = {
            "rest": sorted({f["nome"] for f in achados}),
            "operacoes": sorted({f["operacao"] for f in achados if f["operacao"]}),
            "paths": sorted({f["path"] for f in achados}),
            "via": via,
            "usos_producao": info["usos"],
        }
        for f in achados:
            ident = f"{f['nome']}|{f['operacao']}|{f['path']}"
            atual = por_operacao.get(ident)
            cand = {"bfc": nome, "usos_producao": info["usos"], "via": via}
            if not atual:
                por_operacao[ident] = cand
                continue
            # Desempate por NATUREZA. O mesmo path serve GET e POST
            # (/imoveis/campos-adicionais), mas o nome no script difere:
            #   leitura -> imovel.camposAdicionais  (plural)
            #   escrita -> imovel.campoAdicional    (singular)
            # Sem isso, o esqueleto de gravação sai com o nome da leitura.
            leitura = f.get("natureza") == "LEITURA"
            def combina(n):
                ultimo = n.split(".")[-1]
                plural = ultimo.endswith("s")
                return plural == leitura
            if combina(nome) and not combina(atual["bfc"]):
                por_operacao[ident] = cand
            elif combina(nome) == combina(atual["bfc"]) and info["usos"] > atual["usos_producao"]:
                por_operacao[ident] = cand

    for ident, nome_confirmado in CONFIRMADOS.items():
        if ident in por_operacao:
            por_operacao[ident] = {
                "bfc": nome_confirmado,
                "usos_producao": bfc.get(nome_confirmado, {}).get("usos", 0),
                "via": "confirmado",
            }

    # nome BFC "padrão" de cada fonte REST: só quando não há conflito entre
    # as operações dela (senão o esqueleto usaria o nome de outra sub-rota)
    rest_para_bfc = {}
    por_fonte = {}
    for ident, v in por_operacao.items():
        por_fonte.setdefault(ident.split("|")[0], []).append(v["bfc"])
    for fonte_rest, nomes in por_fonte.items():
        raizes = {n.split(".")[0] for n in nomes}
        if len(raizes) == 1:
            escolhido = min(nomes, key=len)   # a raiz, não a sub-rota
            rest_para_bfc[fonte_rest] = {
                "bfc": escolhido,
                "usos_producao": bfc.get(escolhido, {}).get("usos", 0),
            }

    saida = {
        "_leia": "Use SEMPRE o nome 'bfc' no script — o nome REST do catálogo "
                 "frequentemente é diferente. 'por_operacao' é o mapa mais "
                 "preciso (por path); 'rest_para_bfc' só traz fontes sem "
                 "ambiguidade entre suas operações.",
        "por_operacao": por_operacao,
        "rest_para_bfc": rest_para_bfc,
        "bfc_para_rest": bfc_para_rest,
        "sem_correspondencia": sorted(orfaos, key=lambda x: -x["usos"]),
    }
    (R / "mapa_bfc_rest.json").write_text(
        json.dumps(saida, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"nomes BFC no corpus: {len(bfc)}")
    print(f"  casados: {len(bfc_para_rest)}  {dict(vias)}")
    print(f"  sem correspondência: {len(orfaos)}")
    print(f"operações do catálogo com nome BFC: {len(por_operacao)} de {len(CAT)}")
    print(f"fontes REST com nome BFC não-ambíguo: {len(rest_para_bfc)} de {len({f['nome'] for f in CAT})}")
    print(f"\nSalvo: {R / 'mapa_bfc_rest.json'}")
