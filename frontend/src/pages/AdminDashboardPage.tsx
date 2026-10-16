import React, { useEffect, useState } from 'react';
import {
  fetchAdminDashboard,
  fetchAutoImporterStatusApi,
  fetchMonetizationConfig,
  pauseAutoImporterApi,
  startAutoImporterApi,
  toggleRecipeVipAdminApi,
  toggleUserVipAdminApi,
  updateMonetizationConfigApi,
} from '../api/client';
import {
  AdminDashboardData,
  AutoImporterStatus,
  MonetizationConfig,
  Recipe,
  UserProfile,
} from '../types';

interface AdminDashboardPageProps {
  user: UserProfile | null;
  recipes: Recipe[];
  onRefreshRecipes: () => void;
  onRefreshMonetization: () => void;
  onOpenAuthModal: (mode: 'login' | 'register' | 'vip') => void;
  onGoToImporter: () => void;
  highContrastDark: boolean;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  user,
  recipes,
  onRefreshRecipes,
  onRefreshMonetization,
  onOpenAuthModal,
  onGoToImporter,
  highContrastDark,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'autoimporter' | 'overview' | 'monetization' | 'users' | 'security'
  >('autoimporter');
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [monetization, setMonetization] = useState<MonetizationConfig | null>(null);
  const [autoStatus, setAutoStatus] = useState<AutoImporterStatus | null>(null);
  const [intervalSec, setIntervalSec] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAdminData = async () => {
    if (!user || user.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const [dashData, monData, botStatus] = await Promise.all([
        fetchAdminDashboard(),
        fetchMonetizationConfig(),
        fetchAutoImporterStatusApi(),
      ]);
      setDashboard(dashData);
      setMonetization(monData);
      setAutoStatus(botStatus);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  // Atualiza em tempo real o painel do Robô Auto-Importer a cada 2.5 segundos enquanto estiver aberto
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    const timer = setInterval(async () => {
      try {
        const st = await fetchAutoImporterStatusApi();
        setAutoStatus(st);
        if (st.isRunning) {
          onRefreshRecipes();
        }
      } catch {
        // ignore
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [user, onRefreshRecipes]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center mx-auto">
            <i className="fa-solid fa-shield-halved text-3xl" />
          </div>
          <h2 className="font-serif-vovo text-3xl font-bold text-stone-900">
            Acesso Restrito ao Administrador
          </h2>
          <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
            Faça login como Administrador para acessar o Robô Auto-Importer TudoGostoso, a gestão de
            Google AdSense e a auditoria criptográfica.
          </p>
          <button
            type="button"
            onClick={() => onOpenAuthModal('login')}
            className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-sm inline-flex items-center gap-2 shadow"
          >
            <i className="fa-solid fa-key" />
            <span>Entrar como Administrador</span>
          </button>
        </div>
      </div>
    );
  }

  const handleStartAutoImporter = async () => {
    const st = await startAutoImporterApi(intervalSec);
    setAutoStatus(st);
  };

  const handlePauseAutoImporter = async () => {
    const st = await pauseAutoImporterApi();
    setAutoStatus(st);
  };

  const handleSaveMonetization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monetization) return;
    const res = await updateMonetizationConfigApi(monetization);
    setFeedback(res.message);
    onRefreshMonetization();
    loadAdminData();
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleUserVip = async (userId: string) => {
    await toggleUserVipAdminApi(userId);
    loadAdminData();
  };

  const handleToggleRecipeVip = async (recipeId: string) => {
    await toggleRecipeVipAdminApi(recipeId);
    onRefreshRecipes();
    loadAdminData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Cabeçalho do Painel Admin */}
      <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-stone-800 to-[#1B4332] text-white p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-amber-300 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-shield-halved text-2xl" />
          </div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
              Painel Administrativo Exclusivo • {user.email}
            </span>
            <h1 className="font-serif-vovo text-2xl sm:text-3xl font-bold">
              Central Admin, Robô Auto-Importer & Monetização
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onGoToImporter}
            className="px-4 py-2 rounded-xl bg-[#C83E5B] hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-2 transition"
          >
            <i className="fa-solid fa-link" />
            <span>Importer Manual por URL</span>
          </button>
          <button
            type="button"
            onClick={loadAdminData}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-400 text-emerald-950 font-bold text-sm flex items-center gap-2">
          <i className="fa-solid fa-circle-check text-emerald-700 text-lg" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Abas do Painel Admin */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('autoimporter')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
            activeSubTab === 'autoimporter'
              ? 'bg-[#1E7E5A] text-white shadow'
              : 'bg-white text-stone-700 border border-stone-200'
          }`}
        >
          <i className="fa-solid fa-robot" />
          <span>Robô Auto-Importer Sem Parar</span>
          {autoStatus?.isRunning && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
            activeSubTab === 'overview'
              ? 'bg-stone-900 text-amber-300 shadow'
              : 'bg-white text-stone-700 border border-stone-200'
          }`}
        >
          <i className="fa-solid fa-chart-line" />
          <span>Visão Geral & Receitas VIP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('monetization')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
            activeSubTab === 'monetization'
              ? 'bg-stone-900 text-amber-300 shadow'
              : 'bg-white text-stone-700 border border-stone-200'
          }`}
        >
          <i className="fa-solid fa-sack-dollar" />
          <span>Google AdSense & PIX VIP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
            activeSubTab === 'users'
              ? 'bg-stone-900 text-amber-300 shadow'
              : 'bg-white text-stone-700 border border-stone-200'
          }`}
        >
          <i className="fa-solid fa-users-gear" />
          <span>Usuários & VIPs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
            activeSubTab === 'security'
              ? 'bg-stone-900 text-amber-300 shadow'
              : 'bg-white text-stone-700 border border-stone-200'
          }`}
        >
          <i className="fa-solid fa-shield-halved" />
          <span>Criptografia & SEO</span>
        </button>
      </div>

      {/* ABA PRINCIPAL: ROBÔ AUTO-IMPORTER CONTÍNUO TUDOGOSTOSO (SEM REPETIR!) */}
      {activeSubTab === 'autoimporter' && autoStatus && (
        <div className="space-y-6">
          <div
            className={`rounded-3xl border-2 p-6 sm:p-8 shadow-sm ${
              autoStatus.isRunning
                ? 'bg-emerald-50/70 border-[#1E7E5A] text-stone-900'
                : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase flex items-center gap-1.5 ${
                      autoStatus.isRunning
                        ? 'bg-[#1E7E5A] text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    <i
                      className={`fa-solid ${
                        autoStatus.isRunning ? 'fa-spinner fa-spin' : 'fa-pause'
                      }`}
                    />
                    <span>
                      {autoStatus.isRunning ? 'RODANDO EM TEMPO REAL' : 'PAUSADO'}
                    </span>
                  </span>
                  <span className="text-xs font-bold text-stone-500">
                    Proteção Anti-Duplicatas Ativa (URL + Título)
                  </span>
                </div>

                <h2 className="font-serif-vovo text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
                  <i className="fa-solid fa-robot text-[#1E7E5A]" />
                  <span>Crawler & Auto-Importer Contínuo TudoGostoso</span>
                </h2>
                <p className="text-sm text-stone-600">
                  Este robô navega sozinho pelas categorias e receitas do{' '}
                  <strong>tudogostoso.com.br</strong>, descobre novos links automaticamente, verifica
                  o banco de dados para <strong>jamais repetir uma receita</strong> e já prepara a
                  voz e o relógio de cada passo!
                </p>
              </div>

              {/* Botões Gigantes de Pausar / Continuar */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold">
                  <span>Intervalo:</span>
                  <select
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Number(e.target.value))}
                    className="font-extrabold text-[#1E7E5A] bg-transparent focus:outline-none"
                  >
                    <option value={4}>A cada 4 seg (Rápido)</option>
                    <option value={7}>A cada 7 seg (Normal)</option>
                    <option value={15}>A cada 15 seg (Suave)</option>
                  </select>
                </div>

                {!autoStatus.isRunning ? (
                  <button
                    type="button"
                    onClick={handleStartAutoImporter}
                    className="px-6 py-3.5 rounded-2xl bg-[#1E7E5A] hover:bg-emerald-800 text-white font-extrabold text-sm shadow-lg flex items-center gap-2 transition"
                  >
                    <i className="fa-solid fa-play" />
                    <span>Iniciar / Continuar Importação Automática</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseAutoImporter}
                    className="px-6 py-3.5 rounded-2xl bg-[#C83E5B] hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg flex items-center gap-2 transition"
                  >
                    <i className="fa-solid fa-pause" />
                    <span>Pausar Robô Agora</span>
                  </button>
                )}
              </div>
            </div>

            {/* KPIs do Robô em Tempo Real */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-200/80">
              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <span className="text-xs font-bold text-stone-500 block">
                  RECEITAS IMPORTADAS NESTA SESSÃO
                </span>
                <p className="text-2xl font-extrabold text-[#1E7E5A] mt-1">
                  +{autoStatus.totalImportedInSession} novas
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <span className="text-xs font-bold text-stone-500 block">
                  REPETIDAS IGNORADAS (ANTI-CLONE)
                </span>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">
                  {autoStatus.totalSkippedDuplicates} filtradas
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <span className="text-xs font-bold text-stone-500 block">
                  FILA DE LINKS DESCOBERTOS
                </span>
                <p className="text-2xl font-extrabold text-stone-900 mt-1">
                  {autoStatus.queueSize} aguardando
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-stone-200">
                <span className="text-xs font-bold text-stone-500 block">
                  TOTAL NO BANCO AGORA
                </span>
                <p className="text-2xl font-extrabold text-[#C83E5B] mt-1">
                  {recipes.length} receitas
                </p>
              </div>
            </div>

            {/* Ação Atual */}
            <div className="mt-4 p-3.5 rounded-xl bg-stone-900 text-emerald-300 font-mono text-xs flex items-center gap-2">
              <i className="fa-solid fa-terminal" />
              <span>Status Ao Vivo: {autoStatus.currentAction}</span>
            </div>
          </div>

          {/* Console de Logs do Robô em Tempo Real */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm text-stone-900">
            <h3 className="font-serif-vovo text-xl font-bold mb-3 flex items-center gap-2">
              <i className="fa-solid fa-list-ul text-[#1E7E5A]" />
              <span>Histórico em Tempo Real do Auto-Importer</span>
            </h3>
            {autoStatus.recentLogs.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">
                Clique no botão verde <strong>&ldquo;Iniciar / Continuar Importação Automática&rdquo;</strong> acima para ver o robô puxando receitas inéditas ao vivo!
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
                {autoStatus.recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                      log.type === 'IMPORTED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : log.type === 'SKIPPED'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : log.type === 'CRAWLED'
                        ? 'bg-sky-50 border-sky-200 text-sky-900'
                        : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    <span>{log.message}</span>
                    <span className="opacity-60">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: VISÃO GERAL & GESTÃO DE RECEITAS VIP */}
      {activeSubTab === 'overview' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>RECEITA MENSAL ESTIMADA</span>
                <i className="fa-solid fa-sack-dollar text-[#1E7E5A] text-base" />
              </div>
              <p className="text-2xl font-extrabold text-[#1E7E5A]">
                R$ {dashboard.kpis.totalEstimatedMonthlyRevenue.toFixed(2).replace('.', ',')}
              </p>
              <span className="text-xs text-stone-500">
                VIP: R$ {dashboard.kpis.estimatedVipMrr} + AdSense: R$ {dashboard.kpis.estimatedAdsenseRevenue}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>ASSINANTES CLUBE VIP</span>
                <i className="fa-solid fa-crown text-amber-500 text-base" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900">
                {dashboard.kpis.vipUsersCount} <span className="text-sm font-normal">de {dashboard.kpis.totalUsers}</span>
              </p>
              <span className="text-xs text-amber-700 font-semibold">
                {dashboard.kpis.vipRecipesCount} receitas exclusivas VIP
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>CATÁLOGO DE RECEITAS</span>
                <i className="fa-solid fa-book-open text-[#C83E5B] text-base" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900">
                {recipes.length} receitas
              </p>
              <span className="text-xs text-stone-500">
                Sincronizadas com Sitemap SEO
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>AUDIÊNCIA TOTAL</span>
                <i className="fa-solid fa-eye text-sky-600 text-base" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900">
                {dashboard.kpis.totalViews.toLocaleString('pt-BR')} views
              </p>
              <span className="text-xs text-[#C83E5B] font-semibold flex items-center gap-1">
                <i className="fa-solid fa-heart" />
                <span>{dashboard.kpis.totalLikes} avaliações e curtidas</span>
              </span>
            </div>
          </div>

          <div
            className={`rounded-3xl border p-6 shadow-sm ${
              highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <h3 className="font-serif-vovo text-xl font-bold mb-1 flex items-center gap-2">
              <i className="fa-solid fa-crown text-amber-500" />
              <span>Transformar Receitas em Exclusivas VIP ou Gratuitas ({recipes.length})</span>
            </h3>
            <div className="divide-y divide-stone-200 dark:divide-stone-800 max-h-96 overflow-y-auto">
              {recipes.map((r) => (
                <div key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={r.imageUrl || '/images/logo-vovo.jpg'}
                      alt={r.title}
                      className="w-11 h-11 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-bold text-sm">{r.title}</p>
                      <span className="text-xs text-stone-500">
                        {r.category} • {r.viewsCount || 120} views
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleRecipeVip(r.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition ${
                      r.isVipOnly
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-amber-50'
                    }`}
                  >
                    <i className="fa-solid fa-crown" />
                    <span>{r.isVipOnly ? 'Exclusiva VIP' : 'Tornar VIP'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: GOOGLE ADSENSE & PREÇOS VIP */}
      {activeSubTab === 'monetization' && monetization && (
        <form
          onSubmit={handleSaveMonetization}
          className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 text-stone-900"
        >
          <div className="flex items-center justify-between border-b border-stone-200 pb-4">
            <div>
              <h3 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                <i className="fa-brands fa-google text-[#C83E5B]" />
                <span>Google AdSense & Cofre PIX (AES-256-GCM)</span>
              </h3>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
              <input
                type="checkbox"
                checked={monetization.adsenseEnabled}
                onChange={(e) =>
                  setMonetization({ ...monetization, adsenseEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-[#1E7E5A]"
              />
              <span className="text-xs font-extrabold text-emerald-950">
                Anúncios AdSense Ativos
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                Google AdSense Publisher ID:
              </label>
              <input
                type="text"
                value={monetization.adsenseClientId}
                onChange={(e) =>
                  setMonetization({ ...monetization, adsenseClientId: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 font-mono text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                Chave PIX Oficial (Criptografada em AES-256-GCM):
              </label>
              <input
                type="text"
                value={monetization.pixKey}
                onChange={(e) => setMonetization({ ...monetization, pixKey: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 font-mono text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                Preço Mensal VIP (R$):
              </label>
              <input
                type="number"
                step="0.10"
                value={monetization.vipMonthlyPrice}
                onChange={(e) =>
                  setMonetization({ ...monetization, vipMonthlyPrice: Number(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                Preço Anual VIP (R$):
              </label>
              <input
                type="number"
                step="0.10"
                value={monetization.vipAnnualPrice}
                onChange={(e) =>
                  setMonetization({ ...monetization, vipAnnualPrice: Number(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#1E7E5A] hover:bg-emerald-800 text-white font-bold text-sm shadow flex items-center gap-2"
          >
            <i className="fa-solid fa-floppy-disk" />
            <span>Salvar Configurações</span>
          </button>
        </form>
      )}

      {/* ABA 4: USUÁRIOS E VIPS */}
      {activeSubTab === 'users' && dashboard && (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm text-stone-900">
          <h3 className="font-serif-vovo text-xl font-bold mb-4 flex items-center gap-2">
            <i className="fa-solid fa-users text-[#1E7E5A]" />
            <span>Gestão de Usuários & Assinantes VIP ({dashboard.users.length})</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                  <th className="py-3 px-2">Nome</th>
                  <th className="py-3 px-2">E-mail</th>
                  <th className="py-3 px-2">Perfil</th>
                  <th className="py-3 px-2">Status VIP</th>
                  <th className="py-3 px-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {dashboard.users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-2 font-bold">{u.name}</td>
                    <td className="py-3 px-2 text-stone-600">{u.email}</td>
                    <td className="py-3 px-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {u.isVip ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 inline-flex items-center gap-1">
                          <i className="fa-solid fa-crown text-amber-600" />
                          <span>VIP Ativo</span>
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">Gratuito</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleUserVip(u.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                      >
                        {u.isVip ? 'Remover VIP' : 'Conceder VIP'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 5: CRIPTOGRAFIA, SEO E AUDITORIA */}
      {activeSubTab === 'security' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-stone-900 text-white border border-stone-700">
              <i className="fa-solid fa-key text-amber-400 text-xl mb-2 block" />
              <span className="text-xs uppercase text-stone-400 font-bold">Hash de Senhas</span>
              <p className="text-xs font-bold mt-1">{dashboard.security.passwordAlgorithm}</p>
            </div>
            <div className="p-5 rounded-2xl bg-stone-900 text-white border border-stone-700">
              <i className="fa-solid fa-signature text-emerald-400 text-xl mb-2 block" />
              <span className="text-xs uppercase text-stone-400 font-bold">Sessão & Captcha</span>
              <p className="text-xs font-bold mt-1">{dashboard.security.tokenAlgorithm}</p>
            </div>
            <div className="p-5 rounded-2xl bg-stone-900 text-white border border-stone-700">
              <i className="fa-solid fa-vault text-sky-400 text-xl mb-2 block" />
              <span className="text-xs uppercase text-stone-400 font-bold">Cofre PIX</span>
              <p className="text-xs font-bold mt-1">{dashboard.security.storageEncryption}</p>
            </div>
            <div className="p-5 rounded-2xl bg-stone-900 text-white border border-stone-700">
              <i className="fa-solid fa-sitemap text-rose-400 text-xl mb-2 block" />
              <span className="text-xs uppercase text-stone-400 font-bold">Google Search SEO</span>
              <a
                href="http://localhost:3333/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-amber-300 underline mt-1 inline-flex items-center gap-1"
              >
                <span>Abrir /sitemap.xml Dinâmico</span>
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm text-stone-900">
            <h3 className="font-serif-vovo text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-lock text-[#C83E5B]" />
              <span>Log de Auditoria Criptográfica</span>
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {dashboard.auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-300 font-mono font-bold">
                      {log.action}
                    </span>
                    <strong>{log.actor}</strong>
                    <span className="text-stone-600">— {log.details}</span>
                  </div>
                  <span className="text-stone-400 font-mono">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
