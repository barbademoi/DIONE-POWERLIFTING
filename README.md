# Dione Powerlifting — App (PWA)

App de treino de powerlifting (**36 semanas**) que calcula a carga de cada exercício
a partir do **1RM** do aluno. Site estático (HTML/CSS/JS), sem framework e sem build,
com **Service Worker** (offline) e **Manifest** (instalável). Dados salvos no
navegador (`localStorage`, prefixo `dione_demo_`).

## Arquivos
- `index.html` — o app inteiro (UI, lógica e dados das 36 semanas embutidos)
- `manifest.webmanifest` — nome, ícone e modo standalone
- `sw.js` — service worker (cache offline). **Suba a versão do cache a cada mudança** (`CACHE='dione-pl-vN'`)
- `icon-192.png` / `icon-512.png` / `apple-touch-icon.png` — ícones do app
- `vercel.json` — deploy estático + headers do PWA

## Como funciona (resumo técnico)
- **Cálculo de carga:** `loadFor(1RM, %, arredondamento)` (arredonda para múltiplos de 2,5 kg).
- **Estimativa de 1RM:** Epley → `1RM = peso × (1 + reps/30)`.
- **Programa:** gerado em `genPrograma()` — 4 blocos (Acumulação, Intensificação, Peaking, Taper/Teste),
  3 dias por semana, com deload a cada 4 semanas e teste de PR na semana 36.
- **Views:** `loginView`, `onboardView`, `treinoView`, `tecView`, `dioneView`, `perfilView`.

## Publicar na Vercel (uma vez)
1. vercel.com → **Add New… → Project** → Import do repositório `DIONE-POWERLIFTING`.
2. **Framework Preset: Other** (não é Next.js). Sem build. Output: raiz.
3. Deploy. A partir daí, **todo `git push` publica sozinho**.

## Ciclo de alteração
```bash
# faça as mudanças, então:
git add .
git commit -m "descreva a mudança"
git push
```

## ⚠️ Cache do PWA
Sempre que mudar o `index.html`, abra o `sw.js` e **incremente** a versão:
`const CACHE='dione-pl-v2';` (depois v3, v4...). Isso força os celulares a baixarem a versão nova.
