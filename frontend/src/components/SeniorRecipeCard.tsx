import React from 'react';
import { Recipe } from '../types';

interface SeniorRecipeCardProps {
  recipe: Recipe;
  onOpen: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onSpeakSummary?: (recipe: Recipe) => void;
  highContrastDark?: boolean;
}

export const SeniorRecipeCard: React.FC<SeniorRecipeCardProps> = ({
  recipe,
  onOpen,
  onToggleFavorite,
  onSpeakSummary,
  highContrastDark,
}) => {
  const commentsCount = recipe.comments?.length || 0;

  return (
    <article
      onClick={() => onOpen(recipe)}
      className={`group rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
        highContrastDark
          ? 'bg-stone-900 border-stone-800 text-stone-100'
          : 'bg-white border-stone-200/80 text-stone-800'
      }`}
    >
      <div>
        <div className="relative h-52 w-full overflow-hidden bg-stone-100">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-stone-300">
              <i className="fa-solid fa-cake-candles" />
            </div>
          )}

          {/* Category & VIP Pill */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="bg-white/95 backdrop-blur-sm text-stone-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-stone-200/60 flex items-center gap-1.5">
              <i className="fa-solid fa-tag text-[#C83E5B]" /> {recipe.category}
            </span>
            {recipe.isVipOnly && (
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-1">
                <i className="fa-solid fa-crown" /> VIP
              </span>
            )}
          </div>

          {/* Favorite Heart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(recipe);
            }}
            aria-label={recipe.isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 ${
              recipe.isFavorite
                ? 'bg-[#C83E5B] text-white'
                : 'bg-white/90 text-stone-600 hover:text-[#C83E5B]'
            }`}
          >
            <i className={`${recipe.isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart text-lg`} />
          </button>

          {/* Rating Badge */}
          <div className="absolute bottom-3 left-3 bg-stone-900/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
            <i className="fa-solid fa-star text-amber-400" />
            <span>{recipe.rating?.toFixed(1) || '4.9'}</span>
            {commentsCount > 0 && (
              <span className="text-stone-300 font-normal">({commentsCount})</span>
            )}
          </div>

          {recipe.caloriesPerServ && (
            <div className="absolute bottom-3 right-3 bg-[#1E7E5A]/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
              <i className="fa-solid fa-fire-flame-curved text-amber-200" />
              <span>{recipe.caloriesPerServ} kcal</span>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-xl font-bold group-hover:text-[#C83E5B] transition-colors line-clamp-2 leading-snug mb-2">
            {recipe.title}
          </h3>
          {recipe.description && (
            <p
              className={`text-sm line-clamp-2 mb-4 leading-relaxed ${
                highContrastDark ? 'text-stone-400' : 'text-stone-600'
              }`}
            >
              {recipe.description}
            </p>
          )}
        </div>
      </div>

      <div
        className={`px-5 pb-5 pt-3 border-t flex items-center justify-between text-xs font-semibold ${
          highContrastDark ? 'border-stone-800 text-stone-300' : 'border-stone-100 text-stone-600'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {recipe.prepTimeMinutes && (
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                highContrastDark ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-700'
              }`}
            >
              <i className="fa-regular fa-clock text-[#C83E5B]" /> {recipe.prepTimeMinutes} min
            </span>
          )}
          {recipe.servings && (
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                highContrastDark ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-700'
              }`}
            >
              <i className="fa-solid fa-utensils text-[#1E7E5A]" /> {recipe.servings}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onSpeakSummary && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSpeakSummary(recipe);
              }}
              title="Ouvir resumo da receita"
              className="w-8 h-8 rounded-full bg-emerald-50 text-[#1E7E5A] hover:bg-[#1E7E5A] hover:text-white flex items-center justify-center transition-colors"
            >
              <i className="fa-solid fa-volume-high" />
            </button>
          )}
          <span className="text-[#C83E5B] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Abrir <i className="fa-solid fa-arrow-right" />
          </span>
        </div>
      </div>
    </article>
  );
};
