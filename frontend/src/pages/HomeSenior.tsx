import React, { useState } from 'react';
import { MonetizationConfig, Recipe, UserProfile } from '../types';
import { SeniorRecipeCard } from '../components/SeniorRecipeCard';
import { AdSenseBanner } from '../components/AdSenseBanner';

interface HomeSeniorProps {
  recipes: Recipe[];
  loading: boolean;
  isOffline: boolean;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  selectedFridgeItems: string[];
  onToggleFridgeItem: (item: string) => void;
  onClearFilters: () => void;
  onOpenRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onSpeakSummary: (recipe: Recipe) => void;
  onGoToImporter: () => void;
  onOpenVipModal: () => void;
  monetization: MonetizationConfig | null;
  user: UserProfile | null;
  highContrastDark: boolean;
  onlyFavorites?: boolean;
}

const CATEGORIES = [
  { id: 'Todas', label: 'Todas', icon: 'fa-solid fa-book-open' },
  { id: 'Bolos e Tortas', label: 'Bolos & Tortas', icon: 'fa-solid fa-cake-candles' },
  { id: 'Sopas e Caldos', label: 'Sopas & Caldos', icon: 'fa-solid fa-bowl-rice' },
  { id: 'Almoço de Família', label: 'Almoço de Domingo', icon: 'fa-solid fa-utensils' },
  { id: 'Doces Caseiros', label: 'Doces da Vovó', icon: 'fa-solid fa-ice-cream' },
  { id: 'Lanches e Pães', label: 'Pães & Café da Tarde', icon: 'fa-solid fa-bread-slice' },
];

const FRIDGE_QUICK_ITEMS = [
  { term: 'ovo', label: 'Ovos', icon: 'fa-solid fa-egg text-amber-600' },
  { term: 'cenoura', label: 'Cenoura', icon: 'fa-solid fa-carrot text-orange-600' },
  { term: 'frango', label: 'Frango', icon: 'fa-solid fa-drumstick-bite text-amber-700' },
  { term: 'leite', label: 'Leite', icon: 'fa-solid fa-cow text-sky-700' },
  { term: 'batata', label: 'Batata', icon: 'fa-solid fa-seedling text-emerald-700' },
  { term: 'queijo', label: 'Queijo', icon: 'fa-solid fa-cheese text-yellow-600' },
  { term: 'arroz', label: 'Arroz', icon: 'fa-solid fa-bowl-food text-stone-600' },
  { term: 'chocolate', label: 'Chocolate', icon: 'fa-solid fa-cookie-bite text-amber-900' },
];

