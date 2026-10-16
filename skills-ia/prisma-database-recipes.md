---
name: prisma-database-recipes
description: Modelagem Prisma ORM otimizada para catálogo de receitas acessíveis, busca por ingredientes da geladeira e passos com temporizadores.
---

# Skill: Modelagem e Queries Prisma para Receitas

- Sempre inclua `ingredients` (ordenados por `orderIndex ASC`) e `steps` (ordenados por `stepNumber ASC`) nas consultas de detalhes da receita.
- Implemente a busca **"O que tenho na geladeira"**: permita filtrar receitas onde `ingredients.some.rawText` contenha os termos pesquisados pelo idoso (ex: `"cenoura, ovo"`).
- Garanta `onDelete: Cascade` nas relações de `Ingredient` e `Step` com `Recipe` para evitar registros órfãos ao reimportar uma receita atualizada do TudoGostoso.
