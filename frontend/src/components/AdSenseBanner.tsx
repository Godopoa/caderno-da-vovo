import React, { useEffect } from 'react';
import { MonetizationConfig, UserProfile } from '../types';

interface AdSenseBannerProps {
  config: MonetizationConfig | null;
  user: UserProfile | null;
  slotType: 'header' | 'infeed' | 'recipe';
  onOpenVipModal: () => void;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  config,
  user,
  slotType,
  onOpenVipModal,
}) => {
  // Assinantes VIP não veem anúncios!
  if (user?.isVip) return null;
  if (config && !config.adsenseEnabled) return null;

  const clientId = config?.adsenseClientId || 'ca-pub-7788990011223344';
  const slotId =
    slotType === 'header'
      ? config?.adsenseHeaderSlot || '1010101010'
      : slotType === 'infeed'
      ? config?.adsenseInFeedSlot || '2020202020'
      : config?.adsenseRecipeSlot || '3030303030';

  useEffect(() => {
    try {
      if (clientId && !clientId.includes('000000')) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      // Ignora em ambiente local sem script externo ativo
    }
  }, [clientId, slotId]);

  return (
    <div className="no-print my-6 max-w-7xl mx-auto px-4">
      <div className="relative rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 p-4 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <i className="fa-solid fa-bullhorn text-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200/70 text-amber-900">
                  Publicidade • Google AdSense ({slotId})
                </span>
                <span className="text-xs text-stone-500 hidden md:inline">
                  ID: {clientId}
                </span>
              </div>
              <p className="text-sm font-semibold text-stone-700 mt-0.5">
                Utensílios de Cozinha, Formas Antiaderentes e Eletrodomésticos com Desconto Especial da Vovó!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenVipModal}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-sm flex items-center gap-2 transition"
          >
            <i className="fa-solid fa-crown text-amber-200" />
            <span>Remover Anúncios (Seja VIP)</span>
          </button>
        </div>

        {/* Tag oficial do Google AdSense */}
        <ins
          className="adsbygoogle block"
          style={{ display: 'block', height: '1px' }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};
