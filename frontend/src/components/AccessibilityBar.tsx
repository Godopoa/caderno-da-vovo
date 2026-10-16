import React from 'react';
import { UserProfile } from '../types';

interface AccessibilityBarProps {
  activeTab: 'home' | 'favorites' | 'create' | 'importer' | 'admin';
  onSelectTab: (tab: 'home' | 'favorites' | 'create' | 'importer' | 'admin') => void;
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
      {/* Faixa Fina de Utilidades, Acessibilidade Discreta e Segurança */}
      <div
        className={`text-xs py-1.5 px-4 border-b transition-colors ${
          highContrastDark
            ? 'bg-stone-950 border-stone-800 text-amber-200'
            : 'bg-[#4A3525] border-[#3A281B] text-amber-50'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-semibold">
              <i className="fa-solid fa-heart text-rose-400" />
              <span>Receitas Afetivas de Família</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-amber-200/90">
              <i className="fa-solid fa-handshake" />
              <span>Parceria Oficial TudoGostoso</span>
            </span>
            <span className="hidden lg:flex items-center gap-1.5 text-emerald-300">
              <i className="fa-solid fa-shield-halved" />
              <span>Conexão Segura AES-256</span>
            </span>
          </div>

          {/* Controles Elegantes de Conforto de Leitura */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-black/20 px-2.5 py-0.5 rounded-full">
              <span className="opacity-80 mr-1 hidden sm:inline">Letra:</span>
              <button
                type="button"
                onClick={decreaseFont}
                title="Diminuir fonte"
                className="px-1.5 hover:text-amber-300 font-bold"
              >
                A-
              </button>
              <span className="text-[11px] opacity-75 px-1">
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
              className="flex items-center gap-1.5 bg-black/20 hover:bg-black/30 px-2.5 py-0.5 rounded-full font-semibold transition"
            >
              <i className={highContrastDark ? 'fa-solid fa-sun text-amber-300' : 'fa-solid fa-moon'} />
              <span>{highContrastDark ? 'Modo Claro' : 'Modo Noturno'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navbar Principal Estilo Portal Culinário Acolhedor */}
      <div
        className={`border-b transition-colors ${
          highContrastDark
            ? 'bg-stone-900/95 border-stone-800 text-stone-100'
            : 'bg-[#FFFDF9]/95 border-amber-200/80 text-[#2D241E]'
        } backdrop-blur-md`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo Afetivo + Título do Site */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3.5 text-left group focus:outline-none"
          >
            <div className="relative">
              <img
                src="/images/logo-vovo.jpg"
                alt="Caderno da Vovó"
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-amber-600/40 shadow-sm group-hover:scale-105 transition"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center shadow">
                <i className="fa-solid fa-utensils" />
              </span>
            </div>
            <div>
              <span className="font-serif-vovo text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-900 dark:text-amber-300 block leading-none">
                Caderno da Vovó
              </span>
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 mt-1 block">
                Sabores de infância, voz guiada & carinho de vó
              </span>
            </div>
          </button>

          {/* Links Centrais de Navegação */}
          <nav aria-label="Menu do Portal" className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                activeTab === 'home'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'hover:bg-amber-100/70 dark:hover:bg-stone-800'
              }`}
            >
              <i className="fa-solid fa-book-open" />
              <span>Receitas</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('favorites')}
              className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                activeTab === 'favorites'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'hover:bg-rose-50 dark:hover:bg-stone-800'
              }`}
            >
              <i className="fa-solid fa-heart text-rose-500" />
              <span>Favoritas</span>
              {favoritesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-xs bg-rose-100 text-rose-800 font-extrabold">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('create')}
              className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                activeTab === 'create'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'hover:bg-emerald-50 dark:hover:bg-stone-800'
              }`}
            >
              <i className="fa-solid fa-feather-pointed text-emerald-700" />
              <span>Enviar Receita</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('importer')}
              className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                activeTab === 'importer'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'hover:bg-orange-50 dark:hover:bg-stone-800'
              }`}
            >
              <i className="fa-solid fa-cloud-arrow-down text-orange-600" />
              <span>TudoGostoso</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('admin')}
              className={`px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                activeTab === 'admin'
                  ? 'bg-stone-900 text-amber-300 shadow-sm'
                  : 'hover:bg-stone-200/70 dark:hover:bg-stone-800'
              }`}
            >
              <i className="fa-solid fa-gauge-high text-amber-600" />
              <span>Painel Admin</span>
            </button>
          </nav>

          {/* Área de Conta / Clube VIP */}
          <div className="flex items-center gap-2.5">
            {!user?.isVip && (
              <button
                type="button"
                onClick={() => onOpenAuthModal('vip')}
                className="px-3.5 py-2 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm flex items-center gap-1.5 transition"
              >
                <i className="fa-solid fa-crown" />
                <span>Seja VIP</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 px-3 py-1.5 rounded-xl">
                <div className="text-xs">
                  <span className="font-extrabold block leading-none flex items-center gap-1">
                    {user.isVip && <i className="fa-solid fa-crown text-amber-500" />}
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] opacity-75 uppercase font-bold">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sair da conta"
                  className="ml-1 text-stone-500 hover:text-rose-600 px-1.5 py-1"
                >
                  <i className="fa-solid fa-right-from-bracket" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className="px-4 py-2 rounded-xl font-bold text-sm border border-amber-700/40 text-amber-900 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-stone-800 flex items-center gap-2 transition"
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
