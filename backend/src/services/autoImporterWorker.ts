import * as cheerio from 'cheerio';
import { prisma } from '../db';
import {
  getCuratedTudoGostosoSuggestions,
  importFromTudoGostoso,
} from './tudogostosoImporter';

export interface AutoImporterLog {
  id: string;
  timestamp: string;
  type: 'IMPORTED' | 'SKIPPED' | 'CRAWLED' | 'INFO' | 'ERROR';
  title?: string;
  url?: string;
  message: string;
}

// Categorias e páginas semente do TudoGostoso para varrer o site inteiro continuamente
const SEED_CATEGORY_URLS = [
  'https://www.tudogostoso.com.br/categorias/1000-bolos-e-tortas-doces',
  'https://www.tudogostoso.com.br/categorias/1004-carnes',
  'https://www.tudogostoso.com.br/categorias/1009-aves',
  'https://www.tudogostoso.com.br/categorias/1028-massas',
  'https://www.tudogostoso.com.br/categorias/1032-sopas',
  'https://www.tudogostoso.com.br/categorias/1037-doces-e-sobremesas',
  'https://www.tudogostoso.com.br/categorias/1044-lanches',
  'https://www.tudogostoso.com.br/categorias/1014-peixes-e-frutos-do-mar',
  'https://www.tudogostoso.com.br/busca?q=bolo+caseiro',
  'https://www.tudogostoso.com.br/busca?q=receita+da+vovo',
  'https://www.tudogostoso.com.br/busca?q=pudim',
  'https://www.tudogostoso.com.br/busca?q=torta+salgada',
  'https://www.tudogostoso.com.br/busca?q=pao+caseiro',
  'https://www.tudogostoso.com.br/busca?q=caldo+verde',
  'https://www.tudogostoso.com.br/busca?q=lasanha',
  'https://www.tudogostoso.com.br/busca?q=arroz+doce',
];

class AutoImporterEngine {
  public isRunning = false;
  public intervalMs = 7000; // Importa uma nova receita a cada 7 segundos sem sobrecarregar
  public totalImportedInSession = 0;
  public totalSkippedDuplicates = 0;
  public currentAction = 'Pausado — Aguardando comando no Painel Admin';
  public recentLogs: AutoImporterLog[] = [];

  private recipeUrlQueue: string[] = [];
  private categoryIndex = 0;
  private visitedUrls = new Set<string>();
  private timerHandle: NodeJS.Timeout | null = null;
  private isProcessingStep = false;

  constructor() {
    // Inicializa a fila com o catálogo curado
    const initial = getCuratedTudoGostosoSuggestions();
    for (const item of initial) {
      this.recipeUrlQueue.push(item.url);
    }
  }

