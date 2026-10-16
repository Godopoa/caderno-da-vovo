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
      {/* Faixa Superior Padronizada (Verde Sálvia Escuro #1B4332) */}
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
              <span>Portal de Receitas & Memórias de Família</span>
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
              <i className={highContrastDark ? 'fa-solid fa-sun text-amber-300' : 'fa-solid fa-moon'} />
              <span>{highContrastDark ? 'Modo Claro' : 'Modo Noturno'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navbar Principal com Paleta Padronizada (Branco Alabastro + Cereja #C83E5B + Verde Sálvia) */}
      <div
        className={`border-b transition-colors ${
          highContrastDark
            ? 'bg-stone-900/95 border-stone-800 text-stone-100'
            : 'bg-white/95 border-stone-200/90 text-[#1E1B18]'
        } backdrop-blur-md`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo Afetivo */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3.5 text-left group focus:outline-none"
          >
            <div className="relative">
              <img
                src="/images/logo-vovo.jpg"
                alt="Caderno da Vovó"
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl object-cover border-2 border-rose-500/30 shadow-sm group-hover:scale-105 transition"
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
                Receitas afetivas, porções inteligentes & voz guiada
              </span>
            </div>
          </button>

          {/* Menu Principal — Botões de Admin SÓ aparecem quando logado como ADMIN! */}
          <nav aria-label="Menu Principal" className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                activeTab === 'home'
                  ? 'bg-[#C83E5B] text-white shadow-sm'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-rose-50 dark:hover:bg-stone-800'
              }`}
            >
              <i className="fa-solid fa-utensils" />
              <span>Receitas</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('cooking')}
              className={`px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition ${
                activeTab === 'cooking'
                  ? 'bg-gradient-to-r from-[#C83E5B] to-rose-600 text-white shadow-sm ring-2 ring-rose-200'
                  : 'bg-rose-50/80 text-[#C83E5B] border border-rose-200/80 hover:bg-rose-100 dark:bg-stone-800 dark:text-rose-300 dark:border-stone-700'
              }`}
            >
              <i className="fa-solid fa-kitchen-set" />
              <span>Modo Cozinha</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('economy')}
              className={`px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition ${
                activeTab === 'economy'
                  ? 'bg-[#C83E5B] text-white shadow-sm'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-rose-50 dark:hover:bg-stone-800'
              }`}
            >
              <i className="fa-solid fa-piggy-bank text-[#C83E5B] group-hover:text-white" />
              <span>Economia & Feira</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('health')}
              className={`px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition ${
                activeTab === 'health'
                  ? 'bg-[#1E7E5A] text-white shadow-sm'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-stone-800'
              }`}
            >
              <i className="fa-solid fa-Notes-medical fa-leaf text-[#1E7E5A]" />
              <span>Saúde & Chás</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('crafts')}
              className={`px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition ${
                activeTab === 'crafts'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-800'
              }`}
            >
              <i className="fa-solid fa-scissors text-amber-600" />
              <span>Casa, Horta & Crochê</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('cookbook')}
              className={`px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition ${
                activeTab === 'cookbook'
                  ? 'bg-stone-900 text-amber-300 shadow-sm'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <i className="fa-solid fa-book-bookmark text-amber-600" />
              <span>Livro PDF</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('news')}
              className={`px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition ${
                activeTab === 'news'
                  ? 'bg-[#1E7E5A] text-white shadow-sm'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-stone-800'
              }`}
            >
              <i className="fa-regular fa-newspaper" />
              <span>Jornalzinho</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('favorites')}
              className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                activeTab === 'favorites'
                  ? 'bg-[#C83E5B] text-white shadow-sm'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-rose-50 dark:hover:bg-stone-800'
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
                  className={`px-1.5 py-0.2 rounded-full text-xs font-extrabold ${
                    activeTab === 'favorites'
                      ? 'bg-white text-[#C83E5B]'
                      : 'bg-rose-100 text-[#C83E5B]'
                  }`}
                >
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('create')}
              className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                activeTab === 'create'
                  ? 'bg-[#1E7E5A] text-white shadow-sm'
                  : 'text-stone-700 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-stone-800'
              }`}
            >
              <i className="fa-solid fa-feather-pointed" />
              <span>Enviar Receita</span>
            </button>

            {/* Aba Meu Perfil (Visível quando o usuário está logado) */}
            {user && (
              <button
                type="button"
                onClick={() => onSelectTab('profile')}
                className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                  activeTab === 'profile'
                    ? 'bg-stone-800 text-white shadow-sm'
                    : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <i className="fa-solid fa-user-pen" />
                <span>Meu Perfil</span>
              </button>
            )}

            {/* Botões Administrativos OCULTOS para visitantes comuns — SÓ aparecem se user.role === 'ADMIN' */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab('importer')}
                  className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
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
                  className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                    activeTab === 'admin'
                      ? 'bg-stone-900 text-amber-300 shadow-sm'
                      : 'bg-stone-900/90 text-amber-300 hover:bg-stone-900'
                  }`}
                >
                  <i className="fa-solid fa-shield-halved" />
                  <span>Admin</span>
                </button>
              </>
            )}
          </nav>

          {/* Área Direita: Clube VIP & Conta do Usuário */}
          <div className="flex items-center gap-2.5">
            {!user?.isVip && (
              <button
                type="button"
                onClick={() => onOpenAuthModal('vip')}
                className="px-3.5 py-2 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm flex items-center gap-1.5 transition"
              >
                <i className="fa-solid fa-crown" />
                <span>Clube VIP</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => onSelectTab('profile')}
                  className="text-xs text-left hover:opacity-80"
                >
                  <span className="font-extrabold block leading-none flex items-center gap-1">
                    {user.isVip && <i className="fa-solid fa-crown text-amber-500" />}
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-stone-500 uppercase font-bold">
                    {user.role === 'ADMIN' ? 'Admin' : user.isVip ? 'Membro VIP' : 'Membro'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sair da conta"
                  className="ml-1 text-stone-400 hover:text-rose-600 px-1.5 py-1"
                >
                  <i className="fa-solid fa-right-from-bracket" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className="px-4 py-2 rounded-xl font-bold text-sm bg-stone-900 hover:bg-stone-800 text-white flex items-center gap-2 transition shadow-sm"
              >
                <i className="fa-regular fa-user" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
