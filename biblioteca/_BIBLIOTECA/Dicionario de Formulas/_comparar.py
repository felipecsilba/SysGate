# -*- coding: utf-8 -*-
"""
Gera o comparativo entre todos os tipos de formula ja capturados.

    python _comparar.py

Le todos os JSON de ../../_CONHECIMENTO/_bruto/formula-catalogo/
Grava _COMPARATIVO por tipo.md
"""
import json, os, io, sys, collections

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..'))
BRUTO = os.path.join(RAIZ, '_CONHECIMENTO', '_bruto', 'formula-catalogo')

# ordem de exibicao e rotulo curto para caber na tabela
ORDEM = [
    ('GERACAO_CREDITO_IMOVEIS',          'IMOV'),
    ('GERACAO_CREDITO_ECONOMICOS',       'ECON'),
    ('GERACAO_CREDITO_RECEITAS_DIVERSAS', 'RECD'),
    ('CALCULO_PROJETOS_OBRAS',           'OBRA'),
    ('ITBI',                             'ITBI'),
    ('FORMULA_ACRESCIMO_DEBITO',         'A_DEB'),
    ('FORMULA_ACRESCIMO_DIVIDA_ATIVA',   'A_DIV'),
    ('FORMULA_ACRESCIMO_PARCELAMENTO',   'A_PAR'),
    ('DESCONTO_GUIA',                    'DESC'),
    ('CONVENIO_BANCARIO',                'CONV'),
]


def carregar():
    cat = {}
    for tipo, _ in ORDEM:
        p = os.path.join(BRUTO, tipo + '.json')
        if os.path.exists(p):
            with io.open(p, encoding='utf8') as f:
                cat[tipo] = json.load(f)
    return cat


def metodos(cat, tipo, classe):
    """Nomes dos metodos de uma classe (ou variavel) num tipo. Vazio se nao existe."""
    d = cat.get(tipo)
    if not d:
        return None
    for grupo in ('classes', 'variables'):
        for c in d.get(grupo, []):
            if c['name'] == classe:
                return {(m.get('info') or {}).get('name') or m['name'] for m in c.get('methods', [])}
    return None


def tabela(P, titulo, linhas, tipos, cabecalho='Item'):
    P('| {} | {} |'.format(cabecalho, ' | '.join(r for _, r in tipos)))
    P('|---|{}'.format(':-:|' * len(tipos)))
    for nome, celulas in linhas:
        P('| `{}` | {} |'.format(nome, ' | '.join(celulas)))
    P('')


