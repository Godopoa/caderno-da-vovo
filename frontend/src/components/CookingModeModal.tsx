import React, { useEffect, useState } from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  AlarmClock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Recipe } from '../types';
import { playKitchenAlarmSound, useVoiceReader } from '../hooks/useVoiceReader';

interface CookingModeModalProps {
  recipe: Recipe;
  onClose: () => void;
  highContrastDark: boolean;
}

export const CookingModeModal: React.FC<CookingModeModalProps> = ({
  recipe,
  onClose,
  highContrastDark,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoRead, setAutoRead] = useState(true);
  const { isSpeaking, voiceRate, setVoiceRate, speakText, stopSpeaking } = useVoiceReader();

  const steps = recipe.steps || [];
  const currentStep = steps[currentIndex];

  // Estado do Relógio / Timer do Passo Atual
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);

  // Mantém a tela do celular ou computador acesa durante o Modo Cozinha
  useEffect(() => {
    let wakeLock: any = null;
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Ignora se o navegador não suportar WakeLock
      }
    }
    requestWakeLock();
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Atualiza o timer e lê o passo em voz alta ao mudar de passo
  useEffect(() => {
    if (!currentStep) return;

    setTimerRunning(false);
    setTimerFinished(false);
    if (currentStep.timerSeconds && currentStep.timerSeconds > 0) {
      setTimeLeft(currentStep.timerSeconds);
    } else {
      setTimeLeft(null);
    }

    if (autoRead) {
      const textToRead = `Passo ${currentIndex + 1} de ${steps.length}. ${currentStep.instruction}`;
      speakText(textToRead);
    }
  }, [currentIndex, currentStep, steps.length, autoRead, speakText]);

  // Contagem regressiva do relógio
  useEffect(() => {
    if (!timerRunning || timeLeft === null) return;

    if (timeLeft <= 0) {
      setTimerRunning(false);
      setTimerFinished(true);
      playKitchenAlarmSound();
      speakText('Atenção! O tempo do relógio deste passo terminou!');
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, timeLeft, speakText]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!currentStep) return null;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Modo Cozinha: ${recipe.title}`}
      className={`fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto p-4 sm:p-8 ${
        highContrastDark ? 'bg-stone-950 text-amber-50' : 'bg-[#FFFDF9] text-[#1C1917]'
      }`}
    >
      {/* Topo do Modo Cozinha */}
      <div className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 border-b-4 border-stone-300 pb-4">
        <div>
          <span className="inline-block px-4 py-1 rounded-full font-extrabold text-base bg-[#15803D] text-white mb-1">
            🍳 MODO COZINHA PASSO A PASSO
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold">{recipe.title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Velocidade da Voz */}
          <button
            type="button"
            onClick={() => {
              const nextRate = voiceRate === 0.88 ? 0.72 : 0.88;
              setVoiceRate(nextRate);
              speakText(
                nextRate === 0.72
                  ? 'Voz ajustada para leitura bem pausada.'
                  : 'Voz ajustada para velocidade normal.',
                nextRate
              );
            }}
            className={`min-h-[54px] px-4 py-2 rounded-2xl font-extrabold border-2 transition ${
              highContrastDark
                ? 'bg-stone-900 border-amber-400 text-amber-200'
                : 'bg-amber-50 border-stone-400 text-stone-900'
            }`}
          >
            🗣️ Voz: {voiceRate === 0.72 ? 'Bem Pausada' : 'Normal'}
          </button>

          {/* Botão Fechar Gigante */}
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="min-h-[56px] px-5 py-2.5 rounded-2xl font-extrabold text-lg bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-2 shadow"
          >
            <X className="w-7 h-7" />
            <span>Sair do Modo Cozinha</span>
          </button>
        </div>
      </div>

      {/* Centro: O Passo Atual em Fonte Gigante */}
      <div className="max-w-5xl w-full mx-auto my-6 flex-1 flex flex-col justify-center">
        {/* Barra de Progresso Visual */}
        <div className="mb-6">
          <div className="flex items-center justify-between font-extrabold text-xl sm:text-2xl mb-2">
            <span className="text-[#C2410C] bg-amber-100 dark:bg-stone-800 px-5 py-2 rounded-2xl border-2 border-[#C2410C]">
              PASSO {currentIndex + 1} DE {steps.length}
            </span>
            <span>{Math.round(((currentIndex + 1) / steps.length) * 100)}% concluído</span>
          </div>
          <div className="w-full h-5 bg-stone-200 rounded-full overflow-hidden border-2 border-stone-400">
            <div
              className="h-full bg-[#15803D] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Cartão Principal do Passo */}
        <div
          className={`p-6 sm:p-10 rounded-3xl border-4 shadow-lg ${
            highContrastDark
              ? 'bg-stone-900 border-amber-400 text-white'
              : 'bg-white border-stone-400 text-[#1C1917]'
          }`}
        >
          <p className="text-2xl sm:text-4xl font-extrabold leading-relaxed tracking-wide">
            {currentStep.instruction}
          </p>

          {/* Relógio / Temporizador Automático se o passo tiver tempo */}
          {timeLeft !== null && (
            <div
              className={`mt-8 p-6 rounded-3xl border-4 flex flex-col sm:flex-row items-center justify-between gap-6 ${
                timerFinished
                  ? 'bg-rose-100 border-rose-600 text-rose-950 animate-pulse'
                  : highContrastDark
                  ? 'bg-stone-950 border-amber-400 text-amber-200'
                  : 'bg-[#FAF5EB] border-[#C2410C] text-stone-900'
              }`}
            >
              <div className="flex items-center gap-4">
                <AlarmClock className="w-12 h-12 text-[#C2410C] shrink-0" />
                <div>
                  <p className="text-lg font-extrabold uppercase tracking-wider">
                    {timerFinished ? '🔔 TEMPO ESGOTADO!' : '⏰ Relógio deste Passo:'}
                  </p>
                  <p className="text-4xl sm:text-5xl font-black font-mono mt-1">
                    {formatTimer(timeLeft)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {!timerRunning ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTimerFinished(false);
                      if (timeLeft === 0 && currentStep.timerSeconds) {
                        setTimeLeft(currentStep.timerSeconds);
                      }
                      setTimerRunning(true);
                    }}
                    className="flex-1 sm:flex-initial min-h-[64px] px-6 py-3 rounded-2xl font-extrabold text-xl bg-[#15803D] hover:bg-[#166534] text-white flex items-center justify-center gap-2 shadow"
                  >
                    <Play className="w-7 h-7 fill-current" />
                    <span>Ligar Relógio</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTimerRunning(false)}
                    className="flex-1 sm:flex-initial min-h-[64px] px-6 py-3 rounded-2xl font-extrabold text-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 shadow"
                  >
                    <Pause className="w-7 h-7 fill-current" />
                    <span>Pausar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerFinished(false);
                    setTimeLeft(currentStep.timerSeconds || 60);
                  }}
                  className="min-h-[64px] px-5 py-3 rounded-2xl font-extrabold text-lg bg-stone-200 hover:bg-stone-300 text-stone-900 flex items-center justify-center gap-2 border-2 border-stone-400"
                >
                  <RotateCcw className="w-6 h-6" />
                  <span>Reiniciar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé: Os 3 Botões Gigantes de Navegação e Voz */}
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t-4 border-stone-300">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          className={`min-h-[72px] px-6 py-4 rounded-2xl font-extrabold text-xl flex items-center justify-center gap-3 border-4 transition ${
            isFirst
              ? 'opacity-40 cursor-not-allowed bg-stone-200 text-stone-500 border-stone-300'
              : highContrastDark
              ? 'bg-stone-800 text-white border-stone-500 hover:border-amber-400'
              : 'bg-white text-stone-900 border-stone-400 hover:bg-stone-100'
          }`}
        >
          <ArrowLeft className="w-8 h-8 shrink-0" />
          <span>⬅️ Passo Anterior</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (isSpeaking) {
              stopSpeaking();
            } else {
              speakText(`Passo ${currentIndex + 1}. ${currentStep.instruction}`);
            }
          }}
          className="min-h-[72px] px-6 py-4 rounded-2xl font-extrabold text-xl bg-[#C2410C] hover:bg-[#9A3412] text-white flex items-center justify-center gap-3 shadow-lg transition active:scale-95"
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-8 h-8 shrink-0" />
              <span>🔇 Parar Voz</span>
            </>
          ) : (
            <>
              <Volume2 className="w-8 h-8 shrink-0" />
              <span>🔊 Ouvir Passo de Novo</span>
            </>
          )}
        </button>

        {!isLast ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(steps.length - 1, i + 1))}
            className="min-h-[72px] px-6 py-4 rounded-2xl font-extrabold text-xl bg-[#15803D] hover:bg-[#166534] text-white flex items-center justify-center gap-3 shadow-lg transition active:scale-95"
          >
            <span>Próximo Passo ➡️</span>
            <ArrowRight className="w-8 h-8 shrink-0" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              speakText('Parabéns! Você concluiu todos os passos da receita. Bom apetite!');
              onClose();
            }}
            className="min-h-[72px] px-6 py-4 rounded-2xl font-extrabold text-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-3 shadow-lg transition active:scale-95"
          >
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <span>🎉 Concluir Receita!</span>
          </button>
        )}
      </div>
    </div>
  );
};
