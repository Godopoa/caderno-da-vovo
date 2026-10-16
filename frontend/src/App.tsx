import React, { useEffect, useState } from 'react';
import { MonetizationConfig, Recipe, UserProfile } from './types';
import {
  clearAuthSession,
  deleteRecipeById,
  fetchMonetizationConfig,
  fetchRecipes,
  getStoredUser,
  syncUserCloudDataOnLogin,
  toggleFavoriteRecipe,
} from './api/client';
import { AccessibilityBar, NavTab } from './components/AccessibilityBar';
import { CloudSyncNotice } from './components/CloudSyncNotice';
import { HomeSenior } from './pages/HomeSenior';
import { RecipeDetail } from './pages/RecipeDetail';
import { AdminImporterPanel } from './components/AdminImporterPanel';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { NewsFeedPage } from './pages/NewsFeedPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { KitchenEconomyHubPage } from './pages/KitchenEconomyHubPage';
import { HealthWellnessHubPage } from './pages/HealthWellnessHubPage';
import { HomeCraftsHubPage } from './pages/HomeCraftsHubPage';
import { FamilyCookbookGeneratorPage } from './pages/FamilyCookbookGeneratorPage';
import { CreateRecipeForm } from './components/CreateRecipeForm';
import { AuthVipModal } from './components/AuthVipModal';
import { CookingModeModal } from './components/CookingModeModal';
import { SEOHead } from './components/SEOHead';
import { useVoiceReader } from './hooks/useVoiceReader';

