import React from 'react';
import { Recipe } from '../types';

interface SeniorRecipeCardProps {
  recipe: Recipe;
  onOpenRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onSpeakSummary: (recipe: Recipe) => void;
  highContrastDark: boolean;
}

export const SeniorRecipeCard: React.FC<SeniorRecipeCardProps> = ({
  recipe,
  onOpenRecipe,
  onToggleFavorite,
  onSpeakSummary,
  highContrastDark,
}) => {
  const defaultImg =
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=900&q=80';

  return (
    <article
      className={`group rounded-3xl border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
        highContrastDark
          ? 'bg-stone-900 border-stone-800 text-stone-100'
          : 'bg-white border-amber-200/80 text-[#2D241E]'
      }`}
    >
      <div>
        {/* Foto da Receita com Efeito Zoom Suave e Badges Fofas */}
        <div
          onClick={() => onOpenRecipe(recipe)}
          className="relative h-52 w-full bg-stone-100 overflow-hidden cursor-pointer"
        >
          <img
            src={recipe.imageUrl || defaultImg}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImg;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Categoria */}
          <span className="absolute top-3 left-3 bg-white/95 text-amber-900 font-bold px-3 py-1 rounded-full text-xs shadow-sm flex items-center gap-1.5">
            <i className="fa-solid fa-utensils text-amber-600 text-[10px]" />
            {recipe.category}
          </span>

          {/* Selo VIP se for receita exclusiva */}
          {recipe.isVipOnly && (
            <span className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold px-3 py-1 rounded-full text-xs shadow flex items-center gap-1.5">
              <i className="fa-solid fa-crown text-amber-100" />
              <span>Receita VIP da Vovó</span>
            </span>
          )}

          {/* Nota e Visualizações */}
          <div className="absolute bottom-3 right-3 bg-black/65 backdrop-blur-sm text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <i className="fa-solid fa-star text-amber-400" />
            <span>{(recipe.rating || 4.9).toFixed(1)}</span>
          </div>

          {/* Botão Favoritar Delicado */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(recipe);
            }}
            title={recipe.isFavorite ? 'Remover das favoritas' : 'Salvar no meu caderninho'}
            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition transform active:scale-90 ${
              recipe.isFavorite
                ? 'bg-rose-600 text-white'
                : 'bg-white/90 text-stone-600 hover:text-rose-600'
            }`}
          >
            <i className={`${recipe.isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart text-base`} />
          </button>
        </div>

        {/* Corpo do Card */}
        <div className="p-5">
          <h3
            onClick={() => onOpenRecipe(recipe)}
            className="font-serif-vovo text-xl font-bold leading-snug mb-2 cursor-pointer group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors line-clamp-2"
          >
            {recipe.title}
          </h3>

          {recipe.description && (
            <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mb-3">
              {recipe.description}
            </p>
          )}

          {/* Metadados delicados */}
          <div className="flex items-center justify-between text-xs font-bold text-stone-600 dark:text-stone-300 py-2.5 px-3 rounded-2xl bg-amber-50/70 dark:bg-stone-800/70 border border-amber-100 dark:border-stone-700">
            <span className="flex items-center gap-1.5">
              <i className="fa-regular fa-clock text-amber-700 dark:text-amber-400" />
              <span>{recipe.prepTimeMinutes || 35} min</span>
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-bowl-food text-emerald-700 dark:text-emerald-400" />
              <span>{recipe.servings || '6 porções'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-list-check text-orange-600" />
              <span>{recipe.ingredients.length} itens</span>
            </span>
          </div>

          {recipe.chefTip && (
            <div className="mt-3 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200 bg-amber-100/50 dark:bg-stone-800 px-3 py-2 rounded-xl border border-amber-200/60">
              <i className="fa-solid fa-wand-magic-sparkles text-amber-600 mt-0.5 shrink-0" />
              <span className="line-clamp-1 font-semibold">{recipe.chefTip}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé do Card */}
      <div className="px-5 pb-5 pt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSpeakSummary(recipe)}
          title="Ouvir resumo da receita em voz alta"
          className="px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-900 dark:text-amber-300 hover:bg-amber-100/70 text-xs font-bold flex items-center gap-1.5 transition"
        >
          <i className="fa-solid fa-volume-high" />
          <span>Ouvir</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenRecipe(recipe)}
          className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-amber-800 hover:bg-amber-900 text-white flex items-center justify-center gap-2 shadow-sm transition"
        >
          <span>Ver Receita Completa</span>
          <i className="fa-solid fa-arrow-right text-xs" />
        </button>
      </div>
    </article>
  );
};
