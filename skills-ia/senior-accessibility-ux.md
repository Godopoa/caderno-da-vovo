---
name: senior-accessibility-ux
description: Diretrizes rigorosas de UI/UX, acessibilidade WCAG AAA, síntese de voz (TTS) e navegação simplificada para idosos (terceira idade) em aplicações Web e Mobile.
---

# Skill: Acessibilidade e UX/UI para Idosos (Senior-First Design)

Use esta skill sempre que criar ou modificar componentes visuais, telas, fluxos de navegação ou interações no projeto **Caderno da Vovó**.

## 1. Regras Visuais e Tipográficas (WCAG AAA)
- **Tamanho de Fonte Base:** Nunca utilize texto menor que `18px` (`1.125rem`). O corpo padrão deve ser `20px`–`22px`, listas de ingredientes `22px`–`24px`, e passos do Modo Cozinha `28px`–`36px`.
- **Escala Dinâmica (`fontScale`):** Toda a interface deve respeitar um multiplicador global (`1x`, `1.25x`, `1.5x`) controlado pelos botões **`A-`** e **`A+`** no topo da tela.
- **Contraste Elevado e Conforto Ocular:**
  - Evite branco puro estourado (`#FFFFFF`) em grandes áreas; prefira **Creme Papel** (`#FFFDF9` ou `#FAF6F0`).
  - Texto principal em **Carvão Escuro** (`#1C1917`), garantindo razão de contraste $> 12:1$.
- **Zero Poluição Visual:**
  - Máximo de **2 a 3 colunas** no Desktop PC e **1 coluna** no Celular.
  - Proibido usar carrosséis automáticos, popups surpresa ou gestos complexos.

## 2. Alvos de Toque e Botões (Motor & Touch)
- **Altura Mínima:** Todo botão interativo deve ter no mínimo **`60px` a `72px` de altura** (`min-h-[64px]`) e espaçamento mínimo de `16px` entre botões vizinhos.
- **Ícone + Texto Explícito:** Nunca crie botões apenas com ícone. Exemplo correto: `[ 🔊 Ouvir Receita ]`, `[ ❤️ Salvar nas Favoritas ]`, `[ ⬅️ Voltar para o Início ]`.
- **Checkboxes Gigantes nos Ingredientes:** Cada ingrediente deve ter uma caixa de marcação de pelo menos `32px x 32px` onde clicar na linha inteira marca/desmarca o item.

## 3. Modo Cozinha Passo a Passo e Voz (Text-to-Speech)
- **Foco Único:** Exiba apenas **1 passo por vez** no Modo Cozinha, com indicador claro: `"Passo 2 de 6"`.
- **Síntese de Voz (`pt-BR`):**
  - Utilize `window.speechSynthesis` no navegador/PC e `@capacitor-community/text-to-speech` no mobile quando disponível.
  - Configure `lang = 'pt-BR'`, `rate = 0.88` (fala pausada e articulada) e `pitch = 1.0`.
- **Temporizadores Integrados:**
  - Quando um passo possuir `timerSeconds > 0`, renderize um botão gigante de destaque para iniciar a contagem regressiva com números grandes (`48px+`) e alerta sonoro via Web Audio API ao terminar.
