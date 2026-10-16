# 🚀 Prompts Prontos para o Gemini Argon — Projeto "Caderno da Vovó"

Você tem abaixo **3 versões do prompt** prontas para copiar e colar no **Gemini Argon**:
1. **Prompt Master Ultra-Completo (Recomendado — já referencia a pasta `CadernoDaVovo` e as Skills `.md` criadas)**
2. **Exemplo 1 Refinado (Curto e Direto ao Ponto em Português)**
3. **Exemplo 2 Refinado (English / Full Architectural Blueprint)**

---

## ⭐ Prompt Master (Recomendado — Conecta com a pasta e as Skills `.md` que já baixamos)

```markdown
Atue como um Arquiteto de Software Principal Full-Stack e Especialista em UX/UI para Acessibilidade Sênior (Terceira Idade).

Estamos desenvolvendo o projeto "Caderno da Vovó" na pasta `C:\Users\dfuto\OneDrive\Documentos\CadernoDaVovo`.
Leia e siga rigorosamente as skills de IA localizadas em `skills-ia/` (e `.agent/skills/`): `senior-accessibility-ux`, `tudogostoso-importer`, `fullstack-vite-capacitor`, `prisma-database-recipes` e o arquivo `PLANO_COMPLETO.md`.

Construa a implementação completa e funcional (Backend + Frontend Web PC + Painel Importer + Configuração Mobile Capacitor) seguindo estas especificações:

1. BACKEND (Node.js + Fastify + TypeScript + Prisma + SQLite):
   - Utilize o `backend/prisma/schema.prisma` com os models `Recipe`, `Ingredient` e `Step` (incluindo `timerSeconds` detectado automaticamente).
   - Utilize e expanda o serviço `tudogostosoImporter.ts` que recebe uma URL (ou lista de URLs) de `https://www.tudogostoso.com.br/`, extrai os dados via JSON-LD (`schema.org/Recipe`) com fallback em Cheerio, converte abreviações culinárias ("col. sopa" -> "colher de sopa") para leitura natural por voz, detecta tempos nos passos ("por 30 minutos" -> `timerSeconds: 1800`) e salva no banco.
   - Configure o Fastify escutando em `0.0.0.0:3333` com CORS liberado para o PC e o app Capacitor no celular.
   - Exponha endpoints REST:
     - `GET /api/recipes` (busca por nome, ingrediente da geladeira, categoria e favoritos)
     - `GET /api/recipes/:id`
     - `POST /api/recipes/:id/favorite`
     - `POST /api/import/url` (importa receita do TudoGostoso por URL)
     - `POST /api/import/batch` (importa várias URLs do TudoGostoso em lote)
   - Inclua um seed inicial com receitas clássicas da vovó já cadastradas.

2. FRONTEND E PAINEL (Vite + React + TypeScript + Tailwind CSS + Lucide React):
   - Interface com foco absoluto em IDOSOS (WCAG AAA):
     - Paleta acolhedora de alto contraste (Fundo Creme `#FFFDF9`, Texto `#1C1917`, Botões Verdes `#15803D` e Terracota `#C2410C`).
     - Barra superior fixa com controle de fonte gigante (`A-` / `A+`), botão "Minhas Favoritas" e botão "Painel de Importação TudoGostoso".
     - Lista de ingredientes com checkboxes gigantes (clique na linha inteira).
   - MODO COZINHA PASSO A PASSO (Tela Cheia + WakeLock):
     - Exibe um passo por vez em fonte gigante (28px–36px).
     - Integração com Web Speech API (`window.speechSynthesis` em `pt-BR`, velocidade `0.88`) para ler ingredientes e passos em voz alta.
     - 3 botões gigantes no rodapé (mínimo 64px de altura): "⬅️ Passo Anterior", "🔊 Ouvir Passo", "Próximo Passo ➡️".
     - Se o passo tiver `timerSeconds`, exibir um botão gigante "⏰ Ligar Relógio de X Minutos" com contagem regressiva e alarme sonoro.
   - PAINEL ADMIN / IMPORTER TUDOGOSTOSO:
     - Tela onde posso colar 1 ou várias URLs do TudoGostoso.com.br, clicar em "Importar Receitas Agora" e ver as receitas salvas instantaneamente, além de mostrar o IP local do PC para conectar o celular.

