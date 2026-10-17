import React, { useEffect } from 'react';
import { Recipe } from '../types';
import { NavTab } from './AccessibilityBar';

interface SEOHeadProps {
  title?: string;
  description?: string;
  activeTab?: NavTab;
  recipe?: Recipe | null;
  totalRecipesCount?: number;
}

const HUB_SEO_METADATA: Record<
  string,
  {
    title: string;
    description: string;
    keywords: string;
    breadcrumbLabel: string;
    faqs?: Array<{ q: string; a: string }>;
  }
> = {
  home: {
    title: 'Caderno da Vovó — Receitas Caseiras, Economia do Lar, Saúde Sênior & Passatempos',
    description:
      'Receitas caseiras da vovó testadas com carinho, leitura em voz alta passo a passo com a Vovó Helena, lembrete de remédios, diário de pressão, cardápio semanal e dicas do lar.',
    keywords:
      'receitas da vovó, bolo caseiro, receitas fáceis, culinária afetiva, modo cozinha por voz, dicas para donas de casa, saúde idosos, tudogostoso',
    breadcrumbLabel: 'Início & Receitas',
  },
  cooking: {
    title: 'Estúdio Modo Cozinha Guiado por Voz — Caderno da Vovó',
    description:
      'Cozinhe sem sujar as mãos com o Modo Cozinha da Vovó Helena: letras gigantes, leitura em voz alta feminina acolhedora, multiplicador de porções e timer sonoro inteligente.',
    keywords:
      'modo cozinha guiado por voz, receita falada, timer de cozinha online, dobrar receita, receitas passo a passo para idosos',
    breadcrumbLabel: 'Modo Cozinha Guiado',
  },
  economy: {
    title: 'Economia do Lar: Cardápio da Semana, Lista de Feira, Contas da Casa & Faça e Venda — Caderno da Vovó',
    description:
      'Monte o cardápio semanal da família, gere a lista de compras consolidada para o WhatsApp, controle as contas do mês (água, luz, gás) e calcule o preço de venda de bolos e doces caseiros.',
    keywords:
      'cardápio da semana, lista de feira whatsapp, controle de contas da casa, calculadora faça e venda, conversor de medidas culinárias, o que tem na geladeira',
    breadcrumbLabel: 'Economia, Feira & Contas',
    faqs: [
      {
        q: 'Como calcular o preço de venda de bolos e doces caseiros?',
        a: 'Some o custo dos ingredientes, acrescente 20% de gastos invisíveis (gás, luz, água e detergente), some as embalagens e aplique sua margem de lucro na Calculadora Faça e Venda da Vovó.',
      },
      {
        q: 'Quantas gramas tem 1 xícara de chá de farinha de trigo ou açúcar?',
        a: 'No Conversor da Vovó, 1 xícara de chá padrão (240 ml) equivale a 120g de farinha de trigo, 180g de açúcar refinado ou 200g de manteiga.',
      },
    ],
  },
  health: {
    title: 'Saúde Sênior: Lembrete de Remédios, Pressão Arterial, Glicemia, Cartão SOS & Chás — Caderno da Vovó',
    description:
      'Cuide da sua saúde todos os dias: caixinha de remédios com alerta sonoro, anotador de pressão arterial e glicemia com relatório para o médico, cartão SOS de emergência, hidratômetro e chás naturais.',
    keywords:
      'lembrete de remédios, controle de pressão arterial, tabela de glicemia, cartão sos emergência idoso, chás medicinais da vovó, beber água idoso',
    breadcrumbLabel: 'Saúde, Pressão, Remédios & Chás',
    faqs: [
      {
        q: 'Qual é a pressão arterial considerada normal no dia a dia?',
        a: 'Valores em torno de 12 por 8 (120/80 mmHg) em repouso são considerados ótimos. Anote diariamente no Diário da Vovó para mostrar ao seu médico.',
      },
      {
        q: 'Como não esquecer de tomar os remédios de uso contínuo?',
        a: 'Use a Caixinha de Remédios da Vovó com alerta por voz e crie sua conta gratuita para deixar seus horários salvos permanentemente na nuvem.',
      },
    ],
  },
  crafts: {
    title: 'Sabedoria do Lar: SOS Tira-Manchas, Safra do Mês, Horta em Vasos, Crochê & Aniversários — Caderno da Vovó',
    description:
      'Guia seguro de limpeza caseira e tira-manchas naturais, calendário de frutas e verduras da época mais baratas na feira, horta em vasos, receitas de crochê e caderninho de aniversários da família.',
    keywords:
      'como tirar mancha de vinho, tira manchas caseiro, frutas da época, como cuidar de hortelã e manjericão, bico de crochê pano de prato, aniversários da família',
    breadcrumbLabel: 'Casa, Horta, Crochê & Aniversários',
    faqs: [
      {
        q: 'Pode misturar água sanitária (cândida) com vinagre ou álcool?',
        a: 'Nunca misture água sanitária com vinagre, álcool, amônia ou desinfetantes, pois a reação libera gases tóxicos para os pulmões. Use bicarbonato e vinagre separadamente.',
      },
    ],
  },
  memory: {
    title: 'Passatempos da Vovó: Jogo da Memória Culinária, Quiz com Voz & Mensagens de Bom Dia WhatsApp — Caderno da Vovó',
    description:
      'Exercite a memória e a mente todos os dias com o Jogo da Memória da Cozinha da Vovó, responda ao Quiz de Sabedoria narrado por voz e envie cartões lindos de Bom Dia no WhatsApp da família.',
    keywords:
      'jogo da memória para idosos, passatempos memória ativa, quiz culinário, mensagens de bom dia vovó whatsapp, exercícios para o cérebro',
    breadcrumbLabel: 'Passatempos da Memória & Bom Dia',
  },
  cookbook: {
    title: 'Gerador de Livro de Receitas da Família em PDF — Caderno da Vovó',
    description:
      'Monte, personalize a dedicatória e imprima em PDF o Livro de Ouro de Receitas da sua Família para eternizar o tempero de geração em geração.',
    keywords:
      'livro de receitas da família pdf, imprimir caderno de receitas, receitas de família para netos',
    breadcrumbLabel: 'Livro de Receitas da Família PDF',
  },
  news: {
    title: 'Jornalzinho da Vovó: Dicas de Cozinha, Bem-Estar & Histórias de Família — Caderno da Vovó',
    description:
      'Matérias curtinhas, segredos de confeitaria, truques que salvam receitas e dicas de chás com leitura em voz alta.',
    keywords:
      'jornalzinho da vovó, dicas de cozinha, truques culinários, histórias de família',
    breadcrumbLabel: 'Jornalzinho & Dicas',
  },
};

