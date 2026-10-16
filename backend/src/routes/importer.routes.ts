import { FastifyInstance } from 'fastify';
import os from 'os';
import { prisma } from '../db';
import {
  discoverTudoGostosoRecipes,
  getCuratedTudoGostosoSuggestions,
  importFromTudoGostoso,
} from '../services/tudogostosoImporter';

async function saveOrUpdateImportedRecipe(url: string) {
  const imported = await importFromTudoGostoso(url);

  const existing = await prisma.recipe.findUnique({
    where: { sourceUrl: imported.sourceUrl },
  });

  if (existing) {
    await prisma.ingredient.deleteMany({ where: { recipeId: existing.id } });
    await prisma.step.deleteMany({ where: { recipeId: existing.id } });

    return prisma.recipe.update({
      where: { id: existing.id },
      data: {
        title: imported.title,
        imageUrl: imported.imageUrl,
        category: imported.category,
        prepTimeMinutes: imported.prepTimeMinutes,
        servings: imported.servings,
        difficulty: imported.difficulty || 'Fácil',
        ingredients: { create: imported.ingredients },
        steps: { create: imported.steps },
      },
      include: {
        ingredients: { orderBy: { orderIndex: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    });
  }

  return prisma.recipe.create({
    data: {
      title: imported.title,
      slug: imported.slug,
      sourceUrl: imported.sourceUrl,
      imageUrl: imported.imageUrl,
      category: imported.category,
      prepTimeMinutes: imported.prepTimeMinutes,
      servings: imported.servings,
      difficulty: imported.difficulty || 'Fácil',
      ingredients: { create: imported.ingredients },
      steps: { create: imported.steps },
    },
    include: {
      ingredients: { orderBy: { orderIndex: 'asc' } },
      steps: { orderBy: { stepNumber: 'asc' } },
    },
  });
}

export async function importerRoutes(app: FastifyInstance) {
  // Importa uma única URL do TudoGostoso
  app.post('/api/import/url', async (request, reply) => {
    const { url } = request.body as { url?: string };
    if (!url || !url.trim()) {
      return reply.status(400).send({ error: 'Informe a URL da receita do TudoGostoso.' });
    }

    try {
      const recipe = await saveOrUpdateImportedRecipe(url.trim());
      return { recipe, message: 'Receita importada com sucesso do TudoGostoso!' };
    } catch (err: any) {
      return reply.status(422).send({
        error: err?.message || 'Erro ao importar receita do TudoGostoso.',
      });
    }
  });

  // Importa várias URLs do TudoGostoso em lote
  app.post('/api/import/batch', async (request, reply) => {
    const { urls } = request.body as { urls?: string[] };
    if (!Array.isArray(urls) || urls.length === 0) {
      return reply.status(400).send({ error: 'Informe uma lista de URLs do TudoGostoso.' });
    }

    const imported: any[] = [];
    const errors: { url: string; error: string }[] = [];

    for (const rawUrl of urls) {
      const clean = String(rawUrl || '').trim();
      if (!clean) continue;
      try {
        const saved = await saveOrUpdateImportedRecipe(clean);
        imported.push(saved);
      } catch (err: any) {
        errors.push({ url: clean, error: err?.message || 'Falha na importação' });
      }
    }

    return {
      importedCount: imported.length,
      errorCount: errors.length,
      imported,
      errors,
    };
  });

  // Descobre receitas no TudoGostoso por palavra-chave ou retorna sugestões prontas
  app.get('/api/import/discover', async (request) => {
    const { q } = request.query as { q?: string };
    if (!q || !q.trim()) {
      return { suggestions: getCuratedTudoGostosoSuggestions() };
    }
    const suggestions = await discoverTudoGostosoRecipes(q);
    return { suggestions };
  });

  // Informações do servidor e IP da rede local para conectar o aplicativo do celular
  app.get('/api/system/info', async () => {
    const nets = os.networkInterfaces();
    const lanIps: string[] = [];

    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          lanIps.push(net.address);
        }
      }
    }

    const totalRecipes = await prisma.recipe.count();
    const favoriteRecipes = await prisma.recipe.count({ where: { isFavorite: true } });

    return {
      status: 'online',
      port: 3333,
      lanIps,
      recommendedMobileApiUrl: lanIps[0] ? `http://${lanIps[0]}:3333` : 'http://localhost:3333',
      stats: {
        totalRecipes,
        favoriteRecipes,
      },
    };
  });
}
