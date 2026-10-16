import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../db';
import {
  hashPassword,
  sanitizeInput,
  signAuthToken,
  TokenPayload,
  verifyAuthToken,
  verifyPassword,
} from '../services/cryptoSecurity';

export function extractAuthUser(request: FastifyRequest): TokenPayload | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return verifyAuthToken(token);
}

export async function authRoutes(app: FastifyInstance) {
  // Cadastro de nova conta (Usuário Comum ou Assinante VIP)
  app.post('/api/auth/register', async (request, reply) => {
    const body = request.body as {
      name?: string;
      email?: string;
      password?: string;
      wantVip?: boolean;
      vipPlan?: 'MENSAL' | 'ANUAL';
    };

    const name = sanitizeInput(body.name || '');
    const email = sanitizeInput(body.email || '').toLowerCase();
    const password = body.password || '';

    if (!name || !email || password.length < 4) {
      return reply.status(400).send({
        error: 'Preencha seu nome, e-mail válido e uma senha de pelo menos 4 caracteres.',
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({
        error: 'Este e-mail já está cadastrado no Caderno da Vovó. Faça login!',
      });
    }

    const isVip = Boolean(body.wantVip);
    const role = isVip ? 'VIP' : 'USER';
    const vipExpiresAt = isVip
      ? new Date(Date.now() + (body.vipPlan === 'ANUAL' ? 365 : 30) * 86400000)
      : null;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role,
        isVip,
        vipPlan: isVip ? body.vipPlan || 'MENSAL' : null,
        vipExpiresAt,
      },
    });

    await prisma.securityAuditLog.create({
      data: {
        action: isVip ? 'REGISTER_VIP_ACCOUNT' : 'REGISTER_USER_ACCOUNT',
        actor: email,
        ipAddress: request.ip,
        details: `Conta criada (${role}) com hash scrypt + salt de 16 bytes.`,
      },
    });

    const token = signAuthToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      isVip: user.isVip,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVip: user.isVip,
        vipPlan: user.vipPlan,
        vipExpiresAt: user.vipExpiresAt,
      },
    };
  });

  // Login com verificação criptográfica timing-safe
  app.post('/api/auth/login', async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    const email = sanitizeInput(body.email || '').toLowerCase();
    const password = body.password || '';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      await prisma.securityAuditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          actor: email || 'desconhecido',
          ipAddress: request.ip,
          details: 'Tentativa de login com credenciais inválidas.',
        },
      });
      return reply.status(401).send({
        error: 'E-mail ou senha incorretos. Verifique seus dados.',
      });
    }

    await prisma.securityAuditLog.create({
      data: {
        action: 'LOGIN_SUCCESS',
        actor: user.email,
        ipAddress: request.ip,
        details: `Login autenticado via HMAC-SHA256 (${user.role}).`,
      },
    });

    const token = signAuthToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      isVip: user.isVip || user.role === 'ADMIN',
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVip: user.isVip || user.role === 'ADMIN',
        vipPlan: user.vipPlan,
        vipExpiresAt: user.vipExpiresAt,
      },
    };
  });

  // Perfil do usuário logado
  app.get('/api/auth/me', async (request, reply) => {
    const payload = extractAuthUser(request);
    if (!payload) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return reply.status(404).send({ error: 'Usuário não encontrado.' });
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVip: user.isVip || user.role === 'ADMIN',
        vipPlan: user.vipPlan,
        vipExpiresAt: user.vipExpiresAt,
      },
    };
  });

  // Assinar ou Fazer Upgrade para Conta VIP (Monetização Clube da Vovó)
  app.post('/api/auth/upgrade-vip', async (request, reply) => {
    const payload = extractAuthUser(request);
    if (!payload) {
      return reply.status(401).send({ error: 'Faça login primeiro para ativar o Clube VIP.' });
    }

    const body = request.body as { plan?: 'MENSAL' | 'ANUAL'; paymentMethod?: string };
    const plan = body.plan === 'ANUAL' ? 'ANUAL' : 'MENSAL';
    const days = plan === 'ANUAL' ? 365 : 30;
    const vipExpiresAt = new Date(Date.now() + days * 86400000);

    const updated = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        isVip: true,
        role: payload.role === 'ADMIN' ? 'ADMIN' : 'VIP',
        vipPlan: plan,
        vipExpiresAt,
      },
    });

    await prisma.securityAuditLog.create({
      data: {
        action: 'VIP_SUBSCRIPTION_ACTIVATED',
        actor: updated.email,
        ipAddress: request.ip,
        details: `Assinatura VIP (${plan}) ativada via ${body.paymentMethod || 'PIX/Cartão'}.`,
      },
    });

    const newToken = signAuthToken({
      userId: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role as any,
      isVip: true,
    });

    return {
      token: newToken,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isVip: true,
        vipPlan: updated.vipPlan,
        vipExpiresAt: updated.vipExpiresAt,
      },
      message: 'Parabéns! Agora você faz parte do Clube VIP da Vovó (Sem Anúncios + Receitas Exclusivas)!',
    };
  });
}
