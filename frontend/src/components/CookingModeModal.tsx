import React, { useEffect, useState } from 'react';
import { Recipe } from '../types';
import { playKitchenAlarmSound, useVoiceReader } from '../hooks/useVoiceReader';

interface CookingModeModalProps {
  recipe: Recipe;
  allRecipes?: Recipe[];
  onSelectDifferentRecipe?: (recipe: Recipe) => void;
  onClose: () => void;
  highContrastDark: boolean;
  isEmbeddedTab?: boolean;
}

function scaleIngredientText(rawText: string, multiplier: number): string {
  if (multiplier === 1) return rawText;
  return rawText.replace(/(\d+(?:[\.,]\d+)?)/g, (match) => {
    const val = parseFloat(match.replace(',', '.'));
    if (isNaN(val)) return match;
    const scaled = Number((val * multiplier).toFixed(1));
    return String(scaled).replace('.', ',');
  });
}

const VOVO_ENCOURAGEMENTS = [
  'Separe tudo com calma, meu bem. Cozinhar sem pressa deixa tudo mais gostoso! 💕',
  'Que cheirinho bom já está começando a aparecer por aí! ✨',
  'Você está indo muito bem! Siga esse passo com carinho. 👵🍰',
  'Dica da Vovó: mantenha o fogo sempre na temperatura indicada para não passar do ponto! 🔥',
  'Quase lá! Já pode ir preparando a travessa mais bonita da casa! 🌸',
];