export const HomeSenior: React.FC<HomeSeniorProps> = ({
  recipes,
  loading,
  isOffline,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onChangeSearch,
  selectedFridgeItems,
  onToggleFridgeItem,
  onClearFilters,
  onOpenRecipe,
  onToggleFavorite,
  onSpeakSummary,
  onGoToImporter,
  onOpenVipModal,
  monetization,
  user,
  highContrastDark,
  onlyFavorites = false,
}) => {
  const [listeningVoice, setListeningVoice] = useState(false);

  const handleVoiceSearch = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Para pesquisar falando, utilize o Google Chrome ou Microsoft Edge.');
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListeningVoice(true);
    recognition.onend = () => setListeningVoice(false);
    recognition.onerror = () => setListeningVoice(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        onChangeSearch(transcript.replace(/\.$/, ''));
      }
    };

    recognition.start();
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {isOffline && (
        <div className="p-3.5 rounded-2xl bg-amber-100 border border-amber-300 text-amber-950 font-bold text-sm flex items-center gap-2">
          <i className="fa-solid fa-wifi text-amber-700" />
          <span>Modo Offline Ativo: exibindo as receitas salvas na memória do seu aparelho.</span>
        </div>
      )}

      {/* Hero Banner Acolhedor Estilo Portal Culinário da Vovó */}
      {!onlyFavorites && (
        <section
          className={`relative rounded-3xl overflow-hidden border shadow-md ${
            highContrastDark
              ? 'bg-stone-900 border-stone-800 text-white'
              : 'bg-gradient-to-r from-[#FFF8EE] via-[#FDF6EC] to-[#F7E8D0] border-amber-200/80 text-[#2D241E]'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-800/10 border border-amber-800/20 text-amber-900 dark:text-amber-300 text-xs font-extrabold">
                <i className="fa-solid fa-heart text-rose-500" />
                <span>O Portal das Receitas Caseiras & Segredos de Vó</span>
              </div>

              <h1 className="font-serif-vovo text-3xl sm:text-5xl font-extrabold leading-tight">
                Aquele cheirinho de bolo saindo do forno da{' '}
                <span className="text-amber-800 dark:text-amber-400 underline decoration-amber-400/60">
                  casa da Vovó
                </span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl leading-relaxed">
                Receitas testadas com carinho, leitura guiada em voz alta passo a passo, relógio de
                cozinha integrado e importação direta do <strong>TudoGostoso</strong>.
              </p>

              {/* Barra de Busca Charmosa */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <div className="relative flex-1">
                  <i className="fa-solid fa-magnifying-glass text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onChangeSearch(e.target.value)}
                    placeholder="Qual receita da vovó você quer fazer hoje?"
                    className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-amber-300 bg-white text-stone-900 text-sm sm:text-base font-semibold shadow-sm focus:border-amber-700 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onChangeSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      <i className="fa-solid fa-circle-xmark" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`px-5 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition ${
                    listeningVoice
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-amber-800 hover:bg-amber-900 text-white'
                  }`}
                >
                  <i className="fa-solid fa-microphone" />
                  <span>{listeningVoice ? 'Ouvindo...' : 'Buscar por Voz'}</span>
                </button>
              </div>

              {/* Selos de Confiança */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-stone-600 dark:text-stone-400">
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-volume-high text-amber-700" />
                  Leitura em Voz Alta
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-clock text-emerald-700" />
                  Timers Automáticos
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-mobile-screen-button text-orange-600" />
                  Funciona no PC e Celular
                </span>
              </div>
            </div>

            {/* Ilustração Personalizada da Vovó na Cozinha */}
            <div className="lg:col-span-5 h-64 sm:h-80 lg:h-full relative overflow-hidden">
              <img
                src="/images/hero-vovo.jpg"
                alt="Vovó sorrindo com bolo caseiro na cozinha"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3.5 py-2 rounded-2xl shadow border border-amber-200 text-xs font-bold text-amber-950 flex items-center gap-2">
                <i className="fa-solid fa-award text-amber-600 text-base" />
                <span>+1.200 Receitas Testadas</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Banner Google AdSense Topo (Oculto automaticamente para membros VIP) */}
      <AdSenseBanner
        config={monetization}
        user={user}
        slotType="header"
        onOpenVipModal={onOpenVipModal}
      />

      {/* Filtro "O que tem na despensa / geladeira?" + Categorias */}
      <section
        className={`rounded-3xl border p-5 sm:p-6 shadow-sm space-y-5 ${
          highContrastDark
            ? 'bg-stone-900 border-stone-800 text-stone-100'
            : 'bg-white border-amber-200/70 text-[#2D241E]'
        }`}
      >
        {/* Categorias em Pílulas Delicadas */}
        {!onlyFavorites && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0 border transition ${
                    isSelected
                      ? 'bg-amber-800 text-white border-amber-900 shadow-sm'
                      : highContrastDark
                      ? 'bg-stone-800 text-stone-200 border-stone-700 hover:border-amber-400'
                      : 'bg-amber-50/60 text-stone-700 border-amber-200 hover:bg-amber-100/70'
                  }`}
                >
                  <i className={cat.icon} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* O que você tem em casa? */}
        <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1.5">
              <i className="fa-solid fa-basket-shopping text-amber-700" />
              <span>Tenho em casa:</span>
            </span>

            {FRIDGE_QUICK_ITEMS.map((item) => {
              const active = selectedFridgeItems.includes(item.term);
              return (
                <button
                  key={item.term}
                  type="button"
                  onClick={() => onToggleFridgeItem(item.term)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition ${
                    active
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                      : highContrastDark
                      ? 'bg-stone-800 text-stone-200 border-stone-700'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-amber-50'
                  }`}
                >
                  <i className={active ? 'fa-solid fa-check text-white' : item.icon} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {(selectedFridgeItems.length > 0 || searchQuery || selectedCategory !== 'Todas') && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-extrabold text-rose-700 hover:underline flex items-center gap-1"
            >
              <i className="fa-solid fa-rotate-left" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      </section>

      {/* Cabeçalho da Seção de Receitas */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-vovo text-2xl sm:text-3xl font-bold">
            {onlyFavorites
              ? '❤️ Meu Caderninho de Receitas Favoritas'
              : selectedCategory === 'Todas'
              ? ' Receitas Fresquinhas do Caderno'
              : `🍰 ${selectedCategory}`}
          </h2>
          <p className="text-sm text-stone-500 font-semibold">
            Mostrando {recipes.length} receita(s) pronta(s) para preparar
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToImporter}
          className="px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-extrabold flex items-center gap-2 transition"
        >
          <i className="fa-solid fa-cloud-arrow-down" />
          <span>Importar Mais Receitas do TudoGostoso</span>
        </button>
      </div>

      {/* Lista de Cards de Receita */}
      {loading ? (
        <div className="p-12 text-center rounded-3xl border border-amber-200 bg-white text-stone-700">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-amber-700 mb-3" />
          <p className="text-lg font-bold">Folheando o Caderno da Vovó...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div
          className={`p-10 text-center rounded-3xl border ${
            highContrastDark
              ? 'bg-stone-900 border-stone-800 text-white'
              : 'bg-white border-amber-200 text-stone-800'
          }`}
        >
          <i className="fa-solid fa-cookie-bite text-4xl text-amber-600 mb-3" />
          <p className="font-serif-vovo text-2xl font-bold mb-2">
            Nenhuma receita encontrada com esses ingredientes
          </p>
          <p className="text-sm text-stone-500 mb-5">
            Limpe os filtros ou importe novas receitas diretamente do TudoGostoso!
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={onClearFilters}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-stone-800 text-white"
            >
              Ver Todas as Receitas
            </button>
            <button
              type="button"
              onClick={onGoToImporter}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-amber-700 text-white flex items-center gap-2"
            >
              <i className="fa-solid fa-cloud-arrow-down" />
              <span>Puxar do TudoGostoso</span>
            </button>
          </div>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <SeniorRecipeCard
              key={recipe.id}
              recipe={recipe}
              onOpenRecipe={onOpenRecipe}
              onToggleFavorite={onToggleFavorite}
              onSpeakSummary={onSpeakSummary}
              highContrastDark={highContrastDark}
            />
          ))}
        </section>
      )}

      {/* Banner Clube VIP da Vovó no Rodapé da Home */}
      {!user?.isVip && (
        <section className="rounded-3xl bg-gradient-to-r from-amber-800 via-amber-700 to-orange-700 p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-extrabold">
              <i className="fa-solid fa-crown" />
              <span>CLUBE VIP DA VOVÓ</span>
            </span>
            <h3 className="font-serif-vovo text-2xl sm:text-3xl font-bold">
              Desbloqueie as Receitas Secretas de Família & Navegue Sem Anúncios!
            </h3>
            <p className="text-sm text-amber-100">
              Assinantes VIP têm acesso liberado a todas as receitas especiais, segredinhos de
              confeitaria da vovó e apostilas em PDF prontas para imprimir.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenVipModal}
            className="shrink-0 px-6 py-3.5 rounded-2xl bg-white text-amber-900 hover:bg-amber-50 font-extrabold text-sm shadow-md flex items-center gap-2 transition"
          >
            <i className="fa-solid fa-crown text-amber-600" />
            <span>Conhecer Planos VIP</span>
          </button>
        </section>
      )}
    </main>
  );
};
