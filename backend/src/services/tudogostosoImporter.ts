import * as cheerio from 'cheerio';

export interface ImportedRecipeData {
  title: string;
  slug: string;
  sourceUrl: string;
  imageUrl?: string;
  category: string;
  prepTimeMinutes?: number;
  servings?: string;
  difficulty?: string;
  ingredients: { section: string; rawText: string; orderIndex: number }[];
  steps: { section: string; stepNumber: number; instruction: string; timerSeconds?: number }[];
}

export interface DiscoveredRecipeLink {
  title: string;
  url: string;
  imageUrl?: string;
}

/**
 * Normaliza abreviações culinárias para que a leitura em voz alta (TTS) para idosos soe natural e clara.
 */
export function normalizeForSeniorVoice(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, 'e')
    .replace(/\bcol\.\s*\(?sopa\)?/gi, 'colher de sopa')
    .replace(/\bc\.\s*\(?sopa\)?/gi, 'colher de sopa')
    .replace(/\bcol\.\s*\(?ch[aá]\)?/gi, 'colher de chá')
    .replace(/\bc\.\s*\(?ch[aá]\)?/gi, 'colher de chá')
    .replace(/\bcol\.\s*\(?sobremesa\)?/gi, 'colher de sobremesa')
    .replace(/\bcol\.\s*\(?caf[eé]\)?/gi, 'colher de café')
    .replace(/\bx[ií]c\.\s*\(?ch[aá]\)?/gi, 'xícara de chá')
    .replace(/\bx[ií]c\./gi, 'xícara')
    .replace(/\bq\.b\./gi, 'a gosto')
    .replace(/\baprox\./gi, 'aproximadamente')
    .replace(/\bunid\./gi, 'unidades')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta automaticamente menções de tempo em um passo (ex: "asse por 40 minutos") e retorna em segundos.
 */
export function detectStepTimerSeconds(instruction: string): number | undefined {
  const match = instruction.match(/(\d+)\s*(?:a\s*\d+\s*)?(minutos?|min|horas?|h|segundos?|seg)\b/i);
  if (!match) return undefined;
  const value = parseInt(match[1], 10);
  if (isNaN(value) || value <= 0) return undefined;
  const unit = match[2].toLowerCase();
  if (unit.startsWith('h')) return value * 3600;
  if (unit.startsWith('s')) return value;
  return value * 60;
}

/**
 * Converte duração ISO 8601 (ex: PT1H30M, PT45M) para minutos inteiros.
 */
function parseIsoDurationToMinutes(iso?: string): number | undefined {
  if (!iso || typeof iso !== 'string') return undefined;
  const daysMatch = iso.match(/(\d+)D/i);
  const hoursMatch = iso.match(/(\d+)H/i);
  const minsMatch = iso.match(/(\d+)M/i);
  const days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
  const total = days * 1440 + hours * 60 + mins;
  return total > 0 ? total : undefined;
}

/**
 * Mapeia categorias do TudoGostoso para categorias amigáveis para idosos
 */
function mapSeniorCategory(rawCategory?: string, title?: string): string {
  const text = `${rawCategory || ''} ${title || ''}`.toLowerCase();
  if (text.includes('bolo') || text.includes('torta')) return 'Bolos e Tortas';
  if (text.includes('sopa') || text.includes('caldo') || text.includes('canja') || text.includes('creme')) return 'Sopas e Caldos';
  if (text.includes('doce') || text.includes('pudim') || text.includes('sobremesa') || text.includes('mousse') || text.includes('pavê') || text.includes('arroz doce')) return 'Doces Caseiros';
  if (text.includes('pão') || text.includes('pao') || text.includes('lanche') || text.includes('biscoito') || text.includes('bolinho') || text.includes('salgado')) return 'Lanches e Pães';
  if (text.includes('carne') || text.includes('frango') || text.includes('peixe') || text.includes('almoço') || text.includes('macarrão') || text.includes('lasanha') || text.includes('arroz') || text.includes('feijão')) return 'Almoço de Família';
  return 'Receitas Caseiras';
}

/**
 * Cria um slug limpo e único a partir do título
 */
export function createSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Importa e estrutura uma receita diretamente de uma URL do TudoGostoso (tudogostoso.com.br)
 */
