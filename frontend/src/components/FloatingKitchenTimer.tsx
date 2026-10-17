import React, { useEffect, useState } from 'react';
import { playKitchenAlarmSound, useVoiceReader } from '../hooks/useVoiceReader';

interface FloatingKitchenTimerProps {
  highContrastDark: boolean;
  onOpenCookingTab: () => void;
}

export const FloatingKitchenTimer: React.FC<FloatingKitchenTimerProps> = ({
  highContrastDark,
  onOpenCookingTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerLabel, setTimerLabel] = useState('Bolo no Forno');

  const { speakText } = useVoiceReader();

  useEffect(() => {
    if (!isRunning || timerSecondsLeft === null) return;

    if (timerSecondsLeft <= 0) {
      setIsRunning(false);
      setTimerSecondsLeft(null);
      playKitchenAlarmSound();
      speakText(`Atenção, meu amor! O timer ${timerLabel} acabou de apitar! Olhe o forno com carinho!`);
      setIsOpen(true);
      return;
    }

    const interval = setInterval(() => {
      setTimerSecondsLeft((s) => (s !== null && s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timerSecondsLeft, timerLabel, speakText]);

  const startTimerPreset = (mins: number, label: string) => {
    const sec = mins * 60;
    setTotalSeconds(sec);
    setTimerSecondsLeft(sec);
    setTimerLabel(label);
    setIsRunning(true);
    setIsOpen(true);
    speakText(`Cronômetro de ${mins} minutos para ${label} iniciado!`);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setTimerSecondsLeft(null);
  };

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const percent =
    timerSecondsLeft !== null && totalSeconds > 0
      ? Math.max(0, Math.min(100, Math.round(((totalSeconds - timerSecondsLeft) / totalSeconds) * 100)))
      : 0;

  return (
    <div className="no-print fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Widget expandido */}
      {isOpen && (
        <div
          className={`mb-3 w-80 p-5 rounded-3xl border shadow-2xl space-y-4 animate-fadeIn overflow-hidden ${
            highContrastDark
              ? 'bg-stone-900 border-stone-700 text-stone-100'
              : 'bg-white border-rose-200 text-stone-800'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#C83E5B] text-white flex items-center justify-center text-sm shadow-xs">
                <i className="fa-solid fa-fire-burner animate-pulse" />
              </span>
              <div>
                <h4 className="font-extrabold text-xs leading-none">Panela no Fogo</h4>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">Timer Flutuante da Vovó</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 flex items-center justify-center text-xs"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {timerSecondsLeft !== null ? (
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-[#C83E5B] dark:text-rose-300 block truncate">
                {timerLabel}
              </span>
              <div className="font-mono text-4xl font-black text-stone-900 dark:text-white">
                {formatTime(timerSecondsLeft)}
              </div>

              {/* Barra de progresso */}
              <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C83E5B] to-amber-500 transition-all duration-1000"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRunning((r) => !r)}
                  className="px-4 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 font-extrabold text-xs"
                >
                  <i className={`fa-solid ${isRunning ? 'fa-pause' : 'fa-play'} mr-1`} />
                  {isRunning ? 'Pausar' : 'Continuar'}
                </button>
                <button
                  type="button"
                  onClick={stopTimer}
                  className="px-4 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#C83E5B] dark:text-rose-300 font-extrabold text-xs hover:bg-rose-100"
                >
                  Zerar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold">
                Inicie um timer rápido para não queimar nada no forno ou fogão:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { mins: 5, label: 'Ovo Cozido (5 min)' },
                  { mins: 15, label: 'Macarrão / Arroz (15 min)' },
                  { mins: 30, label: 'Torta / Pão (30 min)' },
                  { mins: 45, label: 'Bolo no Forno (45 min)' },
                ].map((p) => (
                  <button
                    key={p.mins}
                    type="button"
                    onClick={() => startTimerPreset(p.mins, p.label)}
                    className="p-2.5 rounded-xl bg-[#F8F6F2] dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-stone-700 text-left border border-stone-200 dark:border-stone-700 transition"
                  >
                    <span className="font-extrabold text-xs block text-[#C83E5B] dark:text-rose-300">
                      {p.mins} minutos
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
                      {p.label.split('(')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenCookingTab();
            }}
            className="w-full py-2 rounded-xl bg-[#1E7E5A] hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <i className="fa-solid fa-kitchen-set" />
            <span>Abrir Estúdio Modo Cozinha</span>
          </button>
        </div>
      )}

      {/* Botão flutuante compacto */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Timer de Cozinha"
        className={`px-4 py-3 rounded-full font-extrabold text-xs flex items-center gap-2.5 shadow-2xl transition transform hover:scale-105 active:scale-95 border-2 ${
          isRunning
            ? 'bg-gradient-to-r from-[#C83E5B] to-amber-600 text-white border-amber-300 animate-pulse'
            : 'bg-[#C83E5B] hover:bg-rose-700 text-white border-white/40'
        }`}
      >
        <i className="fa-solid fa-fire-burner text-base" />
        {isRunning && timerSecondsLeft !== null ? (
          <span className="font-mono text-sm font-black">{formatTime(timerSecondsLeft)}</span>
        ) : (
          <span>Panela no Fogo</span>
        )}
      </button>
    </div>
  );
};
