import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import {
  createSlug,
  detectStepTimerSeconds,
  normalizeForSeniorVoice,
} from '../services/tudogostosoImporter';

export async function recipesRoutes(app: FastifyInstance) {
  app.get('/api/recipes', async (request) => {
    const query = request.query as {
      search?: string;
      category?: string;
      favorite?: string;
      fridge?: string;
    };

    const where: any = {};

    if (query.category && query.category !== 'Todas') {
      where.category = query.category;
    }

    if (query.favorite === 'true') {
      where.isFavorite = true;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term } },
        { category: { contains: term } },
        { description: { contains: term } },
        { ingredients: { some: { rawText: { contains: term } } } },
      ];
    }

    if (query.fridge && query.fridge.trim()) {
      const items = query.fridge
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);

      if (items.length > 0) {
        where.AND = items.map((ingredientTerm) => ({
          ingredients: {
            some: {
              rawText: {
                contains: ingredientTerm,
              },
            },
          },
        }));
      }
    }

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        ingredients: { orderBy: { orderIndex: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
        comments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
    });

    return { recipes };
  });

  app.get('/api/recipes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const recipe = await prisma.recipe.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        ingredients: { orderBy: { orderIndex: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
        comments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!recipe) {
      return reply.status(404).send({ error: 'Receita não encontrada.' });
    }

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { viewsCount: { increment: 1 } },
    });

    return { recipe };
  });

  app.post('/api/recipes/:id/favorite', async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Receita não encontrada.' });
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data: { isFavorite: !existing.isFavorite },
      include: {
        ingredients: { orderBy: { orderIndex: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
        comments: { orderBy: { createdAt: 'desc' } },
      },
    });

    return { recipe: updated };
  });

  app.post('/api/recipes', async (request, reply) => {
    const body = request.body as {
      title: string;
      description?: string;
      chefTip?: string;
      category?: string;
      prepTimeMinutes?: number;
      servings?: string;
      imageUrl?: string;
      ingredients: string[];
      steps: string[];
    };

    if (!body.title || !Array.isArray(body.ingredients) || !Array.isArray(body.steps)) {
      return reply
        .status(400)
        .send({ error: 'Informe o nome da receita, os ingredientes e o modo de preparo.' });
    }

    const created = await prisma.recipe.create({
      data: {
        title: body.title.trim(),
        slug: createSlug(body.title),
        description:
          body.description ||
          'Receita especial enviada para o Caderno da Vovó, testada com carinho em família.',
        chefTip: body.chefTip || null,
        category: body.category || 'Receitas Caseiras',
        prepTimeMinutes: body.prepTimeMinutes || 30,
        servings: body.servings || '6 porções',
        imageUrl:
          body.imageUrl ||
          'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=900&q=80',
        isFavorite: true,
        ingredients: {
          create: body.ingredients
            .map((t) => t.trim())
            .filter(Boolean)
            .map((raw, idx) => ({
              section: 'Principal',
              rawText: normalizeForSeniorVoice(raw),
              orderIndex: idx + 1,
            })),
        },
        steps: {
          create: body.steps
            .map((s) => s.trim())
            .filter(Boolean)
            .map((inst, idx) => {
              const clean = normalizeForSeniorVoice(inst);
              return {
                section: 'Preparo',
                stepNumber: idx + 1,
                instruction: clean,
                timerSeconds: detectStepTimerSeconds(clean),
              };
            }),
        },
      },
      include: {
        ingredients: { orderBy: { orderIndex: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
        comments: { orderBy: { createdAt: 'desc' } },
      },
    });

    return { recipe: created };
  });

  app.delete('/api/recipes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.recipe.delete({ where: { id } });
      return { success: true };
    } catch {
      return reply.status(404).send({ error: 'Receita não encontrada.' });
    }
  });
}