export async function importFromTudoGostoso(url: string): Promise<ImportedRecipeData> {
  const cleanUrl = url.trim();
  if (!cleanUrl.includes('tudogostoso.com.br')) {
    throw new Error('Por favor, informe um link válido do site tudogostoso.com.br');
  }

  const response = await fetch(cleanUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Não foi possível acessar a página do TudoGostoso (Status HTTP ${response.status}).`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  let recipeJsonLd: any = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const rawJson = $(el).html();
      if (!rawJson) return;
      const parsed = JSON.parse(rawJson);
      const candidates = Array.isArray(parsed)
        ? parsed
        : parsed['@graph'] && Array.isArray(parsed['@graph'])
        ? parsed['@graph']
        : [parsed];

      for (const item of candidates) {
        if (!item) continue;
        const type = item['@type'];
        if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
          recipeJsonLd = item;
          break;
        }
      }
    } catch {
      // Ignora blocos JSON-LD inválidos
    }
  });

  const rawTitle =
    recipeJsonLd?.name ||
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    'Receita Especial TudoGostoso';

  const title = rawTitle.replace(/\s*-\s*TudoGostoso.*$/i, '').replace(/\s+/g, ' ').trim();
  const slug = createSlug(title);

  let imageUrl: string | undefined;
  if (recipeJsonLd?.image) {
    if (typeof recipeJsonLd.image === 'string') imageUrl = recipeJsonLd.image;
    else if (Array.isArray(recipeJsonLd.image)) {
      const first = recipeJsonLd.image[0];
      imageUrl = typeof first === 'string' ? first : first?.url;
    } else if (typeof recipeJsonLd.image === 'object' && recipeJsonLd.image.url) {
      imageUrl = recipeJsonLd.image.url;
    }
  }
  if (!imageUrl) {
    imageUrl = $('meta[property="og:image"]').attr('content') || undefined;
  }

  const prepTimeMinutes =
    parseIsoDurationToMinutes(recipeJsonLd?.totalTime) ||
    parseIsoDurationToMinutes(recipeJsonLd?.cookTime) ||
    parseIsoDurationToMinutes(recipeJsonLd?.prepTime) ||
    35;

  let servings: string | undefined;
  if (recipeJsonLd?.recipeYield) {
    servings = Array.isArray(recipeJsonLd.recipeYield)
      ? String(recipeJsonLd.recipeYield[0])
      : String(recipeJsonLd.recipeYield);
  }
  if (!servings) {
    servings = '6 porções';
  } else if (/^\d+$/.test(servings.trim())) {
    servings = `${servings.trim()} porções`;
  }

  const rawCategory = Array.isArray(recipeJsonLd?.recipeCategory)
    ? recipeJsonLd.recipeCategory[0]
    : recipeJsonLd?.recipeCategory;
  const category = mapSeniorCategory(rawCategory, title);

  // 1. Extração de Ingredientes
  const rawIngredients: string[] = [];
  if (Array.isArray(recipeJsonLd?.recipeIngredient) && recipeJsonLd.recipeIngredient.length > 0) {
    for (const ing of recipeJsonLd.recipeIngredient) {
      if (typeof ing === 'string' && ing.trim()) {
        rawIngredients.push(ing.trim());
      }
    }
  }

  if (rawIngredients.length === 0) {
    $('[class*="ingredient"] li, .p-ingredient, [data-cy*="ingredient"]').each((_, el) => {
      const txt = $(el).text().replace(/\s+/g, ' ').trim();
      if (txt && txt.length > 2) rawIngredients.push(txt);
    });
  }

  const ingredients = rawIngredients.map((item, idx) => ({
    section: 'Principal',
    rawText: normalizeForSeniorVoice(item),
    orderIndex: idx + 1,
  }));

  // 2. Extração de Modo de Preparo
  const rawSteps: string[] = [];
  if (Array.isArray(recipeJsonLd?.recipeInstructions)) {
    for (const step of recipeJsonLd.recipeInstructions) {
      if (typeof step === 'string' && step.trim()) {
        rawSteps.push(step.trim());
      } else if (step?.text && typeof step.text === 'string') {
        rawSteps.push(step.text.trim());
      } else if (Array.isArray(step?.itemListElement)) {
        for (const sub of step.itemListElement) {
          if (typeof sub === 'string' && sub.trim()) rawSteps.push(sub.trim());
          else if (sub?.text) rawSteps.push(String(sub.text).trim());
        }
      }
    }
  } else if (typeof recipeJsonLd?.recipeInstructions === 'string') {
    rawSteps.push(
      ...recipeJsonLd.recipeInstructions
        .split(/\r?\n+/)
        .map((s: string) => s.trim())
        .filter(Boolean)
    );
  }

  if (rawSteps.length === 0) {
    $('[class*="instruction"] li, [class*="instruction"] p, .e-instructions p').each((_, el) => {
      const txt = $(el).text().replace(/\s+/g, ' ').trim();
      if (txt && txt.length > 5) rawSteps.push(txt);
    });
  }

  const steps = rawSteps.map((txt, idx) => {
    // Remove numeração duplicada no início e tags HTML
    const stripped = txt
      .replace(/<[^>]*>/g, '')
      .replace(/^\d+[\.\)\-\s]+/, '')
      .trim();
    const cleanInstruction = normalizeForSeniorVoice(stripped);
    return {
      section: 'Preparo',
      stepNumber: idx + 1,
      instruction: cleanInstruction,
      timerSeconds: detectStepTimerSeconds(cleanInstruction),
    };
  });

  if (ingredients.length === 0 && steps.length === 0) {
    throw new Error('Não encontramos ingredientes ou modo de preparo nesta página do TudoGostoso.');
  }

  return {
    title,
    slug,
    sourceUrl: cleanUrl,
    imageUrl,
    category,
    prepTimeMinutes,
    servings,
    difficulty: prepTimeMinutes && prepTimeMinutes > 60 ? 'Médio' : 'Fácil',
    ingredients,
    steps,
  };
}

/**
 * Busca receitas no TudoGostoso por palavra-chave (ex: "bolo de milho", "canja")
 * e retorna os links encontrados para importação rápida com 1 clique.
 */
export async function discoverTudoGostosoRecipes(query: string): Promise<DiscoveredRecipeLink[]> {
  const encoded = encodeURIComponent(query.trim());
  const searchUrl = `https://www.tudogostoso.com.br/busca?q=${encoded}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });

    if (!response.ok) {
      return getCuratedTudoGostosoSuggestions(query);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: DiscoveredRecipeLink[] = [];
    const seen = new Set<string>();

    $('a[href*="/receita/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const fullUrl = href.startsWith('http') ? href : `https://www.tudogostoso.com.br${href}`;
      if (!fullUrl.includes('/receita/') || seen.has(fullUrl)) return;

      const textTitle =
        $(el).attr('title') ||
        $(el).find('h2, h3, h4, span').first().text().trim() ||
        $(el).text().replace(/\s+/g, ' ').trim();

      if (!textTitle || textTitle.length < 4) return;

      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      seen.add(fullUrl);
      results.push({
        title: textTitle,
        url: fullUrl,
        imageUrl: img,
      });
    });

    if (results.length > 0) {
      return results.slice(0, 12);
    }
  } catch {
    // Fallback para sugestões curadas do TudoGostoso se o buscador bloquear scraping direto
  }

  return getCuratedTudoGostosoSuggestions(query);
}

