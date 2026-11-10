#!/usr/bin/env node
// Conferência da Fase 1 (docs/plans/2026-11-09-fase1-economia-contexto.md).
// Garante que nada do CLAUDE.md antigo se perdeu ao dividir em CLAUDE.md por pasta,
// docs/<módulo>.md e skills registradas. Uso: node scripts/conferir-contexto.js
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const RAIZ = path.resolve(__dirname, '..');
const ARQUIVADO = path.join(RAIZ, 'docs/plans/arquivo/CLAUDE-2026-11-09.md');
const EXCECOES = path.join(__dirname, 'conferir-contexto.excecoes.json');
const MEMORIA = path.join(os.homedir(), '.claude/projects/c--Users-Felipe-Desktop-Trabalho-Krakion/memory/MEMORY.md');
const IGNORAR = new Set(['node_modules', '.git', 'dist', 'build', 'Formulas', 'Scripts', 'Relatorios', 'Municipios', '_RASCUNHOS-TESTES', 'raw', 'ArquivosTemporarios']);

function andar(dir, fn) {
  let itens;
  try { itens = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const it of itens) {
    if (IGNORAR.has(it.name)) continue;
    const p = path.join(dir, it.name);
    if (it.isDirectory()) andar(p, fn); else fn(p);
  }
}

// ---------- destinos ----------
const destinos = [];
andar(RAIZ, p => {
  const rel = path.relative(RAIZ, p).split(path.sep).join('/');
  const nome = path.basename(p);
  // --sem-raiz: ignora o CLAUDE.md da raiz e mostra o que ainda só existe nele
  const ehClaude = nome === 'CLAUDE.md' && !(process.argv.includes('--sem-raiz') && rel === 'CLAUDE.md');
  const ehDoc = rel.startsWith('docs/') && rel.endsWith('.md') && !rel.startsWith('docs/plans/');
  const ehSkill = (rel.startsWith('.claude/skills/') && nome === 'SKILL.md') || (rel.startsWith('skills/') && rel.endsWith('.md'));
  if (ehClaude || ehDoc || ehSkill) destinos.push({ rel, texto: fs.readFileSync(p, 'utf8') });
});
const tudo = destinos.map(d => d.texto).join('\n');
const linhasDestino = tudo.split(/\r?\n/);

// arquivos existentes no repositório (para a árvore)
const existentes = new Set();
andar(RAIZ, p => existentes.add(path.basename(p)));

// ---------- itens do CLAUDE.md antigo ----------
const antigo = fs.readFileSync(ARQUIVADO, 'utf8');
const secoes = {}; let atual = '';
for (const l of antigo.split(/\r?\n/)) {
  const m = l.match(/^## (.+)$/);
  if (m) { atual = m[1].trim(); secoes[atual] = []; continue; }
  if (atual) secoes[atual].push(l);
}
const secao = prefixo => Object.keys(secoes).filter(k => k.startsWith(prefixo)).flatMap(k => secoes[k]);

const itens = [];
// rotas
for (const l of secao('Rotas da API')) {
  const m = l.match(/^\|\s*([A-Z][A-Z/]+)\s*\|\s*(\/api\/\S+)\s*\|/);
  if (m) itens.push({ tipo: 'rota', id: m[1] + ' ' + m[2], metodo: m[1], caminho: m[2] });
}
// padrões, segurança, identidade visual
for (const nomeSecao of ['Segurança', 'Padrões importantes', 'Identidade Visual']) {
  for (const l of secao(nomeSecao)) {
    const m = l.match(/^- \*\*(.+?)\*\*/);
    if (m) itens.push({ tipo: 'regra', id: m[1] });
  }
}
// seções de UI do Sandbox
for (const nomeSecao of ['UI — Sandbox', 'Sandbox — aba Envio em Lote']) {
  for (const l of secao(nomeSecao)) {
    const m = l.match(/^### (.+)$/);
    if (m) itens.push({ tipo: 'secao', id: m[1].trim() });
  }
}
// arquivos da árvore
const vistos = new Set();
for (const l of secao('Estrutura do projeto')) {
  const re = /([\w.\-]+\.(?:jsx?|cjs|md|json|prisma|bat|ya?ml|db|webp|png|css|py|jrxml))\b/g; let m;
  while ((m = re.exec(l))) { if (!vistos.has(m[1])) { vistos.add(m[1]); itens.push({ tipo: 'arquivo', id: m[1] }); } }
}

// ---------- conferência ----------
let excecoes = {};
try { excecoes = JSON.parse(fs.readFileSync(EXCECOES, 'utf8')); } catch { /* sem exceções */ }

function achou(it) {
  if (it.tipo === 'rota') {
    return linhasDestino.some(l => l.includes(it.caminho) && new RegExp('\\|\\s*' + it.metodo.replace(/\//g, '\\/') + '\\s*\\|').test(l));
  }
  if (it.tipo === 'arquivo') {
    // skills/<nome>.md virou .claude/skills/<nome>/SKILL.md na Fase 1
    const skill = path.join(RAIZ, '.claude/skills', it.id.replace(/\.md$/, ''), 'SKILL.md');
    return existentes.has(it.id) || tudo.includes(it.id) || (it.id.endsWith('.md') && fs.existsSync(skill));
  }
  return tudo.includes(it.id);
}

const faltando = [];
const porTipo = {};
for (const it of itens) {
  porTipo[it.tipo] = (porTipo[it.tipo] || 0) + 1;
  if (excecoes[it.tipo + ':' + it.id]) continue;
  if (!achou(it)) faltando.push(it);
}

// ---------- tamanho do que é carregado numa conversa nova na raiz ----------
const tam = p => { try { return fs.statSync(p).size; } catch { return 0; } };
const bRaiz = tam(path.join(RAIZ, 'CLAUDE.md')), bMem = tam(MEMORIA);
const tok = b => Math.round(b / 4).toLocaleString('pt-BR');

console.log('Itens conferidos:', Object.entries(porTipo).map(([k, v]) => v + ' ' + k).join(', '));
console.log('Exceções registradas:', Object.keys(excecoes).length);
console.log('Destinos lidos:', destinos.length);
console.log(`Carregado na raiz: CLAUDE.md ${bRaiz} B (~${tok(bRaiz)} tokens) + MEMORY.md ${bMem} B (~${tok(bMem)} tokens) = ~${tok(bRaiz + bMem)} tokens`);
for (const sub of ['backend', 'frontend', 'desktop', 'biblioteca']) {
  const b = tam(path.join(RAIZ, sub, 'CLAUDE.md'));
  if (b) console.log(`  ${sub}/CLAUDE.md ${b} B (~${tok(b)} tokens, só quando se trabalha ali)`);
}
if (faltando.length) {
  console.log(`\n${faltando.length} itens sem destino:`);
  for (const f of faltando) console.log(`  [${f.tipo}] ${f.id}`);
  process.exit(1);
}
console.log('\n0 itens sem destino');
