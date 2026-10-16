import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { getLastCloudSyncAt, pushLocalDataToCloudIfLoggedIn } from '../api/client';

interface CloudSyncNoticeProps {
  user: UserProfile | null;
  onOpenAuthModal: (mode: 'login' | 'register' | 'vip') => void;
  moduleName: string;
  priorityAlert?: boolean;
}

export const CloudSyncNotice: React.FC<CloudSyncNoticeProps> = ({
  user,
  onOpenAuthModal,
  moduleName,
  priorityAlert = false,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(() => getLastCloudSyncAt());
  const [justSyncedMsg, setJustSyncedMsg] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ updatedAt?: string }>;
      if (custom.detail?.updatedAt) {
        setLastSync(custom.detail.updatedAt);
      } else {
        setLastSync(getLastCloudSyncAt());
      }
    };
    window.addEventListener('vovo-cloud-synced', handler);
    return () => window.removeEventListener('vovo-cloud-synced', handler);
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    const updated = await pushLocalDataToCloudIfLoggedIn();
    setSyncing(false);
    if (updated) {
      setLastSync(updated);
      setJustSyncedMsg(true);
      setTimeout(() => setJustSyncedMsg(false), 3500);
    }
  };

  const formattedTime = lastSync
    ? new Date(lastSync).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : 'agora mesmo';

  if (user) {
    return (
      <div className="mb-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50/95 via-white to-emerald-50/80 dark:from-stone-900 dark:via-stone-900 dark:to-emerald-950/30 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#1E7E5A] text-white flex items-center justify-center text-lg shadow-sm shrink-0">
            <i className="fa-solid fa-cloud-arrow-up" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#1E7E5A] dark:text-emerald-300 flex items-center gap-1.5">
                <i className="fa-solid fa-circle-check" />
                Salvo Permanentemente na Nuvem
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">
                Último backup às {formattedTime}
              </span>
            </div>
            <p className="text-sm font-bold text-stone-800 dark:text-stone-100 mt-1">
              Olá, {user.name.split(' ')[0]}! Todos os dados de{' '}
              <span className="text-[#1E7E5A] dark:text-emerald-400">{moduleName}</span> estão
              vinculados permanentemente à sua conta ({user.email}).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualSync}
          disabled={syncing}
          className="px-4 py-2 rounded-xl bg-[#1E7E5A] hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition shrink-0"
        >
          <i className={`fa-solid ${syncing ? 'fa-spinner fa-spin' : 'fa-rotate'}`} />
          <span>{justSyncedMsg ? 'Salvo na Nuvem!' : 'Salvar na Nuvem Agora'}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`mb-6 rounded-3xl border-2 p-5 sm:p-6 shadow-sm transition ${
        priorityAlert
          ? 'bg-gradient-to-r from-amber-50 via-rose-50/70 to-amber-50/80 border-amber-300 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 dark:border-amber-700/70'
          : 'bg-gradient-to-r from-amber-50/80 via-white to-rose-50/60 border-amber-200/90 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 dark:border-stone-700'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500 text-white shadow-sm">
              <i className="fa-solid fa-cloud-bolt" />
              Modo Sem Login Ativo (Salvo Apenas Neste Aparelho)
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1E7E5A] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <i className="fa-solid fa-unlock" />
              100% Liberado para Testar
            </span>
          </div>

          <h3 className="font-serif-vovo text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-amber-300 leading-snug">
            Crie uma conta gratuita para salvar {moduleName} permanentemente!
          </h3>

          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            Você pode usar todas as ferramentas livremente sem login! Mas atenção: sem uma conta, se
            você limpar o navegador ou trocar de celular, seus dados podem ser apagados.{' '}
            <strong className="text-[#C83E5B] dark:text-rose-400">
              Crie sua Conta Gratuita da Vovó em 30 segundos
            </strong>{' '}
            para que tudo o que você já preencheu aqui seja salvo automaticamente na nuvem para
            sempre!
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-300">
            <span className="inline-flex items-center gap-1.5 bg-white/90 dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
              <i className="fa-solid fa-pills text-[#C83E5B]" />
              Remédios & Horários Salvos
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/90 dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
              <i className="fa-solid fa-calendar-check text-[#1E7E5A]" />
              Cardápio & Lista de Feira
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/90 dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
              <i className="fa-solid fa-book-bookmark text-amber-600" />
              Livro PDF da Família
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/90 dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
              <i className="fa-solid fa-heart text-rose-500" />
              Caderninho de Favoritas
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenAuthModal('register')}
            className="px-5 py-3 rounded-2xl bg-[#C83E5B] hover:bg-rose-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition"
          >
            <i className="fa-solid fa-user-plus" />
            <span>Criar Conta Grátis e Salvar Tudo</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAuthModal('login')}
            className="px-5 py-2.5 rounded-2xl bg-white hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 border border-stone-300 dark:border-stone-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
          >
            <i className="fa-solid fa-right-to-bracket text-[#1E7E5A]" />
            <span>Já Tenho Conta (Entrar)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