/**
 * Catálogo curado de URLs reais e clássicas do TudoGostoso para importação rápida em 1 clique
 */
export function getCuratedTudoGostosoSuggestions(query?: string): DiscoveredRecipeLink[] {
  const catalog: DiscoveredRecipeLink[] = [
    {
      title: 'Bolo de Cenoura Original TudoGostoso',
      url: 'https://www.tudogostoso.com.br/receita/23-bolo-de-cenoura.html',
    },
    {
      title: 'Pudim de Leite Condensado Tradicional',
      url: 'https://www.tudogostoso.com.br/receita/31593-pudim-de-leite-condensado.html',
    },
    {
      title: 'Bolo de Fubá Simples e Fofinho',
      url: 'https://www.tudogostoso.com.br/receita/21560-bolo-de-fuba-simples.html',
    },
    {
      title: 'Pão Caseiro Fácil da Vovó',
      url: 'https://www.tudogostoso.com.br/receita/178357-pao-caseiro.html',
    },
    {
      title: 'Panqueca de Carne Moída Clássica',
      url: 'https://www.tudogostoso.com.br/receita/760-panqueca-de-carne-moida.html',
    },
    {
      title: 'Fricassê de Frango Cremoso',
      url: 'https://www.tudogostoso.com.br/receita/10254-fricasse-de-frango.html',
    },
    {
      title: 'Arroz Doce Cremoso com Canela',
      url: 'https://www.tudogostoso.com.br/receita/10744-arroz-doce-cremoso.html',
    },
    {
      title: 'Bolinho de Chuva Tradicional com Canela',
      url: 'https://www.tudogostoso.com.br/receita/76049-bolinho-de-chuva.html',
    },
  ];

  if (!query || !query.trim()) return catalog;
  const q = query.toLowerCase().trim();
  const filtered = catalog.filter((item) => item.title.toLowerCase().includes(q));
  return filtered.length > 0 ? filtered : catalog;
}
