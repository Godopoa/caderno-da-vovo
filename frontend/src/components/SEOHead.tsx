import React, { useEffect } from 'react';
import { Recipe } from '../types';

interface SEOHeadProps {
  title?: string;
  description?: string;
  recipe?: Recipe | null;
}

/**
 * Gerenciador Completo de SEO e Integração Google Search (Meta Tags, OpenGraph e Schema.org JSON-LD Rich Snippets)
 */
export const SEOHead: React.FC<SEOHeadProps> = ({ title, description, recipe }) => {
  useEffect(() => {
    const pageTitle = recipe
      ? `${recipe.title} — Receita Fácil Passo a Passo | Caderno da Vovó`
      : title || 'Caderno da Vovó — Portal de Receitas Afetivas, Voz Guiada & Clube VIP';

    const pageDesc = recipe
      ? recipe.description ||
        `Aprenda a fazer ${recipe.title} com ${recipe.ingredients.length} ingredientes e modo de preparo falado em voz alta no Caderno da Vovó.`
      : description ||
        'Receitas caseiras da vovó testadas com carinho, leitura em voz alta passo a passo, calculadora de porções e parceria TudoGostoso.';

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

    setMetaTag('meta[name="description"]', 'name', 'description', pageDesc);
    setMetaTag(
      'meta[name="keywords"]',
      'name',
      'keywords',
      recipe
        ? `${recipe.title}, ${recipe.category}, receita da vovó, como fazer ${recipe.title}, tudogostoso`
        : 'receitas da vovó, bolo caseiro, receitas fáceis, culinária afetiva, tudogostoso'
    );
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', pageTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', pageDesc);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', recipe ? 'article' : 'website');
    if (recipe?.imageUrl) {
      setMetaTag('meta[property="og:image"]', 'property', 'og:image', recipe.imageUrl);
    }

    // Injeta dados estruturados JSON-LD (Schema.org/Recipe ou WebSite SearchAction) para o Google Search
    let scriptEl = document.getElementById('seo-json-ld') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'seo-json-ld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    if (recipe) {
      const jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Recipe',
        name: recipe.title,
        image: [recipe.imageUrl || 'https://cadernodavovo.com.br/images/logo-vovo.jpg'],
        author: {
          '@type': 'Person',
          name: 'Vovó Helena',
        },
        description: pageDesc,
        prepTime: `PT${recipe.prepTimeMinutes || 35}M`,
        totalTime: `PT${recipe.prepTimeMinutes || 35}M`,
        recipeYield: recipe.servings || '6 porções',
        recipeCategory: recipe.category,
        recipeCuisine: 'Brasileira Caseira',
        nutrition: {
          '@type': 'NutritionInformation',
          calories: `${recipe.caloriesPerServ || 240} kcal`,
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(recipe.rating || 4.9),
          ratingCount: String((recipe.comments?.length || 0) + 18),
        },
        recipeIngredient: recipe.ingredients.map((i) => i.rawText),
        recipeInstructions: recipe.steps.map((s) => ({
          '@type': 'HowToStep',
          position: s.stepNumber,
          text: s.instruction,
        })),
      };
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else {
      const siteJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Caderno da Vovó',
        url: window.location.origin,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${window.location.origin}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };
      scriptEl.textContent = JSON.stringify(siteJsonLd);
    }
  }, [title, description, recipe]);

  return null;
};
