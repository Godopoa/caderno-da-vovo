import React, { useState } from 'react';
import { loginApi, registerApi, upgradeToVipApi } from '../api/client';
import { MonetizationConfig, UserProfile } from '../types';

interface AuthVipModalProps {
  initialMode: 'login' | 'register' | 'vip';
  user: UserProfile | null;
  monetization: MonetizationConfig | null;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthVipModal: React.FC<AuthVipModalProps> = ({
  initialMode,
  user,
  monetization,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'vip'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [wantVipOnRegister, setWantVipOnRegister] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'MENSAL' | 'ANUAL'>('ANUAL');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARTAO'>('PIX');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const monthlyPrice = monetization?.vipMonthlyPrice ?? 14.9;
  const annualPrice = monetization?.vipAnnualPrice ?? 119.9;
  const pixKey = monetization?.pixKey || 'clubevip@cadernodavovo.com.br';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await loginApi(email, password);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginApi(demoEmail, demoPass);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro no login rápido.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await registerApi({
        name,
        email,
        password,
        wantVip: wantVipOnRegister,
        vipPlan: selectedPlan,
      });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeVip = async () => {
    if (!user) {
      setMode('register');
      setWantVipOnRegister(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await upgradeToVipApi(selectedPlan, paymentMethod);
      setSuccessMsg(res.message);
      onAuthSuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Erro ao ativar assinatura VIP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FDFBF7] border-2 border-amber-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-8">
        {/* Topo Decorativo Afetivo */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-orange-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-vovo.jpg"
              alt="Logo Vovó"
              className="w-11 h-11 rounded-full object-cover border-2 border-amber-200"
            />
            <div>
              <h3 className="font-serif-vovo text-xl font-bold">
                {mode === 'vip'
                  ? 'Clube VIP da Vovó'
                  : mode === 'login'
                  ? 'Bem-vindo de volta!'
                  : 'Criar Conta no Caderno'}
              </h3>
              <p className="text-xs text-amber-100 flex items-center gap-1.5">
                <i className="fa-solid fa-lock text-[10px]" />
                <span>Protegido com Criptografia Scrypt & AES-256-GCM</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        {/* Abas */}
        <div className="grid grid-cols-3 bg-amber-100/60 p-1.5 gap-1 border-b border-amber-200 text-sm font-bold">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 rounded-xl transition ${
              mode === 'login' ? 'bg-white text-amber-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <i className="fa-solid fa-right-to-bracket mr-1.5" />
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 rounded-xl transition ${
              mode === 'register' ? 'bg-white text-amber-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <i className="fa-solid fa-user-plus mr-1.5" />
            Criar Conta
          </button>
          <button
            type="button"
            onClick={() => setMode('vip')}
            className={`py-2 rounded-xl transition ${
              mode === 'vip'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm'
                : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            <i className="fa-solid fa-crown mr-1.5" />
            Clube VIP
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-sm font-bold flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' && (
            <div className="space-y-4">
              {/* Botões de Acesso Rápido 1-Clique para Testar Admin e VIP */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  ⚡ Acesso Rápido de Demonstração (1 Clique):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin@cadernodavovo.com.br', 'vovo123')}
                    className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <i className="fa-solid fa-shield-halved" />
                    <span>Entrar como Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('vip@cadernodavovo.com.br', 'vip123')}
                    className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <i className="fa-solid fa-crown" />
                    <span>Entrar como Membro VIP</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    Seu E-mail:
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com.br"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:outline-none text-sm font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    Sua Senha:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:outline-none text-sm font-semibold"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-base shadow-md transition"
                >
                  {loading ? 'Autenticando...' : 'Entrar no Caderno da Vovó'}
                </button>
              </form>
            </div>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  Seu Nome ou Apelido Carinhoso:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Vovó Ana / João"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  Seu Melhor E-mail:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com.br"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  Crie uma Senha Segura:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 4 caracteres"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
                  required
                />
              </div>

              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantVipOnRegister}
                  onChange={(e) => setWantVipOnRegister(e.target.checked)}
                  className="w-5 h-5 accent-amber-600"
                />
                <span className="text-sm font-bold text-amber-950">
                  👑 Já quero ativar o <strong>Clube VIP da Vovó</strong> (Sem anúncios + Receitas Exclusivas!)
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-base shadow-md transition"
              >
                {loading ? 'Criando sua conta...' : 'Criar Minha Conta Agora'}
              </button>
            </form>
          )}

          {mode === 'vip' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                <h4 className="font-serif-vovo text-lg font-bold text-amber-950 mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-crown text-amber-600" />
                  <span>Vantagens Exclusivas do Clube VIP:</span>
                </h4>
                <ul className="space-y-2 text-sm font-semibold text-stone-700">
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-check text-emerald-600" />
                    <span>Acesso liberado a todas as <strong>Receitas Secretas & Gourmet da Vovó</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-check text-emerald-600" />
                    <span><strong>Navegação 100% Sem Anúncios</strong> (Google AdSense desativado para você)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-check text-emerald-600" />
                    <span><strong>Segredinhos Culinários da Vovó</strong> em todas as receitas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-check text-emerald-600" />
                    <span>Impressão de Apostilas / Livrinho de Receitas em PDF</span>
                  </li>
                </ul>
              </div>

              {/* Escolha do Plano */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('MENSAL')}
                  className={`p-4 rounded-2xl border-2 text-left transition ${
                    selectedPlan === 'MENSAL'
                      ? 'border-amber-600 bg-amber-50/70'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold uppercase text-stone-500">Plano Mensal</span>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1">
                    R$ {monthlyPrice.toFixed(2).replace('.', ',')}
                    <span className="text-xs font-normal text-stone-500">/mês</span>
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('ANUAL')}
                  className={`relative p-4 rounded-2xl border-2 text-left transition ${
                    selectedPlan === 'ANUAL'
                      ? 'border-amber-600 bg-amber-50/70'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                    MAIS ESCOLHIDO (-33%)
                  </span>
                  <span className="text-xs font-bold uppercase text-stone-500">Plano Anual</span>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1">
                    R$ {annualPrice.toFixed(2).replace('.', ',')}
                    <span className="text-xs font-normal text-stone-500">/ano</span>
                  </p>
                </button>
              </div>

              {/* Método de Pagamento */}
              <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition ${
                      paymentMethod === 'PIX'
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    <i className="fa-brands fa-pix mr-1.5" />
                    PIX Instantâneo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARTAO')}
                    className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition ${
                      paymentMethod === 'CARTAO'
                        ? 'bg-amber-700 text-white border-amber-800'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    <i className="fa-solid fa-credit-card mr-1.5" />
                    Cartão de Crédito
                  </button>
                </div>

                {paymentMethod === 'PIX' && (
                  <div className="text-xs bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-stone-500 block">Chave PIX Oficial (AES-256):</span>
                      <strong className="text-stone-900 font-mono text-sm">{pixKey}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(pixKey)}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 font-bold hover:bg-amber-200"
                    >
                      Copiar PIX
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleUpgradeVip}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-base shadow-lg flex items-center justify-center gap-2 transition"
              >
                <i className="fa-solid fa-crown" />
                <span>
                  {user?.isVip
                    ? 'Você já é Membro VIP Ativo! ✨'
                    : loading
                    ? 'Ativando Benefícios VIP...'
                    : 'Ativar Minha Conta VIP Agora'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
