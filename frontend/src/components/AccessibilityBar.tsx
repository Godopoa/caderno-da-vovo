import React from 'react';
import { UserProfile } from '../types';

export type NavTab =
  | 'home'
  | 'cooking'
  | 'economy'
  | 'health'
  | 'crafts'
  | 'cookbook'
  | 'news'
  | 'favorites'
  | 'create'
  | 'profile'
  | 'importer'
  | 'admin';

interface AccessibilityBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  fontScale: number;
  onChangeFontScale: (newScale: number) => void;
  highContrastDark: boolean;
  onToggleHighContrast: () => void;
  favoritesCount: number;
  user: UserProfile | null;
  onOpenAuthModal: (mode: 'login' | 'register' | 'vip') => void;
  onLogout: () => void;
}

export const AccessibilityBar: React.FC<AccessibilityBarProps> = ({
  activeTab,
  onSelectTab,
  fontScale,
  onChangeFontScale,
  highContrastDark,
  onToggleHighContrast,
  favoritesCount,
  user,
  onOpenAuthModal,
  onLogout,
}) => {
  const isAdmin = user?.role === 'ADMIN';

  const decreaseFont = () => {
    const next = Math.max(0.9, Number((fontScale - 0.08).toFixed(2)));
    onChangeFontScale(next);
  };

  const increaseFont = () => {
    const next = Math.min(1.35, Number((fontScale + 0.08).toFixed(2)));
    onChangeFontScale(next);
  };

  return (
    <header className="no-print sticky top-0 z-40 shadow-sm">
      {/* 1. Faixa Superior de Acessibilidade & Segurança */}
      <div
        className={`text-xs py-1.5 px-4 border-b transition-colors ${
          highContrastDark
            ? 'bg-stone-950 border-stone-800 text-stone-300'
            : 'bg-[#1B4332] border-[#143325] text-emerald-50'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-semibold">
              <i className="fa-solid fa-heart text-rose-400" />
              <span>Portal de Receitas & Utilidades da Vovó</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-emerald-200">
              <i className="fa-solid fa-magnifying-glass-chart" />
              <span>SEO Google Rich Snippets Ativo</span>
            </span>
            <span className="hidden lg:flex items-center gap-1.5 text-amber-300">
              <i className="fa-solid fa-shield-halved" />
              <span>Criptografia AES-256 & Captcha Próprio</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-black/25 px-2.5 py-0.5 rounded-full">
              <span className="opacity-80 mr-1 hidden sm:inline">Fonte:</span>
              <button
                type="button"
                onClick={decreaseFont}
                title="Diminuir fonte"
                className="px-1.5 hover:text-amber-300 font-bold"
              >
                A-
              </button>
              <span className="text-[11px] opacity-80 px-1">
                {Math.round(fontScale * 100)}%
              </span>
              <button
                type="button"
                onClick={increaseFont}
                title="Aumentar fonte"
                className="px-1.5 hover:text-amber-300 font-bold"
              >
                A+
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleHighContrast}
              className="flex items-center gap-1.5 bg-black/25 hover:bg-black/40 px-2.5 py-0.5 rounded-full font-semibold transition"
            >
              <i
                className={
                  highContrastDark ? 'fa-solid fa-sun text-amber-300' : 'fa-solid fa-moon'
                }
              />
              <span>{highContrastDark ? 'Modo Claro' : 'Modo Noturno'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Linha Principal: Marca à Esquerda + Ações Rápidas & Conta à Direita */}
      <div
        className={`border-b transition-colors ${
          highContrastDark
            ? 'bg-stone-900/95 border-stone-800 text-stone-100'
            : 'bg-white/95 border-stone-200/80 text-[#1E1B18]'
        } backdrop-blur-md`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo Afetivo */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="relative shrink-0">
              <img
                src="/images/logo-vovo.jpg"
                alt="Caderno da Vovó"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-rose-500/30 shadow-sm group-hover:scale-105 transition"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#C83E5B] text-white text-[10px] flex items-center justify-center shadow">
                <i className="fa-solid fa-utensils" />
              </span>
            </div>
            <div>
              <span className="font-serif-vovo text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B18] dark:text-amber-300 block leading-none">
                Caderno da <span className="text-[#C83E5B]">Vovó</span>
              </span>
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1 block">
                Receitas afetivas, economia doméstica & bem-estar
              </span>
            </div>
          </button>

          {/* Ações Rápidas do Usuário (Direita da Linha 1) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Botão Favoritas */}
            <button
              type="button"
              onClick={() => onSelectTab('favorites')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 border transition ${
                activeTab === 'favorites'
                  ? 'bg-[#C83E5B] text-white border-[#C83E5B] shadow-sm'
                  : highContrastDark
                  ? 'bg-stone-800/90 border-stone-700 text-stone-200 hover:bg-stone-800'
                  : 'bg-rose-50/70 border-rose-200/80 text-stone-700 hover:bg-rose-100/80'
              }`}
            >
              <i
                className={`fa-solid fa-heart ${
                  activeTab === 'favorites' ? 'text-white' : 'text-[#C83E5B]'
                }`}
              />
              <span>Favoritas</span>
              {favoritesCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
                    activeTab === 'favorites'
                      ? 'bg-white text-[#C83E5B]'
                      : 'bg-[#C83E5B] text-white'
                  }`}
                >
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Botão Enviar Receita */}
            <button
              type="button"
              onClick={() => onSelectTab('create')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 border transition ${
                activeTab === 'create'
                  ? 'bg-[#1E7E5A] text-white border-[#1E7E5A] shadow-sm'
                  : highContrastDark
                  ? 'bg-stone-800/90 border-stone-700 text-stone-200 hover:bg-stone-800'
                  : 'bg-emerald-50/70 border-emerald-200/80 text-[#1E7E5A] hover:bg-emerald-100/80'
              }`}
            >
              <i className="fa-solid fa-feather-pointed" />
              <span>Enviar Receita</span>
            </button>

            {/* Botões Administrativos OCULTOS para visitantes comuns — SÓ aparecem se user.role === 'ADMIN' */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab('importer')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition ${
                    activeTab === 'importer'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <i className="fa-solid fa-robot" />
                  <span>Importer</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('admin')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition ${
                    activeTab === 'admin'
                      ? 'bg-stone-900 text-amber-300 shadow-sm ring-2 ring-amber-400/50'
                      : 'bg-stone-900 text-amber-300 hover:bg-stone-800'
                  }`}
                >
                  <i className="fa-solid fa-shield-halved" />
                  <span>Admin</span>
                </button>
              </>
            )}

            {/* Clube VIP */}
            {!user?.isVip && (
              <button
                type="button"
                onClick={() => onOpenAuthModal('vip')}
                className="px-3.5 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm flex items-center gap-1.5 transition"
              >
                <i className="fa-solid fa-crown" />
                <span>Clube VIP</span>
              </button>
            )}

            {/* Conta do Usuário ou Botão Entrar */}
            {user ? (
              <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3 py-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => onSelectTab('profile')}
                  className="text-xs text-left hover:opacity-80"
                >
                  <span className="font-extrabold leading-none flex items-center gap-1">
                    {user.isVip && <i className="fa-solid fa-crown text-amber-500" />}
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-stone-500 uppercase font-bold block mt-0.5">
                    {user.role === 'ADMIN' ? 'Admin' : user.isVip ? 'Membro VIP' : 'Meu Perfil'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sair da conta"
                  className="ml-1 text-stone-400 hover:text-rose-600 px-1 py-0.5"
                >
                  <i className="fa-solid fa-right-from-bracket" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm ${
                  highContrastDark
                    ? 'bg-stone-800 hover:bg-stone-700 text-white border border-stone-700'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                <i className="fa-regular fa-user" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Barra de Navegação de Categorias & Utilidades (Linha 2 — Alinhada e Organizada) */}
      <div
        className={`border-b transition-colors ${
          highContrastDark
            ? 'bg-stone-950/95 border-stone-800 text-stone-200'
            : 'bg-[#FAF7F2]/95 border-stone-200/80 text-stone-700'
        } backdrop-blur-md`}
      >
        <div className="max-w-7xl mx-auto px-4 py-1.5">
          <nav
            aria-label="Menu Principal de Módulos"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
          >
            {/* Grupo 1: Culinária */}
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'home'
                  ? 'bg-[#C83E5B] text-white shadow-sm'
                  : 'hover:bg-rose-50 dark:hover:bg-stone-800'
              }`}
            >
              <i
                className={`fa-solid fa-utensils ${
                  activeTab === 'home' ? 'text-white' : 'text-[#C83E5B]'
                }`}
              />
              <span>Receitas</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('cooking')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'cooking'
                  ? 'bg-gradient-to-r from-[#C83E5B] to-rose-600 text-white shadow-sm'
                  : 'bg-rose-50/70 text-[#C83E5B] border border-rose-200/70 hover:bg-rose-100 dark:bg-stone-900 dark:text-rose-300 dark:border-stone-800'
              }`}
            >
              <i className="fa-solid fa-kitchen-set" />
              <span>Modo Cozinha</span>
            </button>

            <span
              className={`h-5 w-px mx-1 shrink-0 ${
                highContrastDark ? 'bg-stone-800' : 'bg-stone-300'
              }`}
            />

            {/* Grupo 2: Utilidades da Dona de Casa & Vovó */}
            <button
              type="button"
              onClick={() => onSelectTab('economy')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'economy'
                  ? 'bg-[#C83E5B] text-white shadow-sm'
                  : 'hover:bg-rose-50 dark:hover:bg-stone-800'
              }`}
            >
              <i
                className={`fa-solid fa-piggy-bank ${
                  activeTab === 'economy' ? 'text-white' : 'text-[#C83E5B]'
                }`}
              />
              <span>Economia & Feira</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('health')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'health'
                  ? 'bg-[#1E7E5A] text-white shadow-sm'
                  : 'hover:bg-emerald-50 dark:hover:bg-stone-800'
              }`}
            >
              <i
                className={`fa-solid fa-leaf ${
                  activeTab === 'health' ? 'text-white' : 'text-[#1E7E5A]'
                }`}
              />
              <span>Saúde & Chás</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('crafts')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'crafts'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'hover:bg-amber-50 dark:hover:bg-stone-800'
              }`}
            >
              <i
                className={`fa-solid fa-scissors ${
                  activeTab === 'crafts' ? 'text-white' : 'text-amber-600'
                }`}
              />
              <span>Casa, Horta & Crochê</span>
            </button>

            <span
              className={`h-5 w-px mx-1 shrink-0 ${
                highContrastDark ? 'bg-stone-800' : 'bg-stone-300'
              }`}
            />

            {/* Grupo 3: Memórias & Comunidade */}
            <button
              type="button"
              onClick={() => onSelectTab('cookbook')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'cookbook'
                  ? 'bg-stone-900 text-amber-300 shadow-sm dark:bg-amber-500 dark:text-stone-950'
                  : 'hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <i
                className={`fa-solid fa-book-bookmark ${
                  activeTab === 'cookbook'
                    ? 'text-amber-300 dark:text-stone-950'
                    : 'text-amber-600'
                }`}
              />
              <span>Livro PDF</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('news')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'news'
                  ? 'bg-[#1E7E5A] text-white shadow-sm'
                  : 'hover:bg-emerald-50 dark:hover:bg-stone-800'
              }`}
            >
              <i
                className={`fa-regular fa-newspaper ${
                  activeTab === 'news' ? 'text-white' : 'text-[#1E7E5A]'
                }`}
              />
              <span>Jornalzinho</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={() => onSelectTab('profile')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition ${
                  activeTab === 'profile'
                    ? 'bg-stone-800 text-white shadow-sm'
                    : 'hover:bg-stone-200/60 dark:hover:bg-stone-800'
                }`}
              >
                <i className="fa-solid fa-user-pen" />
                <span>Meu Perfil</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