  public addLog(type: AutoImporterLog['type'], message: string, title?: string, url?: string) {
    this.recentLogs.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      type,
      title,
      url,
      message,
    });
    if (this.recentLogs.length > 60) {
      this.recentLogs.pop();
    }
  }

  public start(customIntervalSeconds?: number) {
    if (customIntervalSeconds && customIntervalSeconds >= 3) {
      this.intervalMs = customIntervalSeconds * 1000;
    }
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentAction = 'Robô Auto-Importer iniciado! Varrendo TudoGostoso.com.br...';
    this.addLog('INFO', '▶️ Auto-Importer Contínuo iniciado pelo Administrador.');

    // Executa o primeiro ciclo imediatamente e agenda os próximos
    this.runTick();
    this.timerHandle = setInterval(() => {
      this.runTick();
    }, this.intervalMs);
  }

  public pause() {
    this.isRunning = false;
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
    this.currentAction = '⏸️ Auto-Importer pausado pelo Administrador.';
    this.addLog('INFO', '⏸️ Auto-Importer pausado. Você pode retomar a qualquer momento.');
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      intervalSeconds: Math.round(this.intervalMs / 1000),
      queueSize: this.recipeUrlQueue.length,
      visitedCount: this.visitedUrls.size,
      totalImportedInSession: this.totalImportedInSession,
      totalSkippedDuplicates: this.totalSkippedDuplicates,
      currentAction: this.currentAction,
      recentLogs: this.recentLogs.slice(0, 30),
    };
  }

  private async crawlMoreLinksFromPage(pageUrl: string) {
    try {
      this.currentAction = `🔍 Descobrindo novas receitas em: ${pageUrl}`;
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      });
      if (!res.ok) return;
      const html = await res.text();
      const $ = cheerio.load(html);

      let addedCount = 0;
      $('a[href*="/receita/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        const fullUrl = (href.startsWith('http') ? href : `https://www.tudogostoso.com.br${href}`)
          .split('?')[0]
          .trim();

        if (
          fullUrl.includes('tudogostoso.com.br/receita/') &&
          fullUrl.endsWith('.html') &&
          !this.visitedUrls.has(fullUrl) &&
          !this.recipeUrlQueue.includes(fullUrl)
        ) {
          this.recipeUrlQueue.push(fullUrl);
          addedCount++;
        }
      });

      if (addedCount > 0) {
        this.addLog(
          'CRAWLED',
          `🕸️ Crawler encontrou +${addedCount} novos links de receitas em ${pageUrl}`,
          undefined,
          pageUrl
        );
      }
    } catch {
      // ignora erro de rede em página de categoria e passa para a próxima
    }
  }

  private async runTick() {
    if (!this.isRunning || this.isProcessingStep) return;
    this.isProcessingStep = true;

    try {
      // Se a fila estiver baixa, varre a próxima categoria/página de busca do TudoGostoso
      if (this.recipeUrlQueue.length < 5) {
        const nextCategoryUrl =
          SEED_CATEGORY_URLS[this.categoryIndex % SEED_CATEGORY_URLS.length];
        this.categoryIndex++;
        await this.crawlMoreLinksFromPage(nextCategoryUrl);
      }

      // Pega o próximo link ainda não processado
      while (this.recipeUrlQueue.length > 0) {
        const candidateUrl = this.recipeUrlQueue.shift()!;
        if (this.visitedUrls.has(candidateUrl)) {
          continue;
        }
        this.visitedUrls.add(candidateUrl);

        // Verifica no banco SQLite/Prisma se a URL já existe (NÃO REPETE!)
        const existingByUrl = await prisma.recipe.findUnique({
          where: { sourceUrl: candidateUrl },
        });

        if (existingByUrl) {
          this.totalSkippedDuplicates++;
          this.addLog(
            'SKIPPED',
            `⏭️ Já existe no banco (ignorada para não repetir): ${existingByUrl.title}`,
            existingByUrl.title,
            candidateUrl
          );
          // Aproveita também para extrair links relacionados se a fila estiver curta
          if (this.recipeUrlQueue.length < 8) {
            await this.crawlMoreLinksFromPage(candidateUrl);
          }
          continue;
        }

        // Importa a receita inédita!
        this.currentAction = `📥 Importando receita inédita: ${candidateUrl}`;
        const imported = await importFromTudoGostoso(candidateUrl);

        // Verifica também se já existe receita com o mesmo título exato
        const existingByTitle = await prisma.recipe.findFirst({
          where: { title: imported.title },
        });

        if (existingByTitle) {
          this.totalSkippedDuplicates++;
          this.addLog(
            'SKIPPED',
            `⏭️ Título duplicado ignorado: "${imported.title}"`,
            imported.title,
            candidateUrl
          );
          continue;
        }

        const saved = await prisma.recipe.create({
          data: {
            title: imported.title,
            slug: imported.slug,
            description: `Receita tradicional de ${imported.title} (${imported.category}), importada e otimizada com leitura em voz alta e relógio automático no Caderno da Vovó.`,
            chefTip:
              'Segredinho da Vovó: Separe todos os ingredientes na bancada antes de ligar o fogo e siga o Modo Cozinha Guiado!',
            sourceUrl: imported.sourceUrl,
            imageUrl: imported.imageUrl,
            category: imported.category,
            prepTimeMinutes: imported.prepTimeMinutes || 35,
            servings: imported.servings || '6 porções',
            difficulty: imported.difficulty || 'Fácil',
            caloriesPerServ: Math.floor(160 + Math.random() * 220),
            rating: Number((4.7 + Math.random() * 0.3).toFixed(1)),
            viewsCount: Math.floor(80 + Math.random() * 450),
            likesCount: Math.floor(20 + Math.random() * 140),
            ingredients: { create: imported.ingredients },
            steps: { create: imported.steps },
          },
        });

        this.totalImportedInSession++;
        this.currentAction = `✅ Importada com sucesso: "${saved.title}"`;
        this.addLog(
          'IMPORTED',
          `✅ Nova receita importada (#${this.totalImportedInSession}): "${saved.title}" (${imported.ingredients.length} ingr. / ${imported.steps.length} passos)`,
          saved.title,
          candidateUrl
        );

        // Também descobre novos links a partir da própria página da receita recém-aberta!
        if (this.recipeUrlQueue.length < 25) {
          await this.crawlMoreLinksFromPage(candidateUrl);
        }

        // Importou 1 receita inédita neste ciclo! Aguarda o próximo tick.
        break;
      }
    } catch (err: any) {
      this.addLog(
        'ERROR',
        `⚠️ Aviso ao processar URL: ${err?.message || 'Tentando próxima receita da fila...'}`
      );
    } finally {
      this.isProcessingStep = false;
    }
  }
}

export const autoImporterWorker = new AutoImporterEngine();
