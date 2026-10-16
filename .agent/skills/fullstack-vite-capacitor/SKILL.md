---
name: fullstack-vite-capacitor
description: Arquitetura Full-Stack multiplataforma (PC Web + App Mobile Android/iOS via Capacitor + API Node.js Fastify/Prisma) com sincronização em rede local e cache offline.
---

# Skill: Arquitetura Full-Stack Node.js + Vite + Capacitor (PC & Mobile)

## 1. Conectividade Híbrida (PC + Celular na Mesma API)
- **Servidor Backend (`Fastify`):** Deve sempre escutar em `host: '0.0.0.0'` (porta `3333`) com `@fastify/cors` (`origin: true`) para que tanto o navegador do PC quanto o celular Android/iOS na rede Wi-Fi ou nuvem acessem a API.
- **Cliente de API Inteligente (`src/api/client.ts`):** Permite configurar o IP do servidor e faz cache automático das receitas abertas.

## 2. Modo Offline-First para Receitas Salvas
- Sempre que uma receita for visualizada ou marcada como **Favorita (`❤️`)**, salve uma cópia completa no `localStorage`/`IndexedDB` do aparelho.

## 3. Empacotamento Mobile com Capacitor
- Configure `capacitor.config.ts` com `appId: 'com.cadernodavovo.receitas'`, `appName: 'Caderno da Vovó'`, `webDir: 'dist'` e `server: { cleartext: true }`.
- Mantenha a tela acesa durante o Modo Cozinha com `navigator.wakeLock.request('screen')`.