export const CookingModeModal: React.FC<CookingModeModalProps> = ({
  recipe,
  allRecipes = [],
  onSelectDifferentRecipe,
  onClose,
  highContrastDark,
  isEmbeddedTab = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1);
  const [showIngredientsMobile, setShowIngredientsMobile] = useState(false);
  const [showRecipeSwitcher, setShowRecipeSwitcher] = useState(false);
  const [isFinishedCelebration, setIsFinishedCelebration] = useState(false);

  const [autoRead, setAutoRead] = useState(true);
  const { isSpeaking, voiceRate, setVoiceRate, speakText, stopSpeaking } = useVoiceReader();

  const steps = recipe.steps || [];
  const currentStep = steps[currentIndex];

  // Estado do Timer Inteligente
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [initialTimerTotal, setInitialTimerTotal] = useState<number>(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);

  // Reset state when switching recipe
  useEffect(() => {
    setCurrentIndex(0);
    setCompletedSteps({});
    setIsFinishedCelebration(false);
    setShowRecipeSwitcher(false);
  }, [recipe.id]);

  // Mantém a tela acesa durante o Modo Cozinha
  useEffect(() => {
    let wakeLock: any = null;
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Ignora se não suportado
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

  // Navegação por teclado (Setas Esquerda/Direita)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinishedCelebration) return;
      if (e.key === 'ArrowRight' && currentIndex < steps.length - 1) {
        setCompletedSteps((prev) => ({ ...prev, [currentIndex]: true }));
        setCurrentIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, steps.length, isFinishedCelebration]);

  // Atualiza timer e voz ao mudar de passo
  useEffect(() => {
    if (!currentStep || isFinishedCelebration) return;

    setTimerRunning(false);
    setTimerFinished(false);
    if (currentStep.timerSeconds && currentStep.timerSeconds > 0) {
      setTimeLeft(currentStep.timerSeconds);
      setInitialTimerTotal(currentStep.timerSeconds);
    } else {
      setTimeLeft(null);
      setInitialTimerTotal(60);
    }

    if (autoRead) {
      const textToRead = `Passo ${currentIndex + 1} de ${steps.length}. ${currentStep.instruction}`;
      speakText(textToRead);
    }
  }, [currentIndex, currentStep, steps.length, autoRead, isFinishedCelebration, speakText]);

  // Contagem regressiva do Timer
  useEffect(() => {
    if (!timerRunning || timeLeft === null) return;

    if (timeLeft <= 0) {
      setTimerRunning(false);
      setTimerFinished(true);
      playKitchenAlarmSound();
      speakText('Atenção, querido! O tempo do timer deste passo terminou!');
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
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startCustomTimer = (seconds: number) => {
    setTimerFinished(false);
    setInitialTimerTotal(seconds);
    setTimeLeft(seconds);
    setTimerRunning(true);
  };

  const handleNextStep = () => {
    setCompletedSteps((prev) => ({ ...prev, [currentIndex]: true }));
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinishedCelebration(true);
      speakText(
        `Parabéns! Você concluiu a receita ${recipe.title} com perfeição! A Vovó Helena está muito orgulhosa de você!`
      );
    }
  };

  const handlePrevStep = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const progressPercent = steps.length > 0 ? Math.round(((currentIndex + 1) / steps.length) * 100) : 100;
  const timerProgressPercent =
    timeLeft !== null && initialTimerTotal > 0
      ? Math.max(0, Math.min(100, Math.round(((initialTimerTotal - timeLeft) / initialTimerTotal) * 100)))
      : 0;

  const vovoPhrase = VOVO_ENCOURAGEMENTS[currentIndex % VOVO_ENCOURAGEMENTS.length];

  const wrapperClass = isEmbeddedTab
    ? `rounded-[2rem] border shadow-xl overflow-hidden transition-colors ${
        highContrastDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-[#FFFDFB] border-rose-100 text-stone-800'
      }`
    : `fixed inset-0 z-50 flex flex-col overflow-y-auto transition-colors ${
        highContrastDark ? 'bg-stone-950 text-stone-100' : 'bg-[#FAF6F0] text-stone-800'
      }`;

  return (
    <div role="dialog" aria-modal={!isEmbeddedTab} aria-label={`Modo Cozinha: ${recipe.title}`} className={wrapperClass}>
      {/* HEADER SUPER FOFO E MODERNO DO ESTÚDIO DA VOVÓ */}
      <div
        className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 sm:px-8 py-4 transition-colors ${
          highContrastDark
            ? 'bg-stone-900/95 border-stone-800'
            : 'bg-white/90 border-rose-100/80 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Identidade da Receita + Avatar da Vovó */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src="/images/logo-vovo.jpg"
                alt="Vovó Helena"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-[#C83E5B] shadow-md"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shadow ${
                  isSpeaking ? 'bg-[#1E7E5A] animate-ping' : 'bg-[#C83E5B]'
                }`}
              >
                <i className="fa-solid fa-microphone" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-[#C83E5B] border border-rose-200">
                  <i className="fa-solid fa-kitchen-set" /> Estúdio Modo Cozinha Guiado
                </span>
                {isSpeaking && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#1E7E5A] border border-emerald-200 animate-pulse">
                    <i className="fa-solid fa-volume-high" /> Vovó narrando...
                  </span>
                )}
              </div>
              <h2 className="font-serif-vovo text-lg sm:text-2xl font-bold truncate mt-0.5">
                {recipe.title}
              </h2>
            </div>
          </div>

          {/* Controles Modernos de Voz, Troca de Receita e Saída */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Botão Trocar Receita (se houver lista de receitas) */}
            {allRecipes.length > 1 && onSelectDifferentRecipe && (
              <button
                type="button"
                onClick={() => setShowRecipeSwitcher((v) => !v)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold border flex items-center gap-1.5 transition ${
                  highContrastDark
                    ? 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
                    : 'bg-[#F8F6F2] border-stone-200 text-stone-700 hover:border-[#C83E5B] hover:text-[#C83E5B]'
                }`}
              >
                <i className="fa-solid fa-book-open text-[#C83E5B]" />
                <span>Trocar Receita</span>
              </button>
            )}

            {/* Toggle Leitura Automática */}
            <button
              type="button"
              onClick={() => setAutoRead((v) => !v)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold border flex items-center gap-1.5 transition ${
                autoRead
                  ? 'bg-emerald-50 border-emerald-200 text-[#1E7E5A]'
                  : highContrastDark
                  ? 'bg-stone-800 border-stone-700 text-stone-400'
                  : 'bg-stone-100 border-stone-200 text-stone-500'
              }`}
              title="Ligar ou desligar leitura automática ao avançar de passo"
            >
              <i className={`fa-solid ${autoRead ? 'fa-volume-high' : 'fa-volume-xmark'}`} />
              <span className="hidden sm:inline">Voz Automática:</span>
              <span>{autoRead ? 'Ligada' : 'Pausada'}</span>
            </button>

            {/* Seletor de Velocidade da Voz */}
            <button
              type="button"
              onClick={() => {
                const nextRate = voiceRate === 0.88 ? 0.72 : 0.88;
                setVoiceRate(nextRate);
                speakText(
                  nextRate === 0.72
                    ? 'Voz da Vovó ajustada para leitura bem calminha.'
                    : 'Voz da Vovó ajustada para velocidade natural.',
                  nextRate
                );
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold border flex items-center gap-1.5 transition ${
                highContrastDark
                  ? 'bg-stone-800 border-stone-700 text-amber-300'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <i className="fa-solid fa-gauge-high text-amber-600" />
              <span>Ritmo: {voiceRate === 0.72 ? 'Calminho (0.7x)' : 'Natural (1x)'}</span>
            </button>

            {/* Botão Mobile para ver Ingredientes */}
            <button
              type="button"
              onClick={() => setShowIngredientsMobile((v) => !v)}
              className="lg:hidden px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-rose-50 text-[#C83E5B] border border-rose-200 flex items-center gap-1.5"
            >
              <i className="fa-solid fa-basket-shopping" />
              <span>Ingredientes ({recipe.ingredients?.length || 0})</span>
            </button>

            {/* Botão Fechar / Voltar */}
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold bg-stone-800 hover:bg-[#C83E5B] text-white flex items-center gap-2 shadow-sm transition-colors"
            >
              <i className="fa-solid fa-arrow-left" />
              <span>{isEmbeddedTab ? 'Voltar às Receitas' : 'Fechar Estúdio'}</span>
            </button>
          </div>
        </div>

        {/* Seletor Rápido de Receitas (Dropdown/Drawer quando aberto) */}
        {showRecipeSwitcher && allRecipes.length > 0 && onSelectDifferentRecipe && (
          <div
            className={`max-w-7xl mx-auto mt-4 p-4 rounded-3xl border shadow-lg animate-fadeIn ${
              highContrastDark ? 'bg-stone-950 border-stone-800' : 'bg-[#FAF6F0] border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#C83E5B] flex items-center gap-1.5">
                <i className="fa-solid fa-wand-magic-sparkles" /> Escolha outra receita para cozinhar agora:
              </span>
              <button
                type="button"
                onClick={() => setShowRecipeSwitcher(false)}
                className="text-xs font-bold text-stone-500 hover:text-stone-800"
              >
                Fechar lista ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {allRecipes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectDifferentRecipe(r)}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-3 transition ${
                    r.id === recipe.id
                      ? 'bg-[#C83E5B] text-white border-[#C83E5B] shadow-sm'
                      : highContrastDark
                      ? 'bg-stone-900 border-stone-800 hover:border-rose-400'
                      : 'bg-white border-stone-200/80 hover:border-[#C83E5B]'
                  }`}
                >
                  <img
                    src={
                      r.imageUrl ||
                      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={r.title}
                    className="w-11 h-11 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold truncate">{r.title}</p>
                    <p
                      className={`text-[10px] truncate ${
                        r.id === recipe.id ? 'text-rose-100' : 'text-stone-500'
                      }`}
                    >
                      {r.steps?.length || 0} passos • {r.prepTimeMinutes || 35} min
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CORPO PRINCIPAL DO ESTÚDIO MODO COZINHA */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {/* TRILHA HORIZONTAL DE PASSOS (BOLINHAS INTERATIVAS FOFAS) */}
        <div className="mb-7">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#C83E5B]">
                Progresso da Receita
              </span>
              <span className="text-xs font-bold text-stone-400">•</span>
              <span className="text-xs font-bold text-[#1E7E5A]">
                {progressPercent}% preparado
              </span>
            </div>
            <span className="text-xs text-stone-400 hidden sm:inline">
              <i className="fa-regular fa-keyboard mr-1" /> Dica: use as setas ⬅️ ➡️ do teclado para navegar
            </span>
          </div>

          {/* Bolinhas clicáveis de cada passo */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {steps.map((st, idx) => {
              const isCurrent = idx === currentIndex && !isFinishedCelebration;
              const isDone = completedSteps[idx] || idx < currentIndex || isFinishedCelebration;
              return (
                <button
                  key={st.id || idx}
                  type="button"
                  onClick={() => {
                    setIsFinishedCelebration(false);
                    setCurrentIndex(idx);
                  }}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-2xl font-extrabold text-xs shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-[#C83E5B] text-white shadow-md scale-105 ring-4 ring-rose-200/70'
                      : isDone
                      ? 'bg-emerald-50 text-[#1E7E5A] border border-emerald-200 hover:bg-emerald-100'
                      : highContrastDark
                      ? 'bg-stone-800 text-stone-400 border border-stone-700'
                      : 'bg-white text-stone-500 border border-stone-200/80 hover:border-rose-200'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                      isCurrent
                        ? 'bg-white text-[#C83E5B]'
                        : isDone
                        ? 'bg-[#1E7E5A] text-white'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {isDone && !isCurrent ? <i className="fa-solid fa-check" /> : idx + 1}
                  </span>
                  <span className="hidden sm:inline">Passo {idx + 1}</span>
                  {st.timerSeconds ? (
                    <i className="fa-regular fa-clock text-[10px] opacity-80" title="Possui timer" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Barra contínua suave */}
          <div className="w-full h-2.5 bg-stone-200/80 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-[#C83E5B] via-rose-500 to-[#1E7E5A] transition-all duration-500 rounded-full"
              style={{ width: `${isFinishedCelebration ? 100 : progressPercent}%` }}
            />
          </div>
        </div>

        {/* LAYOUT DE 2 COLUNAS: CARTÃO DO PASSO ATUAL (ESQUERDA) + CESTINHA DE INGREDIENTES (DIREITA) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* COLUNA PRINCIPAL (8 COLUNAS): PASSO ATUAL OU TELA DE CELEBRAÇÃO */}
          <div className="lg:col-span-8 space-y-6">
            {isFinishedCelebration ? (
              /* TELA DE CELEBRAÇÃO FOFA QUANDO TERMINA A RECEITA */
              <div
                className={`rounded-[2rem] border p-8 sm:p-12 text-center shadow-lg space-y-6 animate-fadeIn ${
                  highContrastDark
                    ? 'bg-stone-900 border-emerald-700 text-white'
                    : 'bg-gradient-to-b from-white via-rose-50/30 to-emerald-50/40 border-rose-200/80 text-stone-800'
                }`}
              >
                <div className="relative w-28 h-28 mx-auto">
                  <img
                    src="/images/hero-vovo.jpg"
                    alt="Vovó Helena Comemorando"
                    className="w-28 h-28 rounded-full object-cover border-4 border-[#1E7E5A] shadow-xl"
                  />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center text-xl shadow-md">
                    <i className="fa-solid fa-trophy" />
                  </div>
                </div>

                <div className="space-y-2 max-w-xl mx-auto">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-emerald-100 text-[#1E7E5A] text-xs font-extrabold uppercase tracking-wider">
                    <i className="fa-solid fa-sparkles" /> Receita Finalizada com Amor!
                  </span>
                  <h3 className="font-serif-vovo text-3xl sm:text-4xl font-extrabold">
                    Parabéns! Seu prato está pronto para servir! 🍰✨
                  </h3>
                  <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
                    “Que orgulho de ver você cozinhando passo a passo! Agora é só chamar a família,
                    passar um cafezinho fresco e aproveitar cada pedaço.” — <strong>Vovó Helena</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFinishedCelebration(false);
                      setCurrentIndex(0);
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-extrabold text-sm flex items-center gap-2 shadow-sm transition"
                  >
                    <i className="fa-solid fa-rotate-left text-[#C83E5B]" />
                    <span>Rever os Passos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopSpeaking();
                      onClose();
                    }}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#1E7E5A] to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-base flex items-center gap-2.5 shadow-lg transition transform active:scale-95"
                  >
                    <i className="fa-solid fa-heart" />
                    <span>Concluir e Avaliar Receita</span>
                  </button>
                </div>
              </div>
            ) : currentStep ? (
              /* CARTÃO DO PASSO ATUAL */
              <div
                className={`relative rounded-[2rem] border p-6 sm:p-10 shadow-md transition-all ${
                  highContrastDark
                    ? 'bg-stone-900 border-stone-700 text-white'
                    : 'bg-white border-rose-100/90 text-stone-800'
                }`}
              >
                {/* Topo do Card: Badge do Passo + Botão de Voz Rápido */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C83E5B] to-rose-700 text-white flex items-center justify-center text-xl font-black shadow-md">
                      {currentIndex + 1}
                    </div>
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#C83E5B] block">
                        {currentStep.section || 'Modo de Preparo'}
                      </span>
                      <span className="text-sm font-bold text-stone-500">
                        Passo {currentIndex + 1} de {steps.length}
                      </span>
                    </div>
                  </div>

                  {/* Botão Ouvir / Parar Voz com Animação */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) {
                        stopSpeaking();
                      } else {
                        speakText(`Passo ${currentIndex + 1}. ${currentStep.instruction}`);
                      }
                    }}
                    className={`px-5 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-2.5 shadow-sm transition-all active:scale-95 ${
                      isSpeaking
                        ? 'bg-amber-500 hover:bg-amber-600 text-stone-950'
                        : 'bg-rose-50 hover:bg-[#C83E5B] text-[#C83E5B] hover:text-white border border-rose-200'
                    }`}
                  >
                    <i className={`fa-solid ${isSpeaking ? 'fa-volume-xmark' : 'fa-volume-high'} text-base`} />
                    <span>{isSpeaking ? 'Parar Narração' : 'Ouvir a Vovó Ler'}</span>
                  </button>
                </div>

                {/* Texto Principal do Passo em Tipografia Editorial Confortável */}
                <div
                  className={`p-6 sm:p-8 rounded-3xl border mb-6 ${
                    highContrastDark
                      ? 'bg-stone-950 border-stone-800 text-amber-50'
                      : 'bg-[#FAF6F0]/90 border-stone-200/70 text-stone-800'
                  }`}
                >
                  <p className="font-serif-vovo text-2xl sm:text-3xl lg:text-[32px] font-bold leading-relaxed tracking-normal">
                    {currentStep.instruction}
                  </p>
                </div>

                {/* Balãozinho Fofo de Carinho da Vovó Helena */}
                <div
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border mb-6 ${
                    highContrastDark
                      ? 'bg-stone-950/60 border-stone-800 text-stone-300'
                      : 'bg-rose-50/60 border-rose-100 text-stone-700'
                  }`}
                >
                  <img
                    src="/images/logo-vovo.jpg"
                    alt="Vovó"
                    className="w-10 h-10 rounded-full object-cover border border-rose-300 shrink-0"
                  />
                  <p className="text-xs sm:text-sm font-semibold italic leading-snug">
                    “{recipe.chefTip && currentIndex === 0 ? recipe.chefTip : vovoPhrase}”
                  </p>
                </div>

                {/* WIDGET MODERNO DE TIMER / RELÓGIO DE COZINHA */}
                <div
                  className={`rounded-3xl border p-5 sm:p-6 transition-all ${
                    timerFinished
                      ? 'bg-rose-50 border-[#C83E5B] text-rose-950 ring-4 ring-rose-200 animate-pulse'
                      : highContrastDark
                      ? 'bg-stone-950 border-stone-800'
                      : 'bg-[#F8F6F2] border-stone-200/90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0 ${
                          timerRunning
                            ? 'bg-[#1E7E5A] text-white animate-spin-slow'
                            : timerFinished
                            ? 'bg-[#C83E5B] text-white'
                            : 'bg-white text-[#C83E5B] border border-stone-200'
                        }`}
                      >
                        <i className="fa-solid fa-stopwatch" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-stone-500 block">
                          {timerFinished
                            ? '🔔 Plim! O tempo acabou!'
                            : timeLeft !== null
                            ? 'Timer da Cozinha da Vovó'
                            : 'Precisa marcar um tempinho neste passo?'}
                        </span>
                        {timeLeft !== null ? (
                          <div className="flex items-baseline gap-3 mt-0.5">
                            <span className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white">
                              {formatTimer(timeLeft)}
                            </span>
                            {timerRunning && (
                              <span className="text-xs font-bold text-[#1E7E5A]">
                                ({timerProgressPercent}% concluído)
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-stone-700 mt-0.5">
                            Toque em um dos tempos rápidos ao lado para ativar o alarme sonoro:
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação do Timer */}
                    <div className="flex flex-wrap items-center gap-2">
                      {timeLeft !== null ? (
                        <>
                          {!timerRunning ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTimerFinished(false);
                                if (timeLeft === 0) setTimeLeft(initialTimerTotal);
                                setTimerRunning(true);
                              }}
                              className="px-5 py-3 rounded-2xl bg-[#1E7E5A] hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
                            >
                              <i className="fa-solid fa-play" />
                              <span>Iniciar Timer</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setTimerRunning(false)}
                              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
                            >
                              <i className="fa-solid fa-pause" />
                              <span>Pausar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setTimeLeft((prev) => (prev !== null ? prev + 60 : 60));
                              setInitialTimerTotal((prev) => prev + 60);
                            }}
                            className="px-3.5 py-3 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-extrabold text-xs transition"
                            title="Adicionar mais 1 minuto"
                          >
                            +1 min
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setTimerRunning(false);
                              setTimerFinished(false);
                              setTimeLeft(currentStep.timerSeconds || 60);
                            }}
                            className="px-3.5 py-3 rounded-2xl bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 font-bold text-xs transition"
                            title="Reiniciar relógio"
                          >
                            <i className="fa-solid fa-rotate-left" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Atalhos Rápidos de Timer (1m, 3m, 5m, 10m, 15m, 30m) */}
                  <div className="mt-4 pt-3 border-t border-stone-200/70 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-stone-500 mr-1">
                      <i className="fa-regular fa-bell mr-1 text-[#C83E5B]" /> Timer rápido:
                    </span>
                    {[
                      { label: '1 min', sec: 60 },
                      { label: '3 min', sec: 180 },
                      { label: '5 min', sec: 300 },
                      { label: '10 min', sec: 600 },
                      { label: '15 min', sec: 900 },
                      { label: '30 min', sec: 1800 },
                    ].map((preset) => (
                      <button
                        key={preset.sec}
                        type="button"
                        onClick={() => startCustomTimer(preset.sec)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#C83E5B] hover:text-white text-stone-700 border border-stone-200 text-xs font-extrabold transition-colors shadow-2xs"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BARRA DE NAVEGAÇÃO INFERIOR DO CARTÃO (ANTERIOR / PRÓXIMO) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7 pt-6 border-t border-stone-100">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={handlePrevStep}
                    className={`py-4 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center gap-3 border transition-all ${
                      currentIndex === 0
                        ? 'opacity-40 cursor-not-allowed bg-stone-100 text-stone-400 border-stone-200'
                        : highContrastDark
                        ? 'bg-stone-800 text-white border-stone-700 hover:border-amber-400'
                        : 'bg-white text-stone-700 border-stone-200/90 hover:border-[#C83E5B] hover:text-[#C83E5B] shadow-sm'
                    }`}
                  >
                    <i className="fa-solid fa-arrow-left" />
                    <span>Passo Anterior</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="py-4 px-6 rounded-2xl font-extrabold text-base bg-gradient-to-r from-[#1E7E5A] to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all active:scale-98"
                  >
                    {currentIndex < steps.length - 1 ? (
                      <>
                        <span>Concluir e Ir ao Passo {currentIndex + 2}</span>
                        <i className="fa-solid fa-arrow-right" />
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-circle-check" />
                        <span>Finalizar Receita com Sucesso! 🎉</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* COLUNA LATERAL (4 COLUNAS): CESTINHA DE INGREDIENTES INTERATIVA */}
          <aside
            className={`lg:col-span-4 rounded-[2rem] border p-6 shadow-sm transition-all ${
              showIngredientsMobile ? 'block' : 'hidden lg:block'
            } ${
              highContrastDark
                ? 'bg-stone-900 border-stone-800 text-stone-100'
                : 'bg-white border-rose-100/90 text-stone-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#C83E5B] flex items-center justify-center text-lg">
                  <i className="fa-solid fa-basket-shopping" />
                </div>
                <div>
                  <h3 className="font-serif-vovo text-lg font-bold leading-tight">
                    Cestinha da Bancada
                  </h3>
                  <p className="text-xs text-stone-500">
                    Marque os ingredientes já usados
                  </p>
                </div>
              </div>

              {/* Multiplicador rápido de porções dentro do Modo Cozinha */}
              <div className="flex items-center gap-1 bg-[#F8F6F2] p-1 rounded-xl border border-stone-200">
                {[0.5, 1, 2].map((mult) => (
                  <button
                    key={mult}
                    type="button"
                    onClick={() => setPortionMultiplier(mult)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition ${
                      portionMultiplier === mult
                        ? 'bg-[#C83E5B] text-white shadow-2xs'
                        : 'text-stone-600 hover:text-[#C83E5B]'
                    }`}
                  >
                    {mult === 0.5 ? '½x' : `${mult}x`}
                  </button>
                ))}
              </div>
            </div>

            <ul className="mt-4 space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {(recipe.ingredients || []).map((ing) => {
                const isChecked = !!checkedIngredients[ing.id];
                const scaledText = scaleIngredientText(ing.rawText, portionMultiplier);
                return (
                  <li key={ing.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setCheckedIngredients((prev) => ({
                          ...prev,
                          [ing.id]: !prev[ing.id],
                        }))
                      }
                      className={`w-full text-left p-3 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-3 transition ${
                        isChecked
                          ? 'bg-emerald-50/60 border-emerald-200 text-stone-400 line-through'
                          : highContrastDark
                          ? 'bg-stone-950 border-stone-800 text-stone-200 hover:border-rose-400'
                          : 'bg-[#FAF6F0]/70 border-stone-200/70 text-stone-700 hover:border-rose-200'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] shrink-0 ${
                          isChecked
                            ? 'bg-[#1E7E5A] text-white'
                            : 'bg-white border border-stone-300 text-transparent'
                        }`}
                      >
                        <i className="fa-solid fa-check" />
                      </span>
                      <span className="leading-snug">{scaledText}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Resumo Rápido da Receita no Rodapé da Cestinha */}
            <div className="mt-5 pt-4 border-t border-stone-100 grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-[#F8F6F2] text-stone-700">
                <span className="text-[10px] font-bold uppercase text-stone-400 block">
                  Tempo Total
                </span>
                <span className="text-xs font-extrabold">
                  <i className="fa-regular fa-clock text-[#C83E5B] mr-1" />
                  {recipe.prepTimeMinutes || 40} min
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#F8F6F2] text-stone-700">
                <span className="text-[10px] font-bold uppercase text-stone-400 block">
                  Rendimento
                </span>
                <span className="text-xs font-extrabold">
                  <i className="fa-solid fa-utensils text-[#1E7E5A] mr-1" />
                  {recipe.servings || '6 porções'}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
