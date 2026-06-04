# Tratamento de Imagens — Guia do Projeto

Guia completo para receber uma imagem nova e prepará-la para uso no Krakion: redução de tamanho, conversão para WebP e tratamento de fundo.

**Ferramenta:** Python + Pillow (`pip install Pillow`)
**Destino dos arquivos finais:** `frontend/public/`
**Formato de saída padrão:** WebP

---

## 1. Diagnóstico inicial

Antes de qualquer coisa, inspecione a imagem recebida:

```python
from PIL import Image
import os

src = r"caminho/para/imagem.png"
img = Image.open(src)
print(f"Modo: {img.mode}")          # RGB, RGBA, P...
print(f"Tamanho: {img.size}")       # (largura, altura)
print(f"Tamanho: {os.path.getsize(src)/1024:.1f} KB")

# Amostrar pixels nos 4 cantos para entender o fundo
w, h = img.size
for pos in [(0,0), (w-1,0), (0,h-1), (w-1,h-1)]:
    print(f"  canto {pos}: {img.getpixel(pos)}")
```

**O que observar:**

| Situação | O que fazer |
|---|---|
| Modo `RGB`, fundo branco/colorido uniforme | Converter direto para WebP (passo 3) |
| Modo `RGBA`, cantos com `alpha=0` | Fundo transparente real → compor sobre a cor alvo (passo 2A) |
| Modo `RGBA`, cantos com `alpha=255` e pixels cinzas (~68–100) | Fundo xadrez opaco baked-in → remover por similaridade de cor (passo 2B) |
| Imagem muito grande (>500 KB ou >1500px) | Redimensionar antes de salvar (passo 3) |

---

## 2A. Fundo transparente real (alpha=0 nos cantos)

O PNG tem canal alpha verdadeiro. Basta compor sobre a cor de fundo desejada:

```python
from PIL import Image

img = Image.open("imagem.png").convert("RGBA")

# Escolher a cor de fundo (ex: bg-gray-900 = #111827)
bg_color = (17, 24, 39)

bg = Image.new("RGB", img.size, bg_color)
bg.paste(img, mask=img.split()[3])   # split()[3] = canal alpha

bg.save("saida.webp", "WEBP", quality=92, method=6)
```

> **Verificação:** `bg.getpixel((0,0))` deve retornar exatamente `bg_color`.

---

## 2B. Fundo xadrez opaco baked-in (o caso do KrakioSuporte)

O PNG parece transparente no editor, mas os pixels de fundo têm `alpha=255` com valores cinzas (~68–100). Isso acontece quando a imagem é exportada do editor sem transparência real — o padrão xadrez vira conteúdo da imagem.

**Sintoma:** `img.getpixel((0,0))` retorna algo como `(68, 68, 68, 255)` em vez de `(0, 0, 0, 0)`.

**Solução — remoção por similaridade de cor (pixel a pixel):**

```python
from PIL import Image
import numpy as np

img = Image.open("imagem.png").convert("RGBA")
data = np.array(img, dtype=np.int32)
r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

# Detecta pixels de fundo:
# - quase cinza (R≈G≈B, diferença ≤ 10)
# - valor no range do xadrez (40–120)
# Seguro porque:
#   brancos do texto (R>150) ficam fora do range
#   cores saturadas como roxo (|R-G| > 15) não passam no is_gray
is_gray = (np.abs(r-g)<=10) & (np.abs(r-b)<=10) & (np.abs(g-b)<=10)
in_bg   = (r>=40) & (r<=120)
mask    = is_gray & in_bg

new_a = np.where(mask, 0, a).astype(np.uint8)
clean = Image.fromarray(
    np.stack([r.astype(np.uint8), g.astype(np.uint8),
              b.astype(np.uint8), new_a], axis=2), "RGBA"
)

# Compor sobre a cor de fundo desejada
bg = Image.new("RGB", clean.size, (17, 24, 39))  # bg-gray-900
bg.paste(clean, mask=clean.split()[3])
```

> **Verificação obrigatória:**
> ```python
> print(bg.getpixel((0, 0)))   # deve ser (17, 24, 39)
> # Se o logo tem cor saturada (roxo, azul, etc.), amostrar essa área:
> # clean.getpixel((x_logo, y_logo))[3] deve ser 255
> ```

**Ajuste do range se ainda sobrar fundo:**
- Ampliar `in_bg` para `(r>=35) & (r<=130)`
- Ampliar `is_gray` para tolerância 12
- Verificar novamente pixel por pixel nas regiões problemáticas

**Atenção — NÃO usar flood fill** para este caso. O padrão xadrez tem quadrados alternados que bloqueiam a conectividade entre pixels similares e o flood fill não alcança todas as regiões.

---

## 3. Redimensionar e salvar como WebP

Após qualquer tratamento de fundo, redimensionar para a largura adequada ao uso e salvar:

