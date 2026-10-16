import React, { useState, useEffect } from 'react';
import {
  fetchCaptchaChallenge,
  loginApi,
  registerApi,
  syncUserCloudDataOnLogin,
  upgradeToVipApi,
} from '../api/client';
import { UserProfile, CaptchaChallenge } from '../types';

interface Props {
  isOpen: boolean;
  initialTab?: 'login' | 'register' | 'vip';
  user: UserProfile | null;
  vipMonthlyPrice: number;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthVipModal: React.FC<Props> = ({
  isOpen,
  initialTab = 'login',
  user,
  vipMonthlyPrice,
  onClose,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'vip'>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<'MENSAL' | 'ANUAL'>('MENSAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Custom Self-Hosted Captcha state
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const loadCaptcha = async () => {
    try {
      const ch = await fetchCaptchaChallenge();
      setCaptcha(ch);
      setCaptchaAnswer('');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      loadCaptcha();
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await loginApi(email, password);
      await syncUserCloudDataOnLogin();
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await registerApi({ name, email, password });
      await syncUserCloudDataOnLogin();
      onAuthSuccess(res.user);
      setTab('vip');
      setSuccessMsg(
        'Conta criada e seus remédios, cardápio e receitas já estão salvos permanentemente na nuvem!'
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeVip = async () => {
    if (!user) {
      setTab('register');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await upgradeToVipApi(plan, 'PIX');
      onAuthSuccess(res.user);
      setSuccessMsg(res.message);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@cadernodavovo.com.br');
    setPassword('AdminVovo@2026');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#C83E5B] via-rose-600 to-amber-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white"
            aria-label="Fechar janela"
          >
            <i className="fa-solid fa-xmark" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">
              <i className="fa-solid fa-crown text-amber-200" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold">Família Caderno da Vovó</h3>
              <p className="text-xs text-rose-100">Segurança Criptografada Scrypt + Captcha Próprio</p>
            </div>
          </div>

          <div className="flex gap-2 mt-5 bg-black/15 p-1 rounded-xl">
            <button
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === 'login' ? 'bg-white text-stone-900 shadow' : 'text-white hover:bg-white/10'
              }`}
            >
              <i className="fa-solid fa-right-to-bracket mr-1.5" /> Entrar
            </button>
            <button
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === 'register' ? 'bg-white text-stone-900 shadow' : 'text-white hover:bg-white/10'
              }`}
            >
              <i className="fa-solid fa-user-plus mr-1.5" /> Criar Conta
            </button>
            <button
              onClick={() => { setTab('vip'); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === 'vip' ? 'bg-amber-300 text-amber-950 shadow' : 'text-amber-100 hover:bg-white/10'
              }`}
            >
              <i className="fa-solid fa-crown mr-1.5" /> Clube VIP
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation" /> {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
              <i className="fa-solid fa-circle-check" /> {successMsg}
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Seu E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[#C83E5B] focus:outline-none text-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Sua Senha</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[#C83E5B] focus:outline-none text-stone-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#C83E5B] hover:bg-rose-700 text-white font-bold shadow-md transition-all"
              >
                {loading ? 'Autenticando...' : 'Entrar no Caderno da Vovó'}
              </button>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Acesso rápido para testar o Painel Admin:</span>
                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="text-[#C83E5B] hover:underline font-bold"
                >
                  Preencher Admin Demo
                </button>
              </div>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-stone-700 space-y-1">
                <p className="font-extrabold text-[#1E7E5A] flex items-center gap-1.5 text-sm">
                  <i className="fa-solid fa-cloud-arrow-up" />
                  <span>Por que criar sua Conta Gratuita da Vovó?</span>
                </p>
                <p className="leading-relaxed">
                  Ao criar sua conta, tudo o que você já preencheu (horários de{' '}
                  <strong>remédios</strong>, <strong>copos d’água</strong>,{' '}
                  <strong>cardápio da semana</strong>, <strong>lista de feira</strong>,{' '}
                  <strong>livro PDF</strong> e <strong>favoritas</strong>) fica salvo
                  permanentemente na nuvem para nunca se perder!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Como gosta de ser chamado(a)?</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Vovó Maria"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[#C83E5B] focus:outline-none text-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Seu E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[#C83E5B] focus:outline-none text-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Crie uma Senha Segura (mín. 6 letras/números)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-[#C83E5B] focus:outline-none text-stone-800"
                />
              </div>

              {/* Captcha Própria SVG */}
              {captcha && (
                <div className="p-3 rounded-2xl bg-[#F8F6F2] border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <i className="fa-solid fa-shield-halved text-[#1E7E5A]" /> Captcha Próprio da Vovó:
                    </span>
                    <button
                      type="button"
                      onClick={loadCaptcha}
                      className="text-xs text-[#C83E5B] font-bold hover:underline"
                    >
                      <i className="fa-solid fa-rotate mr-1" /> Outra conta
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={captcha.svgDataUri}
                      alt="Captcha de segurança"
                      className="h-12 rounded-xl border border-stone-300"
                    />
                    <input
                      type="number"
                      required
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      placeholder="Resultado?"
                      className="w-28 px-3 py-2.5 rounded-xl border border-stone-300 font-bold text-center text-stone-800 focus:border-[#C83E5B] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#1E7E5A] hover:bg-emerald-800 text-white font-bold shadow-md transition-all"
              >
                {loading ? 'Criando conta...' : 'Criar Minha Conta Gratuita'}
              </button>
            </form>
          )}

          {tab === 'vip' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <h4 className="font-extrabold text-amber-950 text-base flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-sparkles text-amber-600" /> Benefícios Exclusivos do Clube VIP
                </h4>
                <ul className="space-y-2 text-sm text-stone-700">
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-check text-[#1E7E5A]" /> Zero anúncios (navegação 100% limpa sem Google AdSense)
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-check text-[#1E7E5A]" /> Acesso liberado às Receitas Secretas de Família VIP
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-check text-[#1E7E5A]" /> Caderno em PDF para imprimir e presentear os netos
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-check text-[#1E7E5A]" /> Voz neural prioritária no Modo Cozinha Guiado
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPlan('MENSAL')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    plan === 'MENSAL'
                      ? 'border-[#C83E5B] bg-rose-50/60'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="text-xs font-bold text-stone-500 uppercase">Plano Mensal</span>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1">
                    R$ {vipMonthlyPrice.toFixed(2).replace('.', ',')}
                    <span className="text-xs font-normal text-stone-500">/mês</span>
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPlan('ANUAL')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                    plan === 'ANUAL'
                      ? 'border-[#C83E5B] bg-rose-50/60'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="absolute -top-2.5 right-3 bg-[#1E7E5A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    2 MESES GRÁTIS
                  </span>
                  <span className="text-xs font-bold text-stone-500 uppercase">Plano Anual</span>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1">
                    R$ {(vipMonthlyPrice * 10).toFixed(2).replace('.', ',')}
                    <span className="text-xs font-normal text-stone-500">/ano</span>
                  </p>
                </button>
              </div>

              <button
                onClick={handleUpgradeVip}
                disabled={loading || Boolean(user?.isVip)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-[#C83E5B] hover:from-amber-600 hover:to-rose-700 text-white font-extrabold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-crown" />
                {user?.isVip
                  ? 'Você já é Membro VIP Ativo!'
                  : loading
                  ? 'Ativando Clube VIP...'
                  : 'Ativar Assinatura VIP Agora'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
