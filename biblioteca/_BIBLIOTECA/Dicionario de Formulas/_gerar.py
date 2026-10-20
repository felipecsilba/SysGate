# -*- coding: utf-8 -*-
"""
Gera o dicionario de um tipo de formula a partir do catalogo capturado do editor.

    python _gerar.py <TIPO>

Le  : ../../_CONHECIMENTO/_bruto/formula-catalogo/<TIPO>.json
Grava: <TIPO> - contexto da formula.md

Cada metodo recebe a contagem de uso real em Formulas/ — "existe" e "e usado"
sao informacoes diferentes, e as duas ajudam.
"""
import json, os, re, sys, io, collections

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..'))
BRUTO = os.path.join(RAIZ, '_CONHECIMENTO', '_bruto', 'formula-catalogo')


# Tipo do catalogo -> tipo da formula como aparece no nome do arquivo do corpus.
# Contar no corpus INTEIRO da resultado errado: cada tipo de formula tem seu
# proprio conjunto de funcoes, e o mesmo nome pode nao existir no outro tipo.
# Ver _COMPARATIVO por tipo.md (caso da funcao de indexador).
MAPA_CORPUS = {
    'ITBI':                            'ITBI_TRANSFERENCIA_CREDITOS',
    'FORMULA_ACRESCIMO_DEBITO':        'FORMULA_ACRESCIMO_DEBITO',
    'FORMULA_ACRESCIMO_DIVIDA_ATIVA':  'FORMULA_ACRESCIMO_DIVIDA_ATIVA',
    'FORMULA_ACRESCIMO_PARCELAMENTO':  'FORMULA_ACRESCIMO_PARCELAMENTO',
    'GERACAO_CREDITO_IMOVEIS':         'GERACAO_CREDITO_IMOVEIS',
    'GERACAO_CREDITO_ECONOMICOS':      'GERACAO_CREDITO_ECONOMICOS',
    'GERACAO_CREDITO_RECEITAS_DIVERSAS': 'GERACAO_CREDITO_RECEITAS_DIVERSAS',
    'CONVENIO_BANCARIO':               'CONVENIO_BANCARIO',
    'DESCONTO_GUIA':                   'DESCONTO_GUIA',
    'CALCULO_PROJETOS_OBRAS':          None,   # sem equivalente em Formulas/
}


def carregar_corpus(tipo):
    """Le so as formulas do tipo correspondente. Devolve (texto, n_arquivos, escopo)."""
    alvo = MAPA_CORPUS.get(tipo, tipo)
    partes = []
    base = os.path.join(RAIZ, 'Formulas')
    for pasta, _, arquivos in os.walk(base):
        for a in arquivos:
            if not a.endswith('.txt'):
                continue
            if alvo and (' - %s - ' % alvo) not in a:
                continue
            with io.open(os.path.join(pasta, a), encoding='utf8', errors='replace') as f:
                partes.append(f.read())
    if alvo is None:
        escopo = 'nenhuma fórmula deste tipo existe em `Formulas/` — coluna Corpus não se aplica'
    elif not partes:
        escopo = 'nenhum arquivo `%s` encontrado em `Formulas/`' % alvo
    else:
        escopo = '%d fórmulas do tipo `%s`' % (len(partes), alvo)
    return '\n'.join(partes), len(partes), escopo


def contar(corpus, expr):
    return len(re.findall(r'(?<![A-Za-z0-9_.])' + re.escape(expr) + r'\b', corpus))


def limpar(txt):
    if not txt:
        return ''
    txt = re.sub(r'<[^>]+>', ' ', txt)
    return re.sub(r'\s+', ' ', txt).strip()


def linha_metodo(m, prefixo, corpus):
    info = m.get('info') or {}
    nome = info.get('name') or m.get('embeddedName') or m.get('name', '')
    params = [p.get('name', '?') for p in info.get('parameters') or []]
    # sem parametro = propriedade: escreve `imovel.codigo`, nao `imovel.codigo()`
    if params:
        assinatura = '`{}.{}({})`'.format(prefixo, nome, ', '.join(params))
    else:
        assinatura = '`{}.{}`'.format(prefixo, nome)
    retorno = (info.get('returnType') or '').split('.')[-1] or '—'
    desc = limpar(info.get('comment')) or limpar(m.get('description'))
    ret_c = limpar(info.get('returnComment'))
    if ret_c and ret_c.lower() not in desc.lower():
        desc = '{} → {}'.format(desc, ret_c)
    usos = contar(corpus, '{}.{}'.format(prefixo, nome))
    marca = '**0**' if usos == 0 else str(usos)
    return '| {} | `{}` | {} | {} |'.format(assinatura, retorno, marca, desc[:150])


