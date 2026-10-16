import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db';
import { decryptAES256, encryptAES256 } from '../services/cryptoSecurity';
import { extractAuthUser } from './auth.routes';

function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = extractAuthUser(request);
  if (!user || user.role !== 'ADMIN') {
    reply.status(403).send({
      error: 'Acesso restrito! Apenas administradores autenticados podem acessar este recurso.',
    });
    return null;
  }
  return user;
}

export async function adminRoutes(app: FastifyInstance) {
  // Configurações públicas de Monetização / Google AdSense para o Frontend renderizar os banners
  app.get('/api/monetization/config', async () => {
    let config = await prisma.siteConfig.findUnique({ where: { id: 'default' } });
    if (!config) {
      config = await prisma.siteConfig.create({
        data: {
          id: 'default',
          encryptedPixKey: encryptAES256('pix@cadernodavovo.com.br'),
        },
      });
    }

    return {
      siteName: config.siteName,
      adsenseEnabled: config.adsenseEnabled,
      adsenseClientId: config.adsenseClientId,
      adsenseHeaderSlot: config.adsenseHeaderSlot,
      adsenseInFeedSlot: config.adsenseInFeedSlot,
      adsenseRecipeSlot: config.adsenseRecipeSlot,
      vipMonthlyPrice: config.vipMonthlyPrice,
      vipAnnualPrice: config.vipAnnualPrice,
      pixKey: decryptAES256(config.encryptedPixKey) || 'pix@cadernodavovo.com.br',
    };
  });

  // Dashboard Completo do Administrador (KPIs, Finanças, Segurança, Usuários e Auditoria)
  app.get('/api/admin/dashboard', async (request, reply) => {
    const admin = requireAdmin(request, reply);
    if (!admin) return;

    const [
      totalRecipes,
      vipRecipesCount,
      importedRecipesCount,
      users,
      auditLogs,
      siteConfig,
    ] = await Promise.all([
      prisma.recipe.count(),
      prisma.recipe.count({ where: { isVipOnly: true } }),
      prisma.recipe.count({ where: { NOT: { sourceUrl: null } } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isVip: true,
          vipPlan: true,
          vipExpiresAt: true,
          createdAt: true,
        },
      }),
      prisma.securityAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      prisma.siteConfig.findUnique({ where: { id: 'default' } }),
    ]);

    const allRecipes = await prisma.recipe.findMany({
      select: { viewsCount: true, likesCount: true },
    });

    const totalViews = allRecipes.reduce((acc, r) => acc + (r.viewsCount || 0), 0);
    const totalLikes = allRecipes.reduce((acc, r) => acc + (r.likesCount || 0), 0);

    const vipUsersCount = users.filter((u) => u.isVip || u.role === 'VIP').length;
    const monthlyPrice = siteConfig?.vipMonthlyPrice ?? 14.9;
    const estimatedVipMrr = Number((vipUsersCount * monthlyPrice).toFixed(2));
    const estimatedAdsenseRevenue = Number(((totalViews / 1000) * 18.5).toFixed(2));

    return {
      kpis: {
        totalRecipes,
        vipRecipesCount,
        importedRecipesCount,
        totalUsers: users.length,
        vipUsersCount,
        totalViews,
        totalLikes,
        estimatedVipMrr,
        estimatedAdsenseRevenue,
        totalEstimatedMonthlyRevenue: Number((estimatedVipMrr + estimatedAdsenseRevenue).toFixed(2)),
      },
      security: {
        passwordAlgorithm: 'Scrypt (N=16384, r=8, p=1) + 16-byte Random Salt + TimingSafeEqual',
        tokenAlgorithm: 'HMAC-SHA256 Signed Bearer Token',
        storageEncryption: 'AES-256-GCM Authenticated Encryption (IV 96-bit + AuthTag 128-bit)',
      },
      users,
      auditLogs,
    };
  });

  // Atualizar configurações de Google AdSense, Preços VIP e Chave PIX (Criptografada em AES-256-GCM)
  app.put('/api/admin/monetization', async (request, reply) => {
    const admin = requireAdmin(request, reply);
    if (!admin) return;

    const body = request.body as {
      siteName?: string;
      adsenseEnabled?: boolean;
      adsenseClientId?: string;
      adsenseHeaderSlot?: string;
      adsenseInFeedSlot?: string;
      adsenseRecipeSlot?: string;
      vipMonthlyPrice?: number;
      vipAnnualPrice?: number;
      pixKey?: string;
    };

    const encryptedPixKey = body.pixKey
      ? encryptAES256(body.pixKey.trim())
      : undefined;

    const updated = await prisma.siteConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        siteName: body.siteName || 'Caderno da Vovó',
        adsenseEnabled: body.adsenseEnabled ?? true,
        adsenseClientId: body.adsenseClientId || 'ca-pub-0000000000000000',
        adsenseHeaderSlot: body.adsenseHeaderSlot || '1000000001',
        adsenseInFeedSlot: body.adsenseInFeedSlot || '1000000002',
        adsenseRecipeSlot: body.adsenseRecipeSlot || '1000000003',
        vipMonthlyPrice: Number(body.vipMonthlyPrice ?? 14.9),
        vipAnnualPrice: Number(body.vipAnnualPrice ?? 119.9),
        encryptedPixKey: encryptedPixKey || encryptAES256('pix@cadernodavovo.com.br'),
      },
      update: {
        siteName: body.siteName,
        adsenseEnabled: body.adsenseEnabled,
        adsenseClientId: body.adsenseClientId,
        adsenseHeaderSlot: body.adsenseHeaderSlot,
        adsenseInFeedSlot: body.adsenseInFeedSlot,
        adsenseRecipeSlot: body.adsenseRecipeSlot,
        vipMonthlyPrice: body.vipMonthlyPrice !== undefined ? Number(body.vipMonthlyPrice) : undefined,
        vipAnnualPrice: body.vipAnnualPrice !== undefined ? Number(body.vipAnnualPrice) : undefined,
        ...(encryptedPixKey ? { encryptedPixKey } : {}),
      },
    });

    await prisma.securityAuditLog.create({
      data: {
        action: 'UPDATE_MONETIZATION_ADSENSE',
        actor: admin.email,
        ipAddress: request.ip,
        details: `AdSense (${updated.adsenseClientId}) e Chave PIX recriptografada em AES-256-GCM.`,
      },
    });

    return {
      message: 'Configurações de Monetização, Google AdSense e Criptografia salvas com sucesso!',
    };
  });

  // Alternar status VIP ou Admin de um usuário pelo Painel Admin
  app.post('/api/admin/users/:id/toggle-vip', async (request, reply) => {
    const admin = requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return reply.status(404).send({ error: 'Usuário não encontrado.' });
    }

    const nextVip = !target.isVip;
    const updated = await prisma.user.update({
      where: { id },
      data: {
        isVip: nextVip,
        role: target.role === 'ADMIN' ? 'ADMIN' : nextVip ? 'VIP' : 'USER',
        vipPlan: nextVip ? 'ANUAL' : null,
        vipExpiresAt: nextVip ? new Date(Date.now() + 365 * 86400000) : null,
      },
    });

    await prisma.securityAuditLog.create({
      data: {
        action: nextVip ? 'ADMIN_GRANT_VIP' : 'ADMIN_REVOKE_VIP',
        actor: admin.email,
        ipAddress: request.ip,
        details: `Usuário ${updated.email} alterado para isVip=${nextVip}.`,
      },
    });

    return { user: updated };
  });

  // Alternar se uma receita é Exclusiva VIP ou Gratuita
  app.post('/api/admin/recipes/:id/toggle-vip', async (request, reply) => {
    const admin = requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) {
      return reply.status(404).send({ error: 'Receita não encontrada.' });
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data: { isVipOnly: !recipe.isVipOnly },
    });

    return { recipe: updated };
  });
}
