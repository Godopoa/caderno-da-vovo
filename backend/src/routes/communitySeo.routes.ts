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

  // 6. SEO OMNI-SEARCH COMPLETO (Google, Bing, IndexNow, Yahoo, DuckDuckGo, Yandex, OpenSearch & Sitemap XML Rich Image/News)
  const INDEXNOW_KEY = 'caderno-vovo-indexnow-2026';

  const xmlEscape = (str: string) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  app.get('/indexnow-key.txt', async (_request, reply) => {
    reply.header('Content-Type', 'text/plain; charset=utf-8');
    return INDEXNOW_KEY;
  });

  app.get(`/${INDEXNOW_KEY}.txt`, async (_request, reply) => {
    reply.header('Content-Type', 'text/plain; charset=utf-8');
    return INDEXNOW_KEY;
  });

  app.get('/opensearch.xml', async (_request, reply) => {
    reply.header('Content-Type', 'application/opensearchdescription+xml; charset=utf-8');
    return `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">
  <ShortName>Caderno da Vovó</ShortName>
  <Description>Busque receitas caseiras, chás medicinais, dicas do lar e truques da Vovó Helena</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Language>pt-BR</Language>
  <Image width="64" height="64" type="image/jpeg">https://cadernodavovo.com.br/images/logo-vovo.jpg</Image>
  <Url type="text/html" method="get" template="https://cadernodavovo.com.br/?q={searchTerms}" />
  <Url type="application/opensearchdescription+xml" rel="self" template="https://cadernodavovo.com.br/opensearch.xml" />
  <moz:SearchForm>https://cadernodavovo.com.br/</moz:SearchForm>
</OpenSearchDescription>`;
  });

  app.get('/robots.txt', async (_request, reply) => {
    reply.header('Content-Type', 'text/plain; charset=utf-8');
    reply.header('Cache-Control', 'public, max-age=3600');
    return [
      '# ==========================================================================',
      '# Caderno da Vovó v6.0 — Robots.txt Otimizado (Google, Bing, Yahoo, DuckDuckGo, Yandex & Redes Sociais)',
      '# ==========================================================================',
      '',
      '# 1. Google Search, Google Imagens & Google Discover',
      'User-agent: Googlebot',
      'Allow: /',
      'Allow: /?tab=*',
      'Allow: /?receita=*',
      'Disallow: /api/admin/',
      'Disallow: /api/user/',
      '',
      'User-agent: Googlebot-Image',
      'Allow: /images/',
      'Allow: /',
      '',
      'User-agent: Googlebot-News',
      'Allow: /',
      '',
      '# 2. Microsoft Bing, MSN, Edge & IndexNow',
      'User-agent: Bingbot',
      'Allow: /',
      'Allow: /?tab=*',
      'Allow: /?receita=*',
      'Disallow: /api/admin/',
      'Disallow: /api/user/',
      'Crawl-delay: 1',
      '',
      'User-agent: msnbot',
      'Allow: /',
      '',
      'User-agent: AdIdxBot',
      'Allow: /',
      '',
      '# 3. Yahoo! Slurp, DuckDuckGo, Yandex & Apple Spotlight/Siri',
      'User-agent: Slurp',
      'Allow: /',
      'Disallow: /api/admin/',
      '',
      'User-agent: DuckDuckBot',
      'Allow: /',
      '',
      'User-agent: Yandex',
      'Allow: /',
      'Disallow: /api/admin/',
      '',
      'User-agent: Applebot',
      'Allow: /',
      '',
      '# 4. Pré-visualização rica em WhatsApp, Facebook, Instagram, Pinterest e Telegram',
      'User-agent: WhatsApp',
      'Allow: /',
      '',
      'User-agent: facebookexternalhit',
      'Allow: /',
      '',
      'User-agent: Pinterestbot',
      'Allow: /',
      '',
      'User-agent: Twitterbot',
      'Allow: /',
      '',
      '# 5. Regra Geral para Todos os Motores de Busca',
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/admin/',
      'Disallow: /api/user/',
      '',
      '# 6. Host Principal & Sitemaps Dinâmicos (Produção + Local)',
      'Host: https://cadernodavovo.com.br',
      'Sitemap: https://cadernodavovo.com.br/sitemap.xml',
      'Sitemap: http://localhost:3333/sitemap.xml',
      '',
    ].join('\n');
  });

  app.get('/sitemap.xml', async (_request, reply) => {
    const [recipes, news] = await Promise.all([
      prisma.recipe.findMany({
        select: {
          slug: true,
          title: true,
          description: true,
          category: true,
          imageUrl: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.newsPost.findMany({
        select: {
          slug: true,
          title: true,
          summary: true,
          category: true,
          imageUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const baseUrl = 'https://cadernodavovo.com.br';
    const nowIso = new Date().toISOString();
    const defaultLogo = `${baseUrl}/images/logo-vovo.jpg`;

    const staticHubPages = [
      {
        loc: `${baseUrl}/`,
        priority: '1.0',
        changefreq: 'daily',
        title: 'Caderno da Vovó — Portal de Receitas Afetivas, Economia do Lar & Saúde Sênior',
      },
      {
        loc: `${baseUrl}/?tab=cooking`,
        priority: '0.9',
        changefreq: 'daily',
        title: 'Estúdio Modo Cozinha Guiado por Voz da Vovó Helena',
      },
      {
        loc: `${baseUrl}/?tab=economy`,
        priority: '0.9',
        changefreq: 'daily',
        title: 'Economia do Lar: Cardápio da Semana, Lista de Feira, Contas da Casa & Faça e Venda',
      },
      {
        loc: `${baseUrl}/?tab=health`,
        priority: '0.9',
        changefreq: 'daily',
        title: 'Saúde Sênior: Lembrete de Remédios, Diário de Pressão e Glicemia, Cartão SOS & Chás',
      },
      {
        loc: `${baseUrl}/?tab=crafts`,
        priority: '0.85',
        changefreq: 'weekly',
        title: 'Sabedoria do Lar: SOS Tira-Manchas, Safra do Mês, Horta em Vasos, Crochê & Aniversários',
      },
      {
        loc: `${baseUrl}/?tab=memory`,
        priority: '0.85',
        changefreq: 'daily',
        title: 'Passatempos da Vovó: Jogo da Memória Culinária, Quiz com Voz & Mensagens de Bom Dia WhatsApp',
      },
      {
        loc: `${baseUrl}/?tab=cookbook`,
        priority: '0.8',
        changefreq: 'weekly',
        title: 'Gerador de Livro de Receitas da Família em PDF para Imprimir',
      },
      {
        loc: `${baseUrl}/?tab=news`,
        priority: '0.85',
        changefreq: 'daily',
        title: 'Jornalzinho da Vovó: Dicas de Cozinha, Bem-Estar & Histórias de Família',
      },
    ];

    const hubUrlsXml = staticHubPages.map(
      (h) => `  <url>
    <loc>${xmlEscape(h.loc)}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${h.changefreq}</changefreq>
    <priority>${h.priority}</priority>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${xmlEscape(h.loc)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(h.loc)}" />
    <image:image>
      <image:loc>${xmlEscape(defaultLogo)}</image:loc>
      <image:title>${xmlEscape(h.title)}</image:title>
    </image:image>
  </url>`
    );

    const recipeUrlsXml = recipes.map((r) => {
      const locUrl = `${baseUrl}/?receita=${encodeURIComponent(r.slug)}`;
      const imgUrl = r.imageUrl && r.imageUrl.startsWith('http') ? r.imageUrl : defaultLogo;
      const caption =
        r.description || `Receita caseira de ${r.title} (${r.category}) passo a passo no Caderno da Vovó.`;
      return `  <url>
    <loc>${xmlEscape(locUrl)}</loc>
    <lastmod>${r.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.95</priority>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${xmlEscape(locUrl)}" />
    <image:image>
      <image:loc>${xmlEscape(imgUrl)}</image:loc>
      <image:title>${xmlEscape(`${r.title} — Caderno da Vovó`)}</image:title>
      <image:caption>${xmlEscape(caption)}</image:caption>
    </image:image>
  </url>`;
    });

    const newsUrlsXml = news.map((n) => {
      const locUrl = `${baseUrl}/?tab=news&artigo=${encodeURIComponent(n.slug)}`;
      const imgUrl = n.imageUrl && n.imageUrl.startsWith('http') ? n.imageUrl : defaultLogo;
      return `  <url>
    <loc>${xmlEscape(locUrl)}</loc>
    <lastmod>${n.createdAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
    <image:image>
      <image:loc>${xmlEscape(imgUrl)}</image:loc>
      <image:title>${xmlEscape(n.title)}</image:title>
      <image:caption>${xmlEscape(n.summary)}</image:caption>
    </image:image>
    <news:news>
      <news:publication>
        <news:name>Caderno da Vovó</news:name>
        <news:language>pt</news:language>
      </news:publication>
      <news:publication_date>${n.createdAt.toISOString()}</news:publication_date>
      <news:title>${xmlEscape(n.title)}</news:title>
    </news:news>
  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${[...hubUrlsXml, ...recipeUrlsXml, ...newsUrlsXml].join('\n')}
</urlset>`;

    reply.header('Content-Type', 'application/xml; charset=utf-8');
    reply.header('Cache-Control', 'public, max-age=1800');
    return xml;
  });

  app.get('/api/seo/diagnostics', async () => {
    const [recipesCount, newsCount, commentsCount] = await Promise.all([
      prisma.recipe.count(),
      prisma.newsPost.count(),
      prisma.comment.count(),
    ]);

    return {
      status: 'OPTIMAL',
      enginesSupported: [
        'Google Search & Google Discover',
        'Google Images & Rich Recipe Cards',
        'Microsoft Bing & MSN (IndexNow Active)',
        'Yahoo! Slurp',
        'DuckDuckGo',
        'Yandex',
        'WhatsApp / Facebook / Pinterest OpenGraph',
      ],
      indexNowKey: INDEXNOW_KEY,
      indexedUrlsTotal: 8 + recipesCount + newsCount,
      recipesIndexed: recipesCount,
      newsIndexed: newsCount,
      commentsIndexed: commentsCount,
      endpoints: {
        sitemapXml: 'http://localhost:3333/sitemap.xml',
        robotsTxt: 'http://localhost:3333/robots.txt',
        openSearchXml: 'http://localhost:3333/opensearch.xml',
        indexNowKeyTxt: 'http://localhost:3333/indexnow-key.txt',
      },
    };
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

  // 8. SINTETIZADOR DE VOZ NEURAL FEMININA DA VOVÓ (MP3 Stream pt-BR Sem Voz Masculina Robótica)
  app.get('/api/tts/speak', async (request, reply) => {
    const query = request.query as { text?: string };
    const rawText = (query.text || '').trim();
    if (!rawText) {
      return reply.status(400).send({ error: 'Texto vazio para síntese de voz.' });
    }

    // Divide textos longos em frases de até 175 caracteres para síntese neural contínua
    const splitIntoChunks = (input: string, maxLen = 175): string[] => {
      const normalized = input.replace(/\s+/g, ' ').trim();
      const sentences = normalized.split(/(?<=[.!?।:;])\s+/);
      const chunks: string[] = [];
      let current = '';

      for (const sentence of sentences) {
        if ((current + ' ' + sentence).trim().length <= maxLen) {
          current = (current + ' ' + sentence).trim();
        } else {
          if (current) chunks.push(current);
          if (sentence.length <= maxLen) {
            current = sentence;
          } else {
            const words = sentence.split(' ');
            let sub = '';
            for (const w of words) {
              if ((sub + ' ' + w).trim().length <= maxLen) {
                sub = (sub + ' ' + w).trim();
              } else {
                if (sub) chunks.push(sub);
                sub = w;
              }
            }
            current = sub;
          }
        }
      }
      if (current) chunks.push(current);
      return chunks.slice(0, 12);
    };

    try {
      const chunks = splitIntoChunks(rawText);
      const buffers: Buffer[] = [];

      for (const chunk of chunks) {
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=pt-BR&client=tw-ob&q=${encodeURIComponent(
          chunk
        )}`;
        const response = await fetch(ttsUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
        });
        if (response.ok) {
          const arrBuf = await response.arrayBuffer();
          buffers.push(Buffer.from(arrBuf));
        }
      }

      if (buffers.length === 0) {
        return reply.status(502).send({ error: 'Falha ao gerar áudio neural.' });
      }

      const combined = Buffer.concat(buffers);
      reply.header('Content-Type', 'audio/mpeg');
      reply.header('Cache-Control', 'public, max-age=86400');
      return reply.send(combined);
    } catch {
      return reply.status(500).send({ error: 'Erro ao sintetizar voz da Vovó.' });
    }
  });
}

