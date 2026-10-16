---
name: tudogostoso-importer
description: Especialista em extração, parsing, normalização para voz e importação estruturada de receitas do portal TudoGostoso (tudogostoso.com.br) para Node.js e Prisma.
---

# Skill: Importer e Parser TudoGostoso (`tudogostoso.com.br`)

Use esta skill ao construir ou manter o módulo de importação, scraping, atualização e normalização de receitas vindas do **TudoGostoso**.

## 1. Estratégia Dupla de Extração (JSON-LD + Cheerio Fallback)
1. **Camada 1 — Extração JSON-LD (`schema.org/Recipe`):**
   - Busque todas as tags `<script type="application/ld+json">` da página.
   - Localize o objeto onde `@type === 'Recipe'` (ou dentro de `@graph`).
   - Extraia: `name`, `image`, `totalTime` (ISO 8601 ex: `PT45M`), `recipeYield`, `recipeCategory`, `recipeIngredient` e `recipeInstructions`.
2. **Camada 2 — Fallback DOM com Cheerio:**
   - Caso campos estejam ausentes no JSON-LD, utilize seletores HTML de fallback para título (`h1`), ingredientes (`[class*="ingredient"] li`) e modo de preparo (`[class*="instruction"] li, .e-instructions p`).

## 2. Normalização para Leitura de Idosos e Síntese de Voz (TTS)
Antes de salvar ingredientes e passos no banco de dados, passe o texto por um normalizador culinário:
- `col. (sopa)` / `c. sopa` -> `colher de sopa`
- `col. (chá)` / `c. chá` -> `colher de chá`
- `xíc. (chá)` / `xic.` -> `xícara de chá`
- `q.b.` -> `a gosto`

## 3. Detecção Automática de Temporizadores (`timerSeconds`)
Para cada passo do modo de preparo, aplique Regex para detectar tempos de cozimento/forno/descanso:
- Padrões: `/(\d+)\s*(?:a\s*\d+\s*)?(minutos?|min|horas?|h)\b/i`
- Salve em segundos no campo `timerSeconds` do model `Step`.