export const App: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cookingTabRecipe, setCookingTabRecipe] = useState<Recipe | null>(null);

  // Accessibility State
  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = localStorage.getItem('caderno_vovo_font_scale');
    return saved ? parseFloat(saved) : 1;
  });
  const [highContrastDark, setHighContrastDark] = useState<boolean>(() => {
    return localStorage.getItem('caderno_vovo_dark') === 'true';
  });

  // Auth & Monetization State
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'vip'>('login');
  const [monetization, setMonetization] = useState<MonetizationConfig | null>(null);

  const { speakText } = useVoiceReader();

  useEffect(() => {
    localStorage.setItem('caderno_vovo_font_scale', String(fontScale));
    document.documentElement.style.fontSize = `${Math.round(fontScale * 16)}px`;
  }, [fontScale]);

  useEffect(() => {
    localStorage.setItem('caderno_vovo_dark', String(highContrastDark));
    document.documentElement.classList.toggle('dark', highContrastDark);
  }, [highContrastDark]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetchRecipes();
      setRecipes(res.recipes);
      if (res.recipes.length > 0 && !cookingTabRecipe) {
        setCookingTabRecipe(res.recipes[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar receitas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMonetization = async () => {
    const cfg = await fetchMonetizationConfig();
    if (cfg) setMonetization(cfg);
  };

  useEffect(() => {
    loadRecipes();
    loadMonetization();
    syncUserCloudDataOnLogin();
  }, []);

  const handleToggleFavorite = async (recipe: Recipe) => {
    try {
      const updated = await toggleFavoriteRecipe(recipe.id);
      setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? updated : r)));
      if (selectedRecipe?.id === recipe.id) {
        setSelectedRecipe(updated);
      }
    } catch (err) {
      console.error('Erro ao favoritar:', err);
    }
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    try {
      await deleteRecipeById(recipe.id);
      setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
      setSelectedRecipe(null);
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const handleSpeakSummary = (recipe: Recipe) => {
    const text = `${recipe.title}. Categoria: ${recipe.category}. Tempo de preparo: ${
      recipe.prepTimeMinutes || 40
    } minutos. Rendimento: ${recipe.servings || '6 porções'}. ${recipe.description || ''}`;
    speakText(text);
  };

  const openAuthModal = (tab: 'login' | 'register' | 'vip') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    if (recipe.isVipOnly && !user?.isVip && user?.role !== 'ADMIN') {
      openAuthModal('vip');
      return;
    }
    setSelectedRecipe(recipe);
    setCookingTabRecipe(recipe);
    setActiveTab('home');
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    if (activeTab === 'admin' || activeTab === 'importer' || activeTab === 'profile') {
      setActiveTab('home');
    }
  };

  const safeSetActiveTab = (tab: NavTab) => {
    if ((tab === 'admin' || tab === 'importer') && user?.role !== 'ADMIN') {
      openAuthModal('login');
      return;
    }
    if (tab === 'profile' && !user) {
      openAuthModal('login');
      return;
    }
    if (tab === 'cooking') {
      const target = selectedRecipe || cookingTabRecipe || recipes[0];
      if (target) setCookingTabRecipe(target);
      setActiveTab('cooking');
      return;
    }
    setActiveTab(tab);
    setSelectedRecipe(null);
  };

  const favoriteRecipes = recipes.filter((r) => r.isFavorite);
  const displayedRecipes = activeTab === 'favorites' ? favoriteRecipes : recipes;
  const activeCookingRecipe = cookingTabRecipe || selectedRecipe || recipes[0] || null;

  return (
    <div
      className={`min-h-screen flex flex-col selection:bg-rose-200 transition-colors ${
        highContrastDark ? 'bg-stone-950 text-stone-100' : 'bg-[#F8F6F2] text-stone-800'
      }`}
    >
      <SEOHead
        title={
          activeTab === 'cooking' && activeCookingRecipe
            ? `Modo Cozinha: ${activeCookingRecipe.title} — Caderno da Vovó`
            : activeTab === 'economy'
            ? 'Economia do Lar, Cardápio Semanal & Faça e Venda — Caderno da Vovó'
            : activeTab === 'health'
            ? 'Farmacinha Natural de Chás & Lembrete de Remédios — Caderno da Vovó'
            : activeTab === 'crafts'
            ? 'SOS Tira-Manchas, Safra do Mês & Crochê — Caderno da Vovó'
            : activeTab === 'cookbook'
            ? 'Gerador de Livro de Receitas da Família em PDF — Caderno da Vovó'
            : selectedRecipe
            ? `${selectedRecipe.title} — Caderno da Vovó`
            : activeTab === 'news'
            ? 'Jornalzinho & Dicas da Vovó — Caderno da Vovó'
            : monetization?.siteName || 'Caderno da Vovó — Receitas, Economia do Lar & Bem-Estar'
        }
        recipe={selectedRecipe || (activeTab === 'cooking' ? activeCookingRecipe : null)}
      />

      <AccessibilityBar
        activeTab={activeTab}
        onSelectTab={safeSetActiveTab}
        fontScale={fontScale}
        onChangeFontScale={setFontScale}
        highContrastDark={highContrastDark}
        onToggleHighContrast={() => setHighContrastDark((v) => !v)}
        favoritesCount={favoriteRecipes.length}
        user={user}
        onOpenAuthModal={openAuthModal}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div
            className={`text-center py-20 rounded-3xl border shadow-sm ${
              highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#C83E5B] flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
              <i className="fa-solid fa-kitchen-set" />
            </div>
            <p className="text-xl font-bold">
              Abrindo o Caderno de Receitas da Vovó...
            </p>
          </div>
        ) : activeTab === 'cooking' && activeCookingRecipe ? (
          <CookingModeModal
            recipe={activeCookingRecipe}
            allRecipes={recipes}
            onSelectDifferentRecipe={(r) => setCookingTabRecipe(r)}
            onClose={() => setActiveTab('home')}
            highContrastDark={highContrastDark}
            isEmbeddedTab={true}
          />
        ) : activeTab === 'economy' ? (
          <KitchenEconomyHubPage
            recipes={recipes}
            onSelectRecipe={handleSelectRecipe}
            onToggleFavorite={handleToggleFavorite}
            onSpeakSummary={handleSpeakSummary}
            highContrastDark={highContrastDark}
            user={user}
            onOpenAuthModal={openAuthModal}
          />
        ) : activeTab === 'health' ? (
          <HealthWellnessHubPage
            highContrastDark={highContrastDark}
            user={user}
            onOpenAuthModal={openAuthModal}
          />
        ) : activeTab === 'crafts' ? (
          <HomeCraftsHubPage highContrastDark={highContrastDark} />
        ) : activeTab === 'cookbook' ? (
          <FamilyCookbookGeneratorPage
            recipes={recipes}
            user={user}
            highContrastDark={highContrastDark}
            onOpenAuthModal={openAuthModal}
          />
        ) : activeTab === 'admin' && user?.role === 'ADMIN' ? (
          <AdminDashboardPage
            user={user}
            recipes={recipes}
            onRefreshRecipes={loadRecipes}
            onRefreshMonetization={loadMonetization}
            onOpenAuthModal={openAuthModal}
            onGoToImporter={() => setActiveTab('importer')}
            highContrastDark={highContrastDark}
          />
        ) : activeTab === 'importer' && user?.role === 'ADMIN' ? (
          <AdminImporterPanel
            highContrastDark={highContrastDark}
            onRecipeImported={(newRecipe) => {
              if (newRecipe) {
                setRecipes((prev) => [newRecipe, ...prev]);
                setSelectedRecipe(newRecipe);
                setActiveTab('home');
              } else {
                loadRecipes();
              }
            }}
          />
        ) : activeTab === 'create' ? (
          <CreateRecipeForm
            highContrastDark={highContrastDark}
            onRecipeCreated={(created) => {
              setRecipes((prev) => [created, ...prev]);
              setSelectedRecipe(created);
              setActiveTab('home');
            }}
          />
        ) : activeTab === 'news' ? (
          <NewsFeedPage user={user} highContrastDark={highContrastDark} />
        ) : activeTab === 'profile' && user ? (
          <UserProfilePage
            user={user}
            favoriteRecipes={favoriteRecipes}
            onUserUpdated={setUser}
            onOpenRecipe={handleSelectRecipe}
            onToggleFavorite={handleToggleFavorite}
            onSpeakSummary={handleSpeakSummary}
            onOpenVipModal={() => openAuthModal('vip')}
            highContrastDark={highContrastDark}
          />
        ) : selectedRecipe ? (
          <RecipeDetail
            recipe={selectedRecipe}
            user={user}
            monetization={monetization}
            onBack={() => setSelectedRecipe(null)}
            onToggleFavorite={handleToggleFavorite}
            onDeleteRecipe={handleDeleteRecipe}
            onOpenVipModal={() => openAuthModal('vip')}
            highContrastDark={highContrastDark}
          />
        ) : (
          <div className="space-y-6">
            {activeTab === 'favorites' && (
              <CloudSyncNotice
                user={user}
                onOpenAuthModal={openAuthModal}
                moduleName="o seu Caderninho de Receitas Favoritas, Remédios e Cardápio da Semana"
              />
            )}
            <HomeSenior
              recipes={displayedRecipes}
              user={user}
              monetization={monetization}
              highContrastDark={highContrastDark}
              onSelectRecipe={handleSelectRecipe}
              onToggleFavorite={handleToggleFavorite}
              onSpeakSummary={handleSpeakSummary}
              onOpenVipModal={() => openAuthModal('vip')}
              onOpenImporter={() => safeSetActiveTab('importer')}
              onOpenNews={() => setActiveTab('news')}
              onOpenHub={(hub) => safeSetActiveTab(hub)}
            />
          </div>
        )}
      </main>

      {/* Cozy Website Footer */}
      <footer
        className={`no-print border-t mt-16 py-10 px-4 ${
          highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/90'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <img
              src="/images/logo-vovo.jpg"
              alt="Logo Caderno da Vovó"
              className="w-12 h-12 rounded-2xl object-cover border border-rose-200 shadow-sm"
            />
            <div>
              <p className="font-extrabold text-base">Caderno da Vovó v5.0</p>
              <p className="text-xs text-stone-500">
                Portal Completo de Receitas, Economia do Lar, Saúde Sênior, Horta & Nuvem Permanente
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-stone-500">
            <button onClick={() => safeSetActiveTab('home')} className="hover:text-[#C83E5B]">
              <i className="fa-solid fa-house mr-1 text-[#C83E5B]" /> Início
            </button>
            <button onClick={() => safeSetActiveTab('economy')} className="hover:text-[#C83E5B]">
              <i className="fa-solid fa-piggy-bank mr-1 text-[#C83E5B]" /> Economia & Feira
            </button>
            <button onClick={() => safeSetActiveTab('health')} className="hover:text-[#C83E5B]">
              <i className="fa-solid fa-leaf mr-1 text-[#1E7E5A]" /> Saúde & Chás
            </button>
            <button onClick={() => safeSetActiveTab('crafts')} className="hover:text-[#C83E5B]">
              <i className="fa-solid fa-scissors mr-1 text-amber-600" /> Casa & Crochê
            </button>
            <button onClick={() => safeSetActiveTab('cookbook')} className="hover:text-[#C83E5B]">
              <i className="fa-solid fa-book-bookmark mr-1 text-[#C83E5B]" /> Livro PDF
            </button>
            <a
              href="http://localhost:3333/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#C83E5B]"
            >
              <i className="fa-solid fa-sitemap mr-1 text-[#1E7E5A]" /> Sitemap XML
            </a>
          </div>
        </div>
      </footer>

      <AuthVipModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        user={user}
        vipMonthlyPrice={monetization?.vipMonthlyPrice || 14.9}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(loggedUser) => setUser(loggedUser)}
      />
    </div>
  );
};

export default App;
