# Plano Master v5.0 — Portal "Caderno da Vovó" (Receitas, Utilidades do Lar, Saúde, Renda Extra & Nuvem Permanente)

> **Repositório Oficial**: `https://github.com/Godopoa/caderno-da-vovo`  
> **Público-Alvo Principal**: Donas de casa, vovós, idosas e famílias brasileiras que buscam culinária afetiva, economia doméstica, saúde natural, organização da rotina e memória familiar.  
> **Filosofia de Acesso (v5.0)**: **"Funciona 100% Sem Login, Mas É Muito Melhor Com Login"** — Uso imediato sem barreiras + Sincronização Permanente na Nuvem (`UserCloudData`) ao criar uma conta gratuita ou VIP.

---

## 1. Arquitetura Híbrida v5.0: Sem Login (Local) vs. Com Login (Nuvem Permanente)

Para não criar barreiras para idosas ou visitantes de primeira viagem, mas garantir retenção máxima e segurança dos dados pessoais (especialmente **horários de remédios** e **cardápio/feira da família**), o sistema opera em **2 camadas sincronizadas**:

- **Sem Login (Modo Visitante no Aparelho)**:
  - Todas as ferramentas funcionam imediatamente (`localStorage`): Caixinha de Remédios com Voz, Hidratômetro (8 copos d'água), Cardápio Semanal, Lista de Feira, Calculadora Faça e Venda, Livro de Receitas da Família em PDF e Favoritas.
  - Em todas essas telas, um aviso amigável (`CloudSyncNotice`) orienta o visitante: *"Crie sua Conta Gratuita da Vovó para salvar seus remédios, cardápio semanal, lista de feira e receitas favoritas permanentemente na nuvem!"*
- **Com Login (Conta Gratuita ou VIP — Nuvem Permanente)**:
  - Ao criar conta ou entrar, todos os dados locais são mesclados e salvos permanentemente no banco de dados via `/api/user/cloud-sync` (`UserCloudData` no SQLite).
  - Se a usuária trocar de celular, limpar o navegador ou abrir no computador dos filhos/netos, seus horários de remédios, cardápio, lista de compras, livro PDF e favoritas são restaurados automaticamente.

---

## 2. Os 10 Módulos de Utilidades para Donas de Casa & Idosas

1. **Cardápio Semanal Automático + Lista de Feira Consolidada** (com exportação WhatsApp e backup na nuvem)
2. **"O Que Tem na Geladeira?" (Zero Desperdício)** (filtro de ingredientes + receitas econômicas da Vovó)
3. **Conversor de Medidas da Vovó (Xícaras ↔ Gramas ↔ Colheres ↔ ml) + Tabela de Substituições de Emergência**
4. **Calculadora "Faça e Venda" (Renda Extra em Casa)** (custo unitário, margem, preço sugerido e lucro mensal salvo na nuvem)
5. **Farmacinha Natural & Guia de Chás da Vovó** (busca por sintoma, modo de preparo, contraindicações e voz)
6. **Caixinha/Despertador de Remédios com Voz + Hidratômetro (8 Copos d'Água)** (prioridade nº 1 de backup permanente na nuvem)
7. **SOS Tira-Manchas & Limpeza Caseira Segura** (com alerta de segurança química e leitura em voz alta)
8. **Calendário da Safra do Mês (Janeiro a Dezembro) & Guia da Horta em Vasos**
9. **Cantinho do Crochê, Tricô & Faça Você Mesma** (passo a passo com voz e sugestão de preço de venda)
10. **Gerador de "Livro de Receitas da Família" em PDF** (capa personalizada, dedicatória aos netos e seleção de receitas salva na nuvem)