3. MOBILE & PC (Capacitor + PWA Offline-First):
   - Configure `capacitor.config.ts` e o cache local (`localStorage`) para que o app funcione no PC e possa ser compilado para Android/iOS consumindo a mesma API e mantendo as receitas favoritas disponíveis offline.
```

---

## Exemplo 1: Curto e Direto ao Ponto (Português)

```markdown
Atue como Arquiteto de Software Full-Stack Sênior.

Desenvolva um plano completo de arquitetura e código inicial funcional na pasta `C:\Users\dfuto\OneDrive\Documentos\CadernoDaVovo` para uma plataforma de receitas multiplataforma (Web Desktop + Web/PWA Mobile ou Capacitor para celular):

1. Stack Técnica:
   - Backend: Node.js (Fastify ou Express) + TypeScript, SQLite ou PostgreSQL via Prisma, com endpoints REST/JSON escutando na rede (`0.0.0.0:3333`).
   - Frontend / App: Vite + React + Tailwind CSS, estruturado para build Web no PC e empacotamento Mobile (PWA/Capacitor) conectado à mesma API.

2. Acessibilidade para Idosos (Foco UX/UI):
   - Fontes grandes e legíveis com botão de ajuste (A- / A+), botões táteis amplos (mínimo 60px), alto contraste acolhedor, sem poluição visual.
   - Modo de leitura passo a passo ("Modo Cozinha") com botões gigantes ("⬅️ Passo Anterior", "🔊 Repetir Áudio/Leitura", "Próximo Passo ➡️"), temporizador integrado automático e opção de Text-to-Speech (leitura em voz alta em pt-BR).

3. Módulo Importer / Scraper (Parceria TudoGostoso):
   - Endpoint e serviço em Node.js (usando JSON-LD + Cheerio) para importar receitas por URL ou em lote do `tudogostoso.com.br`.
   - Parser de título, foto, tempo de preparo, rendimento, ingredientes (normalizados para leitura em voz alta) e modo de preparo estruturados em banco.

4. Entregáveis:
   - Estrutura completa de pastas do projeto.
   - Schema do banco de dados (`schema.prisma`).
   - Script funcional do importer/parser + painel visual de importação.
   - Setup de build para Web PC e Mobile (Capacitor/Vite).
```

---

## Exemplo 2: Traduzido (English / Full Prompt)

```markdown
Act as a Principal Full-Stack Software Architect and UI/UX Designer.

Create an end-to-end technical blueprint and starter implementation inside `C:\Users\dfuto\OneDrive\Documentos\CadernoDaVovo` for a cross-platform recipe management application running simultaneously on PC (Web) and Mobile (packaged via Capacitor / PWA):

1. Technology Stack:
   - Backend: Node.js (Fastify or Express) with TypeScript and Prisma ORM (SQLite / PostgreSQL), accessible across LAN and Cloud.
   - Frontend: Vite + React + Tailwind CSS, optimized for desktop layouts and packaged for mobile devices with offline local caching.

2. Senior-Friendly UI/UX (Elderly Accessibility):
   - High-contrast warm visual palette (`#FFFDF9` background, `#1C1917` text), minimal cognitive load, oversized buttons (minimum 60px touch targets), large scalable fonts (`A-` / `A+`).
   - Dedicated "Cooking Mode": clear step-by-step navigation, auto-detected integrated timers with audio alarm, and Web Speech API / TTS (`pt-BR` Text-to-Speech) for hands-free reading.

3. TudoGostoso Importer Module:
   - Automated extraction service parsing public recipe URLs from `tudogostoso.com.br` using JSON-LD (`schema.org/Recipe`) and Cheerio/Axios fallback.
   - Structured data mapping for: title, image, prep time, servings, voice-normalized ingredient list, and ordered preparation steps with regex timer detection.

4. Deliverables:
   - Project directory tree and configuration files.
   - Database schema design (Prisma).
   - Functional importer service with error handling and Admin UI panel.
   - Build and deployment workflow for both Desktop Web and Mobile targets.
```
