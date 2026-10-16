import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import {
  generateCustomCaptcha,
  hashPassword,
  sanitizeInput,
  verifyCustomCaptcha,
} from '../services/cryptoSecurity';
import { extractAuthUser } from './auth.routes';
import { autoImporterWorker } from '../services/autoImporterWorker';
import { createSlug } from '../services/tudogostosoImporter';

export async function communitySeoRoutes(app: FastifyInstance) {
  // 1. GERADOR DE CAPTCHA PRÓPRIO DA VOVÓ
  app.get('/api/security/captcha', async () => {
    return generateCustomCaptcha();
  });

  // 2. EDITAR PERFIL DO USUÁRIO (Nome, Bio, Especialidade, Avatar e Senha)
  app.put('/api/auth/profile', async (request, reply) => {
    const authUser = extractAuthUser(request);
    if (!authUser) {
      return reply.status(401).send({ error: 'Faça login para editar seu perfil.' });
    }

    const body = request.body as {
      name?: string;
      bio?: string;
      specialty?: string;
      avatarUrl?: string;
      newPassword?: string;
    };

    const dataToUpdate: any = {};
    if (body.name && body.name.trim()) dataToUpdate.name = sanitizeInput(body.name);
    if (body.bio !== undefined) dataToUpdate.bio = sanitizeInput(body.bio);
    if (body.specialty !== undefined) dataToUpdate.specialty = sanitizeInput(body.specialty);
    if (body.avatarUrl !== undefined) dataToUpdate.avatarUrl = sanitizeInput(body.avatarUrl);
    if (body.newPassword && body.newPassword.trim().length >= 4) {
      dataToUpdate.passwordHash = hashPassword(body.newPassword.trim());
    }

    const updated = await prisma.user.update({
      where: { id: authUser.userId },
      data: dataToUpdate,
    });

    await prisma.securityAuditLog.create({
      data: {
        action: 'USER_PROFILE_UPDATED',
        actor: updated.email,
        ipAddress: request.ip,
        details: 'Dados do perfil atualizados pelo próprio usuário.',
      },
    });

    return {
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        bio: updated.bio,
        specialty: updated.specialty,
        avatarUrl: updated.avatarUrl,
        role: updated.role,
        isVip: updated.isVip || updated.role === 'ADMIN',
        vipPlan: updated.vipPlan,
        vipExpiresAt: updated.vipExpiresAt,
      },
      message: 'Perfil atualizado com sucesso!',
    };
  });

  // 3. SISTEMA DE COMENTÁRIOS E AVALIAÇÕES NAS RECEITAS (Com Validação de Captcha Próprio)
  app.get('/api/recipes/:id/comments', async (request) => {
    const { id } = request.params as { id: string };
    const comments = await prisma.comment.findMany({
      where: { recipeId: id },
      orderBy: { createdAt: 'desc' },
    });
    return { comments };
  });

  app.post('/api/recipes/:id/comments', async (request, reply) => {
    const { id } = request.params as { id: string };
    const authUser = extractAuthUser(request);
    const body = request.body as {
      authorName?: string;
      rating?: number;
      content?: string;
      madeIt?: boolean;
      captchaToken?: string;
      captchaAnswer?: string;
    };

    if (!verifyCustomCaptcha(body.captchaToken, body.captchaAnswer)) {
      return reply.status(400).send({
        error: 'Resposta da continha de verificação (Captcha da Vovó) incorreta. Tente novamente!',
      });
    }

    const cleanContent = sanitizeInput(body.content || '');
    const cleanAuthor = sanitizeInput(authUser?.name || body.authorName || 'Leitor(a) da Vovó');
    if (!cleanContent || cleanContent.length < 3) {
      return reply.status(400).send({ error: 'Escreva seu comentário antes de enviar.' });
    }

    const rating = Math.min(5, Math.max(1, Number(body.rating || 5)));

    const comment = await prisma.comment.create({
      data: {
        recipeId: id,
        userId: authUser?.userId || null,
        authorName: cleanAuthor,
        authorIsVip: Boolean(authUser?.isVip),
        rating,
        content: cleanContent,
        madeIt: body.madeIt ?? true,
      },
    });

    // Atualiza média de estrelas e curtidas da receita
    const allComments = await prisma.comment.findMany({
      where: { recipeId: id },
      select: { rating: true },
    });
    const avgRating =
      allComments.reduce((acc, c) => acc + c.rating, 0) / (allComments.length || 1);

    await prisma.recipe.update({
      where: { id },
      data: {
        rating: Number(avgRating.toFixed(1)),
        likesCount: { increment: 1 },
      },
    });

    return { comment, message: 'Muito obrigado pelo seu carinho e avaliação!' };
  });

  // 4. FEED DE NOTÍCIAS, DICAS E HISTÓRIAS DA VOVÓ
  app.get('/api/news', async () => {
    const posts = await prisma.newsPost.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { posts };
  });

  app.post('/api/news', async (request, reply) => {
    const authUser = extractAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Apenas administradores podem publicar notícias.' });
    }

    const body = request.body as {
      title: string;
      summary: string;
      content: string;
      category?: string;
      imageUrl?: string;
      readMinutes?: number;
    };

    if (!body.title || !body.content) {
      return reply.status(400).send({ error: 'Informe título e conteúdo da matéria.' });
    }

    const post = await prisma.newsPost.create({
      data: {
        title: sanitizeInput(body.title),
        slug: createSlug(body.title),
        summary: sanitizeInput(body.summary || body.content.slice(0, 140)),
        content: sanitizeInput(body.content),
        category: body.category || 'Dicas da Vovó',
        imageUrl:
          body.imageUrl ||
          'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80',
        authorName: authUser.name,
        readMinutes: Number(body.readMinutes || 3),
      },
    });

    return { post };
  });

  app.post('/api/news/:id/like', async (request) => {
    const { id } = request.params as { id: string };
    const updated = await prisma.newsPost.update({
      where: { id },
      data: { likesCount: { increment: 1 } },
    });
    return { post: updated };
  });

  // 5. CONTROLE DO ROBÔ AUTO-IMPORTER CONTÍNUO (EXCLUSIVO ADMIN)
  app.get('/api/admin/auto-importer/status', async (request, reply) => {
    const authUser = extractAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Acesso restrito ao Admin.' });
    }
    return autoImporterWorker.getStatus();
  });

  app.post('/api/admin/auto-importer/start', async (request, reply) => {
    const authUser = extractAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Acesso restrito ao Admin.' });
    }
    const body = (request.body || {}) as { intervalSeconds?: number };
    autoImporterWorker.start(body.intervalSeconds);
    return autoImporterWorker.getStatus();
  });

  app.post('/api/admin/auto-importer/pause', async (request, reply) => {
    const authUser = extractAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Acesso restrito ao Admin.' });
    }
    autoImporterWorker.pause();
    return autoImporterWorker.getStatus();
  });

  // 6. SEO COMPLETO & INTEGRAÇÃO GOOGLE SEARCH (sitemap.xml e robots.txt dinâmicos)
  app.get('/robots.txt', async (_request, reply) => {
    reply.header('Content-Type', 'text/plain; charset=utf-8');
    return `User-agent: *\nAllow: /\nDisallow: /api/admin/\nSitemap: http://localhost:3333/sitemap.xml\n`;
  });

  app.get('/sitemap.xml', async (_request, reply) => {
    const [recipes, news] = await Promise.all([
      prisma.recipe.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.newsPost.findMany({ select: { slug: true, createdAt: true } }),
    ]);

    const baseUrl = 'https://cadernodavovo.com.br';
    const urlsXml = [
      `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${baseUrl}/noticias</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
      ...recipes.map(
        (r) =>
          `<url><loc>${baseUrl}/receita/${r.slug}</loc><lastmod>${r.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`
      ),
      ...news.map(
        (n) =>
          `<url><loc>${baseUrl}/noticia/${n.slug}</loc><lastmod>${n.createdAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
      ),
    ].join('\n  ');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urlsXml}\n</urlset>`;
    reply.header('Content-Type', 'application/xml; charset=utf-8');
    return xml;
  });

  // 7. NUVEM PERMANENTE DO USUÁRIO (Remédios, Hidratômetro, Cardápio Semanal, Feira, Livro PDF e Favoritas)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserCloudData" (
      "userId" TEXT PRIMARY KEY,
      "payloadJson" TEXT NOT NULL,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  app.get('/api/user/cloud-sync', async (request, reply) => {
    const authUser = extractAuthUser(request);
    if (!authUser) {
      return reply.status(401).send({ error: 'Faça login para carregar seus dados salvos na nuvem.' });
    }

    const rows = (await prisma.$queryRawUnsafe(
      `SELECT payloadJson, updatedAt FROM "UserCloudData" WHERE userId = ? LIMIT 1`,
      authUser.userId
    )) as Array<{ payloadJson: string; updatedAt: string }>;

    if (!rows || rows.length === 0) {
      return { cloudData: null, updatedAt: null };
    }

    try {
      return {
        cloudData: JSON.parse(rows[0].payloadJson),
        updatedAt: rows[0].updatedAt,
      };
    } catch {
      return { cloudData: null, updatedAt: null };
    }
  });

  app.put('/api/user/cloud-sync', async (request, reply) => {
    const authUser = extractAuthUser(request);
    if (!authUser) {
      return reply.status(401).send({ error: 'Faça login para salvar seus dados permanentemente na nuvem.' });
    }

    const body = (request.body || {}) as { cloudData?: Record<string, unknown> };
    const payloadStr = JSON.stringify(body.cloudData || {});
    const nowIso = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO "UserCloudData" ("userId", "payloadJson", "updatedAt")
       VALUES (?, ?, ?)
       ON CONFLICT("userId") DO UPDATE SET
         "payloadJson" = excluded."payloadJson",
         "updatedAt" = excluded."updatedAt"`,
      authUser.userId,
      payloadStr,
      nowIso
    );

    return {
      ok: true,
      cloudData: body.cloudData || {},
      updatedAt: nowIso,
      message: 'Seus dados foram salvos permanentemente na sua conta!',
    };
  });
}