def main():
    cat = carregar()
    tipos = [(t, r) for t, r in ORDEM if t in cat]
    faltando = [t for t, _ in ORDEM if t not in cat]
    out = []
    P = out.append

    P('# Comparativo entre tipos de fórmula\n')
    P('> **Gerado por** `_comparar.py` a partir de')
    P('> `_CONHECIMENTO/_bruto/formula-catalogo/*.json`. **Não editar à mão.**\n')
    P('## A regra que este documento existe pra gravar\n')
    P('> **Nome de função só vale dentro do tipo de fórmula em que ele existe.**')
    P('> Copiar código de um tipo para outro é a receita para "não roda e não')
    P('> sei por quê".\n')
    P('Vale tanto quanto a regra de que nada é portável entre municípios — e é')
    P('menos óbvia, porque o nome da *classe* costuma ser o mesmo.\n')
    P('**{} tipos capturados.**\n'.format(len(tipos)))

    P('| Rótulo | Tipo | Variáveis | Classes |')
    P('|---|---|---:|---:|')
    for t, r in tipos:
        P('| `{}` | `{}` | {} | {} |'.format(r, t, len(cat[t].get('variables', [])), len(cat[t].get('classes', []))))
    P('')

    # ---------- classes ----------
    P('---\n')
    P('## Classes por tipo\n')
    P('Número = quantidade de métodos. `—` = a classe não existe naquele tipo.\n')
    todas = set()
    for t, _ in tipos:
        todas |= {c['name'] for c in cat[t].get('classes', [])}

    def n_met(t, cl):
        m = metodos(cat, t, cl)
        return str(len(m)) if m is not None else '—'

    linhas = []
    for cl in sorted(todas, key=lambda c: (-sum(1 for t, _ in tipos if metodos(cat, t, c) is not None), c)):
        linhas.append((cl, [n_met(t, cl) for t, _ in tipos]))
    tabela(P, 'Classes', linhas, tipos, 'Classe')

    universais = [cl for cl in todas if all(metodos(cat, t, cl) is not None for t, _ in tipos)]
    iguais = []
    for cl in universais:
        conjuntos = [frozenset(metodos(cat, t, cl)) for t, _ in tipos]
        if len(set(conjuntos)) == 1:
            iguais.append(cl)
    if iguais:
        P('**Idênticas em todos os tipos** (seguras de copiar entre tipos): {}\n'.format(
            ' · '.join('`%s`' % c for c in sorted(iguais))))
    # Detalhar toda classe que aparece em 2+ tipos com conjuntos de metodos diferentes.
    # (nao so as que existem em todos — `Utilitarios` falta em DESCONTO_GUIA e e
    # justamente a mais perigosa)
    variaveis_perigo = []
    for cl in sorted(todas):
        presentes = [frozenset(metodos(cat, t, cl)) for t, _ in tipos if metodos(cat, t, cl) is not None]
        if len(presentes) >= 2 and len(set(presentes)) > 1:
            variaveis_perigo.append(cl)
    if variaveis_perigo:
        P('⚠️ **Mesmo nome de classe, métodos diferentes** conforme o tipo: {}.'.format(
            ' · '.join('`%s`' % c for c in variaveis_perigo)))
        P('É aqui que se erra ao adaptar código — detalhe método a método abaixo.\n')

    # ---------- metodos das classes que variam ----------
    for cl in variaveis_perigo:
        P('### `{}` — método a método\n'.format(cl))
        todos_m = set()
        for t, _ in tipos:
            todos_m |= metodos(cat, t, cl) or set()
        linhas = []
        for m in sorted(todos_m, key=lambda m: (-sum(1 for t, _ in tipos if m in (metodos(cat, t, cl) or set())), m)):
            linhas.append((m, ['✅' if m in (metodos(cat, t, cl) or set()) else '—' for t, _ in tipos]))
        tabela(P, cl, linhas, tipos, 'Método')

    # ---------- variaveis ----------
    P('---\n')
    P('## Variáveis de contexto por tipo\n')
    todasv = set()
    for t, _ in tipos:
        todasv |= {v['name'] for v in cat[t].get('variables', [])}
    linhas = []
    for v in sorted(todasv, key=lambda v: (-sum(1 for t, _ in tipos if v in {x['name'] for x in cat[t].get('variables', [])}), v)):
        linhas.append((v, ['✅' if v in {x['name'] for x in cat[t].get('variables', [])} else '—' for t, _ in tipos]))
    tabela(P, 'Variáveis', linhas, tipos, 'Variável')

    # ---------- exclusivos ----------
    P('---\n')
    P('## Exclusivos de um único tipo\n')
    P('O que existe em **apenas um** tipo — o que mais engana quem adapta código.\n')
    for t, r in tipos:
        soh_aqui = []
        for cl in cat[t].get('classes', []):
            outros = [x for x, _ in tipos if x != t]
            if all(metodos(cat, o, cl['name']) is None for o in outros):
                soh_aqui.append('classe `%s`' % cl['name'])
        for v in cat[t].get('variables', []):
            outros = [x for x, _ in tipos if x != t]
            if all(v['name'] not in {y['name'] for y in cat[o].get('variables', [])} for o in outros):
                soh_aqui.append('`%s`' % v['name'])
        if soh_aqui:
            P('**`{}`** — {}\n'.format(t, ' · '.join(soh_aqui)))

    if faltando:
        P('---\n')
        P('## Ainda não capturados\n')
        for t in faltando:
            P('- `{}`'.format(t))
        P('')
    P('Também faltam: `GERACAO_CREDITO_PARCELAMENTOS`,')
    P('`GERACAO_CREDITO_CONTRIBUICAO_MELHORIAS`, `DESCONTO_PARCELAMENTO_*`,')
    P('`GERACAO_CREDITO_NOTA_FISCAL_AVULSA`, `ACRESCIMO_PARCELAMENTO`,')
    P('`ACRESCIMO_PRE_FIXADA`, `ITBI_VALOR_VENAL_*`.')
    P('Como capturar: `README.md`.')

    destino = os.path.join(AQUI, '_COMPARATIVO por tipo.md')
    with io.open(destino, 'w', encoding='utf8') as f:
        f.write('\n'.join(out))
    print('gerado: {}'.format(destino))
    print('  {} tipos comparados'.format(len(tipos)))


if __name__ == '__main__':
    main()