/**
 * Motor SEO Omni-Search v6.0 (Google Search, Google Discover, Microsoft Bing, IndexNow, Yahoo, DuckDuckGo, OpenGraph & Schema.org @graph)
 */
export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  activeTab = 'home',
  recipe,
}) => {
  useEffect(() => {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://cadernodavovo.com.br';

    const hubMeta = HUB_SEO_METADATA[activeTab] || HUB_SEO_METADATA.home;

    const pageTitle = recipe
      ? `${recipe.title} — Receita Fácil Passo a Passo | Caderno da Vovó`
      : title || hubMeta.title;

    const pageDesc = recipe
      ? recipe.description ||
        `Aprenda a fazer ${recipe.title} (${recipe.category}) com ${recipe.ingredients.length} ingredientes, calculadora de porções e modo de preparo narrado em voz alta pela Vovó Helena.`
      : description || hubMeta.description;

    const pageKeywords = recipe
      ? `${recipe.title}, ${recipe.category}, receita de ${recipe.title.toLowerCase()}, como fazer ${recipe.title.toLowerCase()}, receita da vovó, culinária caseira, tudogostoso`
      : hubMeta.keywords;

    const canonicalUrl = recipe
      ? `${origin}/?receita=${encodeURIComponent(recipe.slug)}`
      : activeTab && activeTab !== 'home'
      ? `${origin}/?tab=${encodeURIComponent(activeTab)}`
      : `${origin}/`;

    const imageUrl =
      recipe?.imageUrl && recipe.imageUrl.startsWith('http')
        ? recipe.imageUrl
        : `${origin}/images/logo-vovo.jpg`;

    document.title = pageTitle;

    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setLinkTag = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Canonical URL para Google, Bing e Yahoo evitarem conteúdo duplicado
    setLinkTag('canonical', canonicalUrl);

    // Meta Tags universais (Google, Bing, Yahoo, DuckDuckGo, Yandex)
    setMetaTag('meta[name="description"]', 'name', 'description', pageDesc);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', pageKeywords);
    setMetaTag(
      'meta[name="robots"]',
      'name',
      'robots',
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    setMetaTag(
      'meta[name="googlebot"]',
      'name',
      'googlebot',
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    setMetaTag(
      'meta[name="bingbot"]',
      'name',
      'bingbot',
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    setMetaTag('meta[name="DC.title"]', 'name', 'DC.title', pageTitle);
    setMetaTag('meta[name="DC.description"]', 'name', 'DC.description', pageDesc);

    // OpenGraph completo (WhatsApp, Facebook, Pinterest, LinkedIn, Bing Social)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Caderno da Vovó');
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'pt_BR');
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', pageTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', pageDesc);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', recipe ? 'article' : 'website');
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', imageUrl);
    setMetaTag(
      'meta[property="og:image:alt"]',
      'property',
      'og:image:alt',
      recipe ? `Foto da receita ${recipe.title}` : 'Caderno da Vovó — Portal de Receitas e Utilidades'
    );

    // Twitter / X Cards
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', pageDesc);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);

    // Construção do Grafo Estruturado JSON-LD (@graph) compatível com Google Rich Results e Microsoft Bing Schema
    const graphNodes: Record<string, unknown>[] = [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'Caderno da Vovó',
        url: origin,
        logo: {
          '@type': 'ImageObject',
          url: `${origin}/images/logo-vovo.jpg`,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: origin,
        name: 'Caderno da Vovó',
        inLanguage: 'pt-BR',
        publisher: { '@id': `${origin}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${origin}/?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Caderno da Vovó',
            item: origin,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: recipe ? recipe.category : hubMeta.breadcrumbLabel,
            item: recipe ? `${origin}/?categoria=${encodeURIComponent(recipe.category)}` : canonicalUrl,
          },
          ...(recipe
            ? [
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: recipe.title,
                  item: canonicalUrl,
                },
              ]
            : []),
        ],
      },
    ];

    if (recipe) {
      graphNodes.push({
        '@type': 'Recipe',
        '@id': `${canonicalUrl}#recipe`,
        mainEntityOfPage: canonicalUrl,
        name: recipe.title,
        image: [imageUrl],
        author: {
          '@type': 'Person',
          name: 'Vovó Helena',
        },
        datePublished: recipe.createdAt || new Date().toISOString(),
        description: pageDesc,
        prepTime: `PT${Math.max(10, Math.round((recipe.prepTimeMinutes || 35) * 0.4))}M`,
        cookTime: `PT${Math.max(15, Math.round((recipe.prepTimeMinutes || 35) * 0.6))}M`,
        totalTime: `PT${recipe.prepTimeMinutes || 35}M`,
        recipeYield: recipe.servings || '6 porções',
        recipeCategory: recipe.category,
        recipeCuisine: 'Brasileira Caseira',
        keywords: pageKeywords,
        nutrition: {
          '@type': 'NutritionInformation',
          calories: `${recipe.caloriesPerServ || 240} kcal`,
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(recipe.rating || 4.9),
          ratingCount: String((recipe.comments?.length || 0) + 24),
          bestRating: '5',
          worstRating: '1',
        },
        recipeIngredient: recipe.ingredients.map((i) => i.rawText),
        recipeInstructions: recipe.steps.map((s) => ({
          '@type': 'HowToStep',
          position: s.stepNumber,
          name: `Passo ${s.stepNumber}`,
          text: s.instruction,
          url: `${canonicalUrl}#passo-${s.stepNumber}`,
        })),
      });
    } else if (hubMeta.faqs && hubMeta.faqs.length > 0) {
      graphNodes.push({
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: hubMeta.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      });
    }

    let scriptEl = document.getElementById('seo-json-ld') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'seo-json-ld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    scriptEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graphNodes,
    });
  }, [title, description, activeTab, recipe]);

  return null;
};
