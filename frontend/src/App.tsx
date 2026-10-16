import React, { useCallback, useEffect, useState } from 'react';
import { AccessibilityBar } from './components/AccessibilityBar';
import { HomeSenior } from './pages/HomeSenior';
import { RecipeDetail } from './pages/RecipeDetail';
import { AdminImporterPanel } from './components/AdminImporterPanel';
import { CreateRecipeForm } from './components/CreateRecipeForm';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AuthVipModal } from './components/AuthVipModal';
import {
  clearAuthSession,
  deleteRecipeById,
  fetchMonetizationConfig,
  fetchRecipes,
  getStoredUser,
  toggleFavoriteRecipe,
} from './api/client';
import { MonetizationConfig, Recipe, UserProfile } from './types';
import { useVoiceReader } from './hooks/useVoiceReader';

export function App() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'favorites' | 'create' | 'importer' | 'admin'
  >('home');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Autenticação & Monetização
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [monetization, setMonetization] = useState<MonetizationConfig | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'vip' | null>(null);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFridgeItems, setSelectedFridgeItems] = useState<string[]>([]);

  // Preferências de leitura (proporção normal de site de receitas = 1.0)
  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = localStorage.getItem('caderno_vovo_font_scale_v2');
    return saved ? Number(saved) : 1.0;
  });
  const [highContrastDark, setHighContrastDark] = useState<boolean>(() => {
    return localStorage.getItem('caderno_vovo_high_contrast') === 'true';
  });

  const { speakText } = useVoiceReader();

  useEffect(() => {
    document.documentElement.style.setProperty('--senior-font-scale', String(fontScale));
    localStorage.setItem('caderno_vovo_font_scale_v2', String(fontScale));
  }, [fontScale]);

  useEffect(() => {
    localStorage.setItem('caderno_vovo_high_contrast', String(highContrastDark));
    if (highContrastDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [highContrastDark]);

  const loadMonetization = useCallback(async () => {
    const cfg = await fetchMonetizationConfig();
    if (cfg) setMonetization(cfg);
  }, []);

  useEffect(() => {
    loadMonetization();
  }, [loadMonetization]);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    const result = await fetchRecipes({
      search: searchQuery,
      category: activeTab === 'favorites' ? 'Todas' : selectedCategory,
      favorite: activeTab === 'favorites' ? true : undefined,
      fridge: selectedFridgeItems.join(','),
    });
    setRecipes(result.recipes);
    setIsOffline(result.isOffline);
    setLoading(false);
  }, [searchQuery, selectedCategory, activeTab, selectedFridgeItems]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleToggleFavorite = async (recipe: Recipe) => {
    try {
      const updated = await toggleFavoriteRecipe(recipe.id);
      setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (selectedRecipe && selectedRecipe.id === updated.id) {
        setSelectedRecipe(updated);
      }
    } catch {
      const toggled = { ...recipe, isFavorite: !recipe.isFavorite };
      setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? toggled : r)));
      if (selectedRecipe && selectedRecipe.id === recipe.id) {
        setSelectedRecipe(toggled);
      }
    }
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    await deleteRecipeById(recipe.id);
    setSelectedRecipe(null);
    loadRecipes();
  };

  const handleSpeakSummary = (recipe: Recipe) => {
    speakText(
      `${recipe.title}. ${recipe.description || ''} Tempo de preparo: ${
        recipe.prepTimeMinutes || 35
      } minutos. Rende ${recipe.servings || '6 porções'}.`
    );
  };

  const handleToggleFridgeItem = (term: string) => {
    setSelectedFridgeItems((prev) =>
      prev.includes(term) ? prev.filter((i) => i !== term) : [...prev, term]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todas');
    setSelectedFridgeItems([]);
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    if (activeTab === 'admin') {
      setActiveTab('home');
    }
  };

  const favoritesCount = recipes.filter((r) => r.isFavorite).length;

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors ${
        highContrastDark ? 'bg-stone-950 text-amber-50' : 'bg-notebook-paper text-[#2D241E]'
      }`}
    >
      <div>
        <AccessibilityBar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setSelectedRecipe(null);
            setActiveTab(tab);
          }}
          fontScale={fontScale}
          onChangeFontScale={setFontScale}
          highContrastDark={highContrastDark}
          onToggleHighContrast={() => setHighContrastDark((v) => !v)}
          favoritesCount={favoritesCount}
          user={user}
          onOpenAuthModal={(mode) => setAuthModalMode(mode)}
          onLogout={handleLogout}
        />

        {selectedRecipe ? (
          <RecipeDetail
            recipe={selectedRecipe}
            user={user}
            monetization={monetization}
            onBack={() => setSelectedRecipe(null)}
            onToggleFavorite={handleToggleFavorite}
            onDeleteRecipe={handleDeleteRecipe}
            onOpenVipModal={() => setAuthModalMode('vip')}
            highContrastDark={highContrastDark}
          />
        ) : activeTab === 'admin' ? (
          <AdminDashboardPage
            user={user}
            recipes={recipes}
            onRefreshRecipes={loadRecipes}
            onRefreshMonetization={loadMonetization}
            onOpenAuthModal={(mode) => setAuthModalMode(mode)}
            onGoToImporter={() => setActiveTab('importer')}
            highContrastDark={highContrastDark}
          />
        ) : activeTab === 'importer' ? (
          <AdminImporterPanel
            highContrastDark={highContrastDark}
            onRecipeImported={(newRecipe) => {
              loadRecipes();
              if (newRecipe) {
                setSelectedRecipe(newRecipe);
              }
            }}
          />
        ) : activeTab === 'create' ? (
          <CreateRecipeForm
            highContrastDark={highContrastDark}
            onRecipeCreated={(created) => {
              loadRecipes();
              setSelectedRecipe(created);
            }}
          />
        ) : (
          <HomeSenior
            recipes={recipes}
            loading={loading}
            isOffline={isOffline}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onChangeSearch={setSearchQuery}
            selectedFridgeItems={selectedFridgeItems}
            onToggleFridgeItem={handleToggleFridgeItem}
            onClearFilters={handleClearFilters}
            onOpenRecipe={(r) => setSelectedRecipe(r)}
            onToggleFavorite={handleToggleFavorite}
            onSpeakSummary={handleSpeakSummary}
            onGoToImporter={() => setActiveTab('importer')}
            onOpenVipModal={() => setAuthModalMode('vip')}
            monetization={monetization}
            user={user}
            highContrastDark={highContrastDark}
            onlyFavorites={activeTab === 'favorites'}
          />
        )}
      </div>

      {/* Modal de Login, Cadastro e Assinatura Clube VIP */}
      {authModalMode && (
        <AuthVipModal
          initialMode={authModalMode}
          user={user}
          monetization={monetization}
          onClose={() => setAuthModalMode(null)}
          onAuthSuccess={(loggedUser) => setUser(loggedUser)}
        />
      )}

      {/* Rodapé Estilo Portal Culinário Acolhedor */}
      <footer
        className={`no-print mt-16 border-t py-10 px-4 text-sm ${
          highContrastDark
            ? 'bg-stone-900 border-stone-800 text-stone-400'
            : 'bg-[#F7EFE4] border-amber-200/80 text-stone-700'
        }`}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo-vovo.jpg"
                alt="Caderno da Vovó"
                className="w-11 h-11 rounded-2xl object-cover border border-amber-600/30"
              />
              <span className="font-serif-vovo text-2xl font-bold text-amber-900 dark:text-amber-300">
                Caderno da Vovó
              </span>
            </div>
            <p className="text-xs sm:text-sm opacity-85 max-w-md leading-relaxed">
              O seu portal de receitas afetivas de família. Com leitura em voz alta passo a passo,
              temporizadores integrados, Clube VIP sem anúncios e parceria de importação com o
              TudoGostoso.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-2 uppercase text-xs tracking-wider">
              Acesso Rápido
            </h4>
            <ul className="space-y-1.5 text-xs font-semibold">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:underline">
                  <i className="fa-solid fa-book-open mr-1.5 text-amber-700" />
                  Catálogo de Receitas
                </button>
              </li>
              <li>
                <button onClick={() => setAuthModalMode('vip')} className="hover:underline">
                  <i className="fa-solid fa-crown mr-1.5 text-amber-600" />
                  Clube VIP Sem Anúncios
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('importer')} className="hover:underline">
                  <i className="fa-solid fa-cloud-arrow-down mr-1.5 text-orange-600" />
                  Importer TudoGostoso
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('admin')} className="hover:underline">
                  <i className="fa-solid fa-shield-halved mr-1.5 text-emerald-700" />
                  Painel Administrativo
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-2 uppercase text-xs tracking-wider">
              Segurança & Multiplataforma
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2">
                <i className="fa-solid fa-lock text-emerald-700" />
                <span>Criptografia AES-256-GCM & Scrypt</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fa-brands fa-android text-emerald-700" />
                <span>App Android / iOS (Capacitor)</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fa-brands fa-google text-amber-700" />
                <span>Monetizado com Google AdSense</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-amber-200/60 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs opacity-80">
          <span>© 2026 Caderno da Vovó — Todos os direitos reservados.</span>
          <span>
            Feito com <i className="fa-solid fa-heart text-rose-500 mx-1" /> para conectar gerações na cozinha.
          </span>
        </div>
      </footer>
    </div>
  );
}
