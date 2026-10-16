import Fastify from 'fastify';
import cors from '@fastify/cors';
import { recipesRoutes } from './routes/recipes.routes';
import { importerRoutes } from './routes/importer.routes';
import { authRoutes } from './routes/auth.routes';
import { adminRoutes } from './routes/admin.routes';
import { ensureSeededDatabase } from './seed';

const app = Fastify({
  logger: true,
});

// Headers de Segurança HTTP (Proteção XSS, Clickjacking e Sniffing)
app.addHook('onSend', async (_request, reply, payload) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'SAMEORIGIN');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  return payload;
});

async function bootstrap() {
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await ensureSeededDatabase();

  await app.register(authRoutes);
  await app.register(adminRoutes);
  await app.register(recipesRoutes);
  await app.register(importerRoutes);

  const port = Number(process.env.PORT || 3333);
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`👵 Servidor Caderno da Vovó rodando com segurança em http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
});
