import React, { useEffect, useState } from 'react';
import {
  fetchAdminDashboard,
  fetchMonetizationConfig,
  toggleRecipeVipAdminApi,
  toggleUserVipAdminApi,
  updateMonetizationConfigApi,
} from '../api/client';
import { AdminDashboardData, MonetizationConfig, Recipe, UserProfile } from '../types';

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
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'monetization' | 'users' | 'security'>('overview');
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [monetization, setMonetization] = useState<MonetizationConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAdminData = async () => {
    if (!user || user.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const [dashData, monData] = await Promise.all([
        fetchAdminDashboard(),
        fetchMonetizationConfig(),
      ]);
      setDashboard(dashData);
      setMonetization(monData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="rounded-3xl border-2 border-amber-300 bg-white p-8 shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center mx-auto">
            <i className="fa-solid fa-shield-halved text-3xl" />
          </div>
          <h2 className="font-serif-vovo text-3xl font-bold text-stone-900">
            Painel Administrativo & Segurança Criptográfica
          </h2>
          <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
            Esta área é protegida por autenticação <strong>HMAC-SHA256</strong> e criptografia{' '}
            <strong>AES-256-GCM</strong>. Faça login com a conta de Administrador para gerenciar
            usuários VIP, Google AdSense, receitas e logs de segurança.
          </p>
          <button
            type="button"
            onClick={() => onOpenAuthModal('login')}
            className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-sm inline-flex items-center gap-2 shadow"
          >
            <i className="fa-solid fa-key" />
            <span>Entrar como Administrador (1 Clique na Janela de Login)</span>
          </button>
        </div>
      </div>
    );
  }

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
      <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-gauge-high text-2xl" />
          </div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              Central de Controle • {user.email}
            </span>
            <h1 className="font-serif-vovo text-2xl sm:text-3xl font-bold">
              Painel Administrativo, Monetização & Criptografia
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onGoToImporter}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-2 transition"
          >
            <i className="fa-solid fa-cloud-arrow-down" />
            <span>Abrir Importer TudoGostoso</span>
          </button>
          <button
            type="button"
            onClick={loadAdminData}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} />
            <span>Atualizar Dados</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-400 text-emerald-950 font-bold text-sm flex items-center gap-2">
          <i className="fa-solid fa-circle-check text-emerald-700 text-lg" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Sub-Abas do Painel */}
      <div className="flex flex-wrap gap-2 border-b border-amber-200 pb-3">
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
          <span>Google AdSense & Preços VIP</span>
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
          <span>Gestão de Contas & Assinantes VIP</span>
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
          <span>Criptografia & Auditoria</span>
        </button>
      </div>

      {/* ABA 1: VISÃO GERAL, FINANÇAS E GESTÃO DE RECEITAS VIP */}
      {activeSubTab === 'overview' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>RECEITA MENSAL ESTIMADA</span>
                <i className="fa-solid fa-sack-dollar text-emerald-600 text-base" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-700">
                R$ {dashboard.kpis.totalEstimatedMonthlyRevenue.toFixed(2).replace('.', ',')}
              </p>
              <span className="text-xs text-stone-500">
                VIP: R$ {dashboard.kpis.estimatedVipMrr} + AdSense: R$ {dashboard.kpis.estimatedAdsenseRevenue}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>ASSINANTES CLUBE VIP</span>
                <i className="fa-solid fa-crown text-amber-500 text-base" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900">
                {dashboard.kpis.vipUsersCount} <span className="text-sm font-normal">de {dashboard.kpis.totalUsers} contas</span>
              </p>
              <span className="text-xs text-amber-700 font-semibold">
                {dashboard.kpis.vipRecipesCount} receitas marcadas como VIP
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>CATÁLOGO DE RECEITAS</span>
                <i className="fa-solid fa-book-open text-amber-700 text-base" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900">
                {dashboard.kpis.totalRecipes} receitas
              </p>
              <span className="text-xs text-stone-500">
                {dashboard.kpis.importedRecipesCount} vindas do TudoGostoso
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>AUDIÊNCIA & ENGAJAMENTO</span>
                <i className="fa-solid fa-eye text-sky-600 text-base" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900">
                {dashboard.kpis.totalViews.toLocaleString('pt-BR')} views
              </p>
              <span className="text-xs text-rose-600 font-semibold">
                ❤️ {dashboard.kpis.totalLikes} curtidas nas receitas
              </span>
            </div>
          </div>

          {/* Controle Rápido: Tornar Receitas Exclusivas VIP ou Gratuitas */}
          <div
            className={`rounded-3xl border p-6 shadow-sm ${
              highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-amber-200'
            }`}
          >
            <h3 className="font-serif-vovo text-xl font-bold mb-1">
              👑 Gerenciar Acesso das Receitas (Gratuitas vs Exclusivas Clube VIP)
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Clique no botão ao lado de qualquer receita para transformá-la em conteúdo exclusivo para assinantes VIP:
            </p>

            <div className="divide-y divide-stone-200 dark:divide-stone-800">
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
                        {r.category} • {r.viewsCount || 120} visualizações
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
                    <span>{r.isVipOnly ? 'Exclusiva VIP (Ativo)' : 'Tornar Exclusiva VIP'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: GOOGLE ADSENSE E MONETIZAÇÃO VIP */}
      {activeSubTab === 'monetization' && monetization && (
        <form
          onSubmit={handleSaveMonetization}
          className="rounded-3xl border border-amber-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 text-stone-900"
        >
          <div className="flex items-center justify-between border-b border-stone-200 pb-4">
            <div>
              <h3 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                <i className="fa-brands fa-google text-amber-600" />
                <span>Integração Google AdSense & Planos Clube VIP</span>
              </h3>
              <p className="text-xs text-stone-500">
                Configure seus códigos de anúncio e valores de assinatura. A chave PIX é armazenada criptografada em AES-256-GCM.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
              <input
                type="checkbox"
                checked={monetization.adsenseEnabled}
                onChange={(e) =>
                  setMonetization({ ...monetization, adsenseEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-600"
              />
              <span className="text-xs font-extrabold text-amber-950">
                Exibir Anúncios AdSense (Visitantes Grátis)
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                Google AdSense Publisher ID (Client ID):
              </label>
              <input
                type="text"
                value={monetization.adsenseClientId}
                onChange={(e) =>
                  setMonetization({ ...monetization, adsenseClientId: e.target.value })
                }
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 font-mono text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                Chave PIX Oficial (Criptografada com AES-256-GCM):
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
                Slot AdSense Topo (Header Banner):
              </label>
              <input
                type="text"
                value={monetization.adsenseHeaderSlot}
                onChange={(e) =>
                  setMonetization({ ...monetization, adsenseHeaderSlot: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                Slot AdSense Página da Receita:
              </label>
              <input
                type="text"
                value={monetization.adsenseRecipeSlot}
                onChange={(e) =>
                  setMonetization({ ...monetization, adsenseRecipeSlot: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
                Preço Assinatura VIP Mensal (R$):
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
                Preço Assinatura VIP Anual (R$):
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
            className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow flex items-center gap-2"
          >
            <i className="fa-solid fa-floppy-disk" />
            <span>Salvar Configurações de Monetização & Criptografar PIX</span>
          </button>
        </form>
      )}

      {/* ABA 3: GESTÃO DE CONTAS E ASSINANTES VIP */}
      {activeSubTab === 'users' && dashboard && (
        <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm text-stone-900">
          <h3 className="font-serif-vovo text-xl font-bold mb-4">
            👥 Usuários Cadastrados & Controle de Assinaturas VIP ({dashboard.users.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                  <th className="py-3 px-2">Nome</th>
                  <th className="py-3 px-2">E-mail</th>
                  <th className="py-3 px-2">Perfil</th>
                  <th className="py-3 px-2">Status VIP</th>
                  <th className="py-3 px-2 text-right">Ação Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {dashboard.users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-2 font-bold">{u.name}</td>
                    <td className="py-3 px-2 text-stone-600">{u.email}</td>
                    <td className="py-3 px-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {u.isVip ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900">
                          👑 VIP Ativo ({u.vipPlan || 'ANUAL'})
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

      {/* ABA 4: CRIPTOGRAFIA E AUDITORIA DE SEGURANÇA */}
      {activeSubTab === 'security' && dashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-stone-900 text-white border border-stone-700">
              <i className="fa-solid fa-key text-amber-400 text-xl mb-2 block" />
              <span className="text-xs uppercase text-stone-400 font-bold">Hash de Senhas</span>
              <p className="text-sm font-bold mt-1">{dashboard.security.passwordAlgorithm}</p>
            </div>
            <div className="p-5 rounded-2xl bg-stone-900 text-white border border-stone-700">
              <i className="fa-solid fa-signature text-emerald-400 text-xl mb-2 block" />
              <span className="text-xs uppercase text-stone-400 font-bold">Assinatura de Sessão</span>
              <p className="text-sm font-bold mt-1">{dashboard.security.tokenAlgorithm}</p>
            </div>
            <div className="p-5 rounded-2xl bg-stone-900 text-white border border-stone-700">
              <i className="fa-solid fa-vault text-sky-400 text-xl mb-2 block" />
              <span className="text-xs uppercase text-stone-400 font-bold">Cofre de Dados</span>
              <p className="text-sm font-bold mt-1">{dashboard.security.storageEncryption}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm text-stone-900">
            <h3 className="font-serif-vovo text-xl font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-clipboard-list text-amber-700" />
              <span>Registro de Auditoria Criptográfica em Tempo Real</span>
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {dashboard.auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-300 font-mono font-bold">
                      {log.action}
                    </span>
                    <strong className="text-stone-800">{log.actor}</strong>
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