```python
import os

# Largura alvo por uso
# - Logo sidebar (w-56 = 224px, px-3 = ~198px disponíveis): 600px suficiente
# - Logo login (w-64 = 256px): 500px suficiente
# - Ícones / avatares: 256px ou menos

new_w = 600
new_h = int(img.height * (new_w / img.width))
img_final = img.resize((new_w, new_h), Image.LANCZOS)

img_final.save("frontend/public/nome.webp", "WEBP", quality=92, method=6)

orig = os.path.getsize("imagem.png")
conv = os.path.getsize("frontend/public/nome.webp")
print(f"PNG: {orig/1024:.1f} KB → WebP: {conv/1024:.1f} KB ({(1-conv/orig)*100:.1f}% menor)")
```

**Parâmetros WebP:**

| Parâmetro | Valor | Quando usar |
|---|---|---|
| `quality=92, method=6` | Padrão | Logos, imagens com gradiente |
| `lossless=True` | Lossless | Quando **não** há tratamento de fundo — pode ter artefatos no alpha com lossy |

> **Atenção:** `lossless=True` NÃO resolve fundo xadrez opaco. Para o xadrez, usar o passo 2B antes.

---

## 4. Referências de cor de fundo por contexto

| Contexto no Krakion | Cor de fundo | Hex | RGB |
|---|---|---|---|
| Sidebar (`bg-gray-900`) | Cinza escuro | `#111827` | `(17, 24, 39)` |
| Login (gradiente claro) | Branco | `#FFFFFF` | `(255, 255, 255)` |
| Cards / modais (`bg-white`) | Branco | `#FFFFFF` | `(255, 255, 255)` |
| Header (`bg-gray-800`) | Cinza médio | `#1f2937` | `(31, 41, 55)` |

> **Nota:** Texto branco na imagem (`R > 150`) desaparece sobre fundo branco. Usar fundo escuro nesses casos.

---

## 5. Checklist completo

```
[ ] 1. Inspecionar: modo, tamanho, pixels dos 4 cantos
[ ] 2. Escolher abordagem de fundo (2A transparente real OU 2B xadrez opaco)
[ ] 3. Verificar pixels: canto deve ser a cor alvo; logo deve ter alpha=255
[ ] 4. Redimensionar para largura adequada ao uso
[ ] 5. Salvar como WebP em frontend/public/
[ ] 6. Conferir tamanho final (meta: <50 KB para logos)
[ ] 7. Atualizar o src no componente React
[ ] 8. Remover arquivo PNG fonte de frontend/public/ (manter só WebP)
[ ] 9. Commitar apenas o WebP (PNG fonte pode ficar na raiz do projeto se quiser guardar)
```

---

## 6. Script completo reutilizável

```python
"""
Uso: ajustar as variáveis no topo e executar com `python tratar_imagem.py`
"""
from PIL import Image
import numpy as np, os

# ─── CONFIGURAÇÃO ───────────────────────────────────────────────────────────
SRC      = r"caminho/para/imagem_fonte.png"
DST      = r"frontend/public/nome_saida.webp"
LARGURA  = 600                     # px — ajustar conforme uso
BG_COLOR = (17, 24, 39)           # bg-gray-900; trocar para (255,255,255) se fundo claro
MODO_FUNDO = "xadrez"              # "xadrez" | "transparente" | "nenhum"
# ────────────────────────────────────────────────────────────────────────────

img = Image.open(SRC).convert("RGBA")
print(f"Original: {img.size[0]}x{img.size[1]}, {os.path.getsize(SRC)/1024:.1f} KB")
print(f"Canto (0,0): {img.getpixel((0,0))}")

if MODO_FUNDO == "xadrez":
    data = np.array(img, dtype=np.int32)
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    is_gray = (np.abs(r-g)<=10) & (np.abs(r-b)<=10) & (np.abs(g-b)<=10)
    in_bg   = (r>=40) & (r<=120)
    new_a   = np.where(is_gray & in_bg, 0, a).astype(np.uint8)
    img     = Image.fromarray(np.stack([r.astype(np.uint8), g.astype(np.uint8),
                                         b.astype(np.uint8), new_a], axis=2), "RGBA")
    print(f"Fundo xadrez removido. Canto apos remocao: {img.getpixel((0,0))}")

new_h = int(img.height * (LARGURA / img.width))
img   = img.resize((LARGURA, new_h), Image.LANCZOS)

bg = Image.new("RGB", img.size, BG_COLOR)
if MODO_FUNDO != "nenhum":
    bg.paste(img, mask=img.split()[3])
else:
    bg = img.convert("RGB")

bg.save(DST, "WEBP", quality=92, method=6)
print(f"Salvo: {DST}")
print(f"Tamanho final: {os.path.getsize(DST)/1024:.1f} KB")
print(f"Canto final: {bg.getpixel((0,0))}  esperado: {BG_COLOR}")
```
