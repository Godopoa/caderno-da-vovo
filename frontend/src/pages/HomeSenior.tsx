import React, { useState } from 'react';
import { MonetizationConfig, Recipe, UserProfile } from '../types';
import { SeniorRecipeCard } from '../components/SeniorRecipeCard';
import { AdSenseBanner } from '../components/AdSenseBanner';

interface HomeSeniorProps {
  recipes: Recipe[];
  user: UserProfile | null;
  monetization: MonetizationConfig | null;
  highContrastDark: boolean;
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onSpeakSummary: (recipe: Recipe) => void;
  onOpenVipModal: () => void;
  onOpenImporter: () => void;
  onOpenNews: () => void;
}

const CATEGORIES = [
  { label: 'Todas', icon: 'fa-border-all' },
  { label: 'Bolos e Tortas', icon: 'fa-cake-candles' },
  { label: 'Massas e Assados', icon: 'fa-pizza-slice' },
  { label: 'Sopas e Caldos', icon: 'fa-mug-hot' },
  { label: 'Doces Caseiros', icon: 'fa-cookie-bite' },
  { label: 'Chás & Saúde', icon: 'fa-leaf' },
];

export const HomeSenior: React.FC<HomeSeniorProps> = ({
  recipes,
  user,
  monetization,
  highContrastDark,
  onSelectRecipe,
  onToggleFavorite,
  onSpeakSummary,
  onOpenVipModal,
  onOpenImporter,
  onOpenNews,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [maxPrepTime, setMaxPrepTime] = useState<number | null>(null);
  const isAdmin = user?.role === 'ADMIN';

  const filtered = recipes.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todas' || r.category === selectedCategory;
    const matchesTime = !maxPrepTime || (r.prepTimeMinutes && r.prepTimeMinutes <= maxPrepTime);
    return matchesSearch && matchesCategory && matchesTime;
  });

  const recipeOfTheDay = recipes[0];

  return (
    <div className="space-y-10">
      {/* Cozy Hero Section */}
      <section
        className={`relative rounded-3xl overflow-hidden border shadow-md ${
          highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/90'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 space-y-5">
            <div className="inline-flex items-center gap-2 bg-rose-50 text-[#C83E5B] border border-rose-200 px-3.5 py-1.5 rounded-full text-xs font-bold">
              <i className="fa-solid fa-heart" /> Portal Oficial de Receitas Caseiras & Acessíveis
            </div>

            <h2
              className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight ${
                highContrastDark ? 'text-white' : 'text-stone-800'
              }`}
            >
              O carinho da cozinha da{' '}
              <span className="text-[#C83E5B] underline decoration-rose-200 decoration-wavy underline-offset-4">
                Vovó Helena
              </span>{' '}
              em cada receita.
            </h2>

            <p
              className={`text-base sm:text-lg leading-relaxed max-w-2xl ${
                highContrastDark ? 'text-stone-300' : 'text-stone-600'
              }`}
            >
              Letras confortáveis, leitura em voz alta passo a passo, calculadora automática de porções e centenas de receitas testadas pela nossa comunidade.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl pt-1">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-lg" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Procure por bolo de fubá, lasanha, canja, pudim..."
                className={`w-full pl-12 pr-28 py-4 rounded-2xl border-2 text-base font-medium focus:outline-none focus:border-[#C83E5B] shadow-inner transition-all ${
                  highContrastDark
                    ? 'bg-stone-950 border-stone-700 text-white placeholder-stone-500'
                    : 'bg-[#F8F6F2] border-stone-200 text-stone-800 placeholder-stone-400 focus:bg-white'
                }`}
              />
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-300"
                >
                  Limpar
                </button>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 absolute right-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#C83E5B] text-white text-xs font-bold">
                  <i className="fa-solid fa-sparkles" /> Buscar
                </span>
              )}
            </div>

            {/* Action Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onOpenNews}
                className="px-4 py-2.5 rounded-xl bg-[#1E7E5A] hover:bg-emerald-800 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <i className="fa-solid fa-newspaper" /> Jornalzinho & Dicas da Vovó
              </button>

              {!user?.isVip && (
                <button
                  onClick={onOpenVipModal}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-sm font-bold flex items-center gap-2 transition-all"
                >
                  <i className="fa-solid fa-crown text-amber-500" /> Conhecer Clube VIP Sem Anúncios
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={onOpenImporter}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  <i className="fa-solid fa-cloud-arrow-down text-amber-400" /> Importador TudoGostoso (Admin)
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 h-64 sm:h-80 lg:h-full relative overflow-hidden bg-rose-50">
            <img
              src="/images/hero-vovo.jpg"
              alt="Vovó Helena sorrindo com um bolo caseiro quentinho"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-white lg:via-transparent lg:to-transparent" />
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-stone-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1E7E5A] text-white flex items-center justify-center font-bold">
                <i className="fa-solid fa-volume-high" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-stone-800">Narração por Voz</p>
                <p className="text-[11px] text-stone-500">Em todas as receitas e artigos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Recipe of the Day */}
      {recipeOfTheDay && !search && selectedCategory === 'Todas' && (
        <section className="bg-gradient-to-r from-[#1E7E5A] to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <i className="fa-solid fa-award text-amber-300" /> Destaque Especial de Hoje
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold">{recipeOfTheDay.title}</h3>
            <p className="text-emerald-50 text-sm sm:text-base line-clamp-2">
              {recipeOfTheDay.description || 'Uma receita tradicional testada e aprovada com passo a passo narrado em voz alta.'}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-emerald-100">
              <span><i className="fa-regular fa-clock mr-1" /> {recipeOfTheDay.prepTimeMinutes || 40} min</span>
              <span><i className="fa-solid fa-utensils mr-1" /> {recipeOfTheDay.servings || '8 porções'}</span>
              <span><i className="fa-solid fa-star text-amber-300 mr-1" /> {recipeOfTheDay.rating?.toFixed(1) || '5.0'}</span>
            </div>
          </div>
          <button
            onClick={() => onSelectRecipe(recipeOfTheDay)}
            className="w-full md:w-auto shrink-0 px-6 py-4 rounded-2xl bg-white text-[#1E7E5A] hover:bg-emerald-50 font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <i className="fa-solid fa-book-open" /> Ver Receita do Dia
          </button>
        </section>
      )}

      {/* Category & Quick Prep Time Filters */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`px-4 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap flex items-center gap-2 transition-all ${
                  active
                    ? 'bg-[#C83E5B] text-white shadow-sm'
                    : highContrastDark
                    ? 'bg-stone-900 text-stone-200 border border-stone-700 hover:border-rose-400'
                    : 'bg-white text-stone-700 border border-stone-200/90 hover:border-rose-300 hover:text-[#C83E5B]'
                }`}
              >
                <i className={`fa-solid ${cat.icon}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Time Filter */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Tempo:</span>
          {[
            { label: 'Qualquer', val: null },
            { label: 'Até 30 min', val: 30 },
            { label: 'Até 45 min', val: 45 },
          ].map((t) => (
            <button
              key={t.label}
              onClick={() => setMaxPrepTime(t.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                maxPrepTime === t.val
                  ? 'bg-[#1E7E5A] text-white'
                  : highContrastDark
                  ? 'bg-stone-900 text-stone-300 border border-stone-700'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Google AdSense Slot (Automatically hidden for VIP members) */}
      <AdSenseBanner
        config={monetization}
        user={user}
        slotType="infeed"
        onOpenVipModal={onOpenVipModal}
      />

      {/* Recipe Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className={`text-2xl font-extrabold flex items-center gap-2.5 ${
                highContrastDark ? 'text-white' : 'text-stone-800'
              }`}
            >
              <i className="fa-solid fa-utensils text-[#C83E5B]" />
              {selectedCategory === 'Todas' ? 'Receitas Caseiras do Caderno' : selectedCategory}
            </h3>
            <p className="text-sm text-stone-500">
              Exibindo {filtered.length} {filtered.length === 1 ? 'receita' : 'receitas'} prontas para cozinhar
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div
            className={`rounded-3xl p-12 text-center border space-y-4 ${
              highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#C83E5B] flex items-center justify-center text-3xl mx-auto">
              <i className="fa-solid fa-magnifying-glass" />
            </div>
            <h4 className="text-xl font-bold">Nenhuma receita encontrada com esse filtro</h4>
            <p className="text-stone-500 max-w-md mx-auto text-sm">
              Tente limpar a busca ou escolher outra categoria para ver todas as delícias da Vovó.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('Todas');
                setMaxPrepTime(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#C83E5B] text-white font-bold text-sm"
            >
              Mostrar Todas as Receitas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((recipe) => (
              <SeniorRecipeCard
                key={recipe.id}
                recipe={recipe}
                onOpen={onSelectRecipe}
                onToggleFavorite={onToggleFavorite}
                onSpeakSummary={onSpeakSummary}
                highContrastDark={highContrastDark}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