def gerar(tipo):
    caminho = os.path.join(BRUTO, tipo + '.json')
    if not os.path.exists(caminho):
        sys.exit('nao encontrei {}\nveja como capturar em {}/LEIAME.md'.format(caminho, BRUTO))
    with io.open(caminho, encoding='utf8') as f:
        d = json.load(f)

    corpus, n_arquivos, escopo = carregar_corpus(tipo)
    out = []
    P = out.append

    P('# Contexto da fórmula — tipo `{}`\n'.format(tipo))
    P('> **Gerado por** `_BIBLIOTECA/Dicionario de Formulas/_gerar.py` a partir de')
    P('> `_CONHECIMENTO/_bruto/formula-catalogo/{}.json`, capturado do editor do'.format(tipo))
    P('> Tributos. **Não editar à mão** — recapture o JSON e rode o gerador.')
    P('>')
    P('> Coluna **Corpus** = ocorrências **dentro deste tipo de fórmula** — {}.'.format(escopo))
    P('> **`0` em negrito = existe no sistema e nunca foi usado neste tipo.**')
    P('>')
    P('> ⚠️ Nome de função **só vale dentro do tipo em que existe** — ver')
    P('> `_COMPARATIVO por tipo.md`. Não copie `Utilitarios.*` entre tipos sem conferir.\n')

    variaveis = d.get('variables', [])
    classes = d.get('classes', [])
    com_metodo = [v for v in variaveis if v.get('methods')]
    sem_metodo = [v for v in variaveis if not v.get('methods')]

    P('**{} variáveis de contexto · {} classes utilitárias**\n'.format(len(variaveis), len(classes)))
    P('---\n')
    P('## Variáveis de contexto\n')
    P('O que o motor injeta. Não declarar.\n')

    if sem_metodo:
        P('### Valores simples\n')
        P('| Variável | O que é |')
        P('|---|---|')
        for v in sem_metodo:
            usos = contar(corpus, v['name'])
            marca = ' *(0 usos)*' if usos == 0 else ''
            P('| `{}` | {}{} |'.format(v['name'], limpar(v.get('description')), marca))
        P('')

    for v in com_metodo:
        P('### `{}`\n'.format(v['name']))
        P('*{}*\n'.format(limpar(v.get('description'))))
        P('| Método | Retorna | Corpus | O que é |')
        P('|---|---|---:|---|')
        linhas = [linha_metodo(m, v['name'], corpus) for m in v['methods']]
        linhas.sort(key=lambda l: -int(re.search(r'\| (?:\*\*)?(\d+)', l).group(1)))
        out.extend(linhas)
        P('')

    P('---\n')
    P('## Classes utilitárias\n')
    for c in classes:
        P('### `{}`\n'.format(c['name']))
        P('*{}*\n'.format(limpar(c.get('description'))))
        P('| Método | Retorna | Corpus | O que é |')
        P('|---|---|---:|---|')
        linhas = [linha_metodo(m, c['name'], corpus) for m in c.get('methods', [])]
        linhas.sort(key=lambda l: -int(re.search(r'\| (?:\*\*)?(\d+)', l).group(1)))
        out.extend(linhas)
        P('')

    scaffolds = d.get('scaffolds') or []
    if scaffolds:
        P('---\n')
        P('## Snippets do editor\n')
        P('Modelos que o próprio editor oferece — mostram sintaxe **aceita** neste tipo.\n')
        for s in scaffolds:
            P('**{}** (`{}`)\n'.format(limpar(s.get('description')), s.get('name')))
            P('```groovy')
            P(s.get('script', ''))
            P('```\n')

    destino = os.path.join(AQUI, '{} - contexto da formula.md'.format(tipo))
    with io.open(destino, 'w', encoding='utf8') as f:
        f.write('\n'.join(out))

    zeros = sum(1 for l in out if '| **0** |' in l)
    print('gerado: {}'.format(destino))
    print('  {} variaveis, {} classes'.format(len(variaveis), len(classes)))
    print('  {} metodos com ZERO uso no corpus'.format(zeros))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        disponiveis = [f[:-5] for f in os.listdir(BRUTO) if f.endswith('.json')]
        sys.exit('uso: python _gerar.py <TIPO>\ndisponiveis: {}'.format(', '.join(disponiveis) or '(nenhum)'))
    gerar(sys.argv[1])
