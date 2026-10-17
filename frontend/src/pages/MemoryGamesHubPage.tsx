import React, { useEffect, useState } from 'react';
import { Recipe, UserProfile } from '../types';
import { useVoiceReader } from '../hooks/useVoiceReader';
import { CloudSyncNotice } from '../components/CloudSyncNotice';
import { pushLocalDataToCloudIfLoggedIn } from '../api/client';

interface MemoryGamesHubPageProps {
  recipes: Recipe[];
  user: UserProfile | null;
  highContrastDark: boolean;
  onOpenAuthModal: (mode: 'login' | 'register' | 'vip') => void;
}

type MemorySubTab = 'memory-game' | 'wisdom-quiz' | 'whatsapp-greetings';

interface MemoryCardItem {
  uid: number;
  pairId: string;
  label: string;
  icon: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_PAIRS = [
  { pairId: 'bolo', label: 'Bolo Quentinho', icon: 'fa-cake-candles', color: 'text-[#C83E5B]' },
  { pairId: 'cha', label: 'Chá de Camomila', icon: 'fa-mug-hot', color: 'text-[#1E7E5A]' },
  { pairId: 'pao', label: 'Pão Caseiro', icon: 'fa-bread-slice', color: 'text-amber-600' },
  { pairId: 'fruta', label: 'Maçã da Feira', icon: 'fa-apple-whole', color: 'text-rose-600' },
  { pairId: 'sopa', label: 'Caldo da Vovó', icon: 'fa-bowl-food', color: 'text-orange-600' },
  { pairId: 'horta', label: 'Hortelã em Vaso', icon: 'fa-seedling', color: 'text-emerald-600' },
];

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const VOVO_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Qual é o segredo da Vovó para o bolo caseiro crescer bem fofinho e nunca solar?',
    options: [
      'Abrir o forno toda hora nos primeiros 10 minutos',
      'Peneirar a farinha, usar ovos em temperatura ambiente e misturar o fermento delicadamente no final',
      'Bater o fermento no liquidificador por 10 minutos em velocidade máxima',
    ],
    correctIndex: 1,
    explanation:
      'Isso mesmo! Ovos em temperatura ambiente e fermento misturado suavemente no final garantem um bolo alto e macio como nuvem.',
  },
  {
    id: 'q2',
    question: 'Se o feijão ou a sopa ficou um pouquinho salgado demais, qual truque da Vovó ajuda a salvar o prato?',
    options: [
      'Colocar uma batata crua descascada cortada ao meio para ferver junto por alguns minutos',
      'Colocar meia xícara de café forte dentro da panela',
      'Deixar a panela destampada na geladeira antes de cozinhar',
    ],
    correctIndex: 0,
    explanation:
      'Perfeito! A batata crua absorve parte do excesso de sal e caldo enquanto cozinha, salvando o almoço da família!',
  },
  {
    id: 'q3',
    question: 'Qual destes chás naturais é o mais indicado pela Vovó para acalmar e dormir melhor à noite?',
    options: [
      'Chá preto forte ou mate tostado',
      'Infusão morna de Camomila com Erva-Doce ou Capim-Cidreira',
      'Café expresso duplo com canela',
    ],
    correctIndex: 1,
    explanation:
      'Acertou em cheio! A camomila, a erva-doce e o capim-cidreira não têm cafeína e ajudam a relaxar o corpo para um sono tranquilo.',
  },
  {
    id: 'q4',
    question: 'Na limpeza da casa, qual regra de segurança a Vovó nunca esquece?',
    options: [
      'Nunca misturar Água Sanitária (Cândida) com Vinagre, Álcool ou Amônia',
      'Misturar todos os produtos do armário no mesmo balde fechado',
      'Usar água fervendo em cima de aparelhos ligados na tomada',
    ],
    correctIndex: 0,
    explanation:
      'Muito bem! Água sanitária nunca deve ser misturada com vinagre ou álcool para proteger os pulmões. Segurança sempre em primeiro lugar!',
  },
];

const GREETING_TEMPLATES = [
  {
    id: 'bom-dia',
    period: 'Bom Dia Abençoado',
    icon: 'fa-sun',
    title: 'Bom Dia com Cheirinho de Café e Bolo da Vovó!',
    message:
      'Bom dia, minha família querida! Que o nosso dia seja doce, cheio de saúde, paz no coração e mesa farta. Já passei um cafezinho fresco pensando em cada um de vocês!',
  },
  {
    id: 'boa-tarde',
    period: 'Boa Tarde com Carinho',
    icon: 'fa-mug-saucer',
    title: 'Boa Tarde! Hora de um Chazinho e Conversa Boa',
    message:
      'Boa tarde, meus amores! Passando para deixar um abraço bem apertado da Vovó e desejar uma tarde iluminada e abençoada para toda a nossa família!',
  },
  {
    id: 'boa-noite',
    period: 'Boa Noite de Paz',
    icon: 'fa-moon',
    title: 'Boa Noite e Bons Sonhos para Toda a Família',
    message:
      'Boa noite, queridos! Que Deus abençoe o descanso de cada um, acalme o coração e renove nossas forças para o dia de amanhã. Durmam com os anjos!',
  },
  {
    id: 'domingo',
    period: 'Almoço em Família',
    icon: 'fa-heart',
    title: 'Feliz Dia em Família! Amor que Passa de Geração em Geração',
    message:
      'Não existe tempero melhor no mundo do que reunir quem a gente ama! Que nunca nos falte saúde, união e aquele abraço gostoso de família.',
  },
];

function createShuffledDeck(): MemoryCardItem[] {
  const doubled = [...CARD_PAIRS, ...CARD_PAIRS];
  return doubled
    .sort(() => Math.random() - 0.5)
    .map((item, idx) => ({
      uid: idx,
      pairId: item.pairId,
      label: item.label,
      icon: item.icon,
      color: item.color,
      isFlipped: false,
      isMatched: false,
    }));
}

export const MemoryGamesHubPage: React.FC<MemoryGamesHubPageProps> = ({
  recipes,
  user,
  highContrastDark,
  onOpenAuthModal,
}) => {
  const [subTab, setSubTab] = useState<MemorySubTab>('memory-game');
  const { isSpeaking, speakText, stopSpeaking } = useVoiceReader();

  // --- Estatísticas salvas na Nuvem ---
  const [stats, setStats] = useState<{ gamesWon: number; bestMoves: number; quizScore: number }>(
    () => {
      try {
        const raw = localStorage.getItem('caderno_vovo_memory_stats');
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
      return { gamesWon: 0, bestMoves: 0, quizScore: 0 };
    }
  );

  useEffect(() => {
    localStorage.setItem('caderno_vovo_memory_stats', JSON.stringify(stats));
    pushLocalDataToCloudIfLoggedIn();
  }, [stats]);

  // --- Sub-Aba 1: Jogo da Memória ---
  const [deck, setDeck] = useState<MemoryCardItem[]>(() => createShuffledDeck());
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);

  const resetMemoryGame = () => {
    setDeck(createShuffledDeck());
    setFlippedIndices([]);
    setMoves(0);
    setGameCompleted(false);
  };

  const handleCardClick = (index: number) => {
    if (flippedIndices.length >= 2) return;
    const clicked = deck[index];
    if (!clicked || clicked.isFlipped || clicked.isMatched) return;

    const nextDeck = deck.map((c, idx) => (idx === index ? { ...c, isFlipped: true } : c));
    const nextFlipped = [...flippedIndices, index];
    setDeck(nextDeck);
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [firstIdx, secondIdx] = nextFlipped;
      const firstCard = nextDeck[firstIdx];
      const secondCard = nextDeck[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        const matchedDeck = nextDeck.map((c, idx) =>
          idx === firstIdx || idx === secondIdx ? { ...c, isMatched: true } : c
        );
        setDeck(matchedDeck);
        setFlippedIndices([]);

        const allDone = matchedDeck.every((c) => c.isMatched);
        if (allDone) {
          setGameCompleted(true);
          setStats((prev) => ({
            ...prev,
            gamesWon: prev.gamesWon + 1,
            bestMoves:
              prev.bestMoves === 0 ? nextMoves : Math.min(prev.bestMoves, nextMoves),
          }));
          speakText(
            `Parabéns, que memória maravilhosa! Você encontrou todos os pares da cozinha da Vovó em ${nextMoves} jogadas!`
          );
        }
      } else {
        setTimeout(() => {
          setDeck((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  // --- Sub-Aba 2: Quiz Sabedoria da Vovó ---
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const activeQuestion = VOVO_QUIZ_QUESTIONS[currentQuizIdx];

  const handleSelectQuizOption = (optIdx: number) => {
    setSelectedOption(optIdx);
    const isCorrect = optIdx === activeQuestion.correctIndex;
    if (isCorrect) {
      setStats((prev) => ({ ...prev, quizScore: prev.quizScore + 10 }));
      speakText(`Resposta certa! ${activeQuestion.explanation}`);
    } else {
      speakText(`Quase lá! ${activeQuestion.explanation}`);
    }
  };

  // --- Sub-Aba 3: Mensagens de Bom Dia / Boa Tarde WhatsApp ---
  const [selectedGreetingId, setSelectedGreetingId] = useState('bom-dia');
  const [customFamilyName, setCustomFamilyName] = useState(user?.name || 'Vovó Helena');
  const [includeRecipeTip, setIncludeRecipeTip] = useState(true);

  const activeGreeting =
    GREETING_TEMPLATES.find((g) => g.id === selectedGreetingId) || GREETING_TEMPLATES[0];
  const featuredRecipe = recipes[0];

  const fullWhatsAppText = `${activeGreeting.message}\n\n${
    includeRecipeTip && featuredRecipe
      ? `🍰 *Sugestão Deliciosa de Hoje:* ${featuredRecipe.title} (${
          featuredRecipe.prepTimeMinutes || 35
        } min)\n`
      : ''
  }❤️ Com todo carinho, *${customFamilyName}* (Caderno da Vovó)`;

  return (
    <div className="space-y-8">
      {/* Banner Principal de Passatempos & Memória Ativa */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
          highContrastDark
            ? 'bg-stone-900 border-stone-800 text-white'
            : 'bg-gradient-to-r from-[#C83E5B] via-rose-600 to-amber-600 text-white border-rose-300'
        }`}
      >
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase tracking-wider">
            <i className="fa-solid fa-puzzle-piece" />
            <span>Mente Ativa, Memória & Carinho no WhatsApp</span>
          </span>
          <h1 className="font-serif-vovo text-3xl sm:text-4xl font-extrabold">
            Cantinho da Memória, Quiz da Vovó & Bom Dia para a Família
          </h1>
          <p className="text-rose-50 text-sm sm:text-base leading-relaxed">
            Exercite a memória de forma divertida, teste seus conhecimentos nos segredos de cozinha e envie lindas mensagens de Bom Dia no WhatsApp dos filhos e netos!
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {[
            { id: 'memory-game', label: 'Jogo da Memória', icon: 'fa-grip' },
            { id: 'wisdom-quiz', label: 'Quiz da Vovó', icon: 'fa-lightbulb' },
            { id: 'whatsapp-greetings', label: 'Bom Dia WhatsApp', icon: 'fa-brands fa-whatsapp' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as MemorySubTab)}
              className={`px-4 py-3 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition ${
                subTab === t.id
                  ? 'bg-white text-[#C83E5B] shadow-md'
                  : 'bg-black/20 hover:bg-black/30 text-white'
              }`}
            >
              <i className={t.icon.includes('fa-brands') ? t.icon : `fa-solid ${t.icon}`} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <CloudSyncNotice
        user={user}
        onOpenAuthModal={onOpenAuthModal}
        moduleName="suas Medalhas de Memória, Pontuação do Quiz e Mensagens Favoritas"
      />

      {/* SUB-ABA 1: JOGO DA MEMÓRIA CULINÁRIA DA VOVÓ */}
      {subTab === 'memory-game' && (
        <div
          className={`rounded-3xl border p-6 sm:p-8 shadow-sm space-y-6 overflow-hidden ${
            highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-brain text-[#C83E5B]" />
                <span>Jogo da Memória da Cozinha da Vovó</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Toque nos cartões para encontrar os 6 pares de quitutes e ervas da Vovó Helena!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#C83E5B] dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-extrabold">
                Jogadas: {moves}
              </span>
              <span className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#1E7E5A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-extrabold">
                Partidas Vencidas: {stats.gamesWon}
              </span>
              <button
                type="button"
                onClick={resetMemoryGame}
                className="px-4 py-2 rounded-xl bg-[#C83E5B] hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <i className="fa-solid fa-rotate" />
                <span>Embaralhar Novo Jogo</span>
              </button>
            </div>
          </div>

          {gameCompleted && (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-[#1E7E5A] text-[#1E7E5A] dark:text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-trophy text-3xl text-amber-500" />
                <div>
                  <h3 className="font-serif-vovo text-xl font-extrabold">
                    Parabéns! Memória Nota 10!
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold">
                    Você completou todos os pares da cozinha em {moves} jogadas!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetMemoryGame}
                className="px-5 py-2.5 rounded-xl bg-[#1E7E5A] text-white font-extrabold text-xs"
              >
                Jogar Outra Vez
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {deck.map((card, idx) => {
              const revealed = card.isFlipped || card.isMatched;
              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleCardClick(idx)}
                  className={`h-28 sm:h-32 rounded-3xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition transform active:scale-95 ${
                    card.isMatched
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#1E7E5A] text-[#1E7E5A] dark:text-emerald-300 shadow-sm'
                      : revealed
                      ? 'bg-white dark:bg-stone-800 border-[#C83E5B] shadow-md'
                      : 'bg-gradient-to-br from-[#FAF6F0] to-rose-50 dark:from-stone-800 dark:to-stone-900 border-stone-300 dark:border-stone-700 hover:border-[#C83E5B]'
                  }`}
                >
                  {revealed ? (
                    <>
                      <i className={`fa-solid ${card.icon} text-3xl ${card.color}`} />
                      <span className="text-xs sm:text-sm font-extrabold text-center leading-tight">
                        {card.label}
                      </span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-heart text-2xl text-[#C83E5B]/60" />
                      <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                        Toque para virar
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-ABA 2: QUIZ SABEDORIA DA VOVÓ (COM LEITURA POR VOZ) */}
      {subTab === 'wisdom-quiz' && (
        <div
          className={`rounded-3xl border p-6 sm:p-8 shadow-sm space-y-6 overflow-hidden ${
            highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#C83E5B]">
                Pergunta {currentQuizIdx + 1} de {VOVO_QUIZ_QUESTIONS.length} • Pontos acumulados:{' '}
                {stats.quizScore}
              </span>
              <h2 className="font-serif-vovo text-2xl font-bold mt-1">
                {activeQuestion.question}
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                isSpeaking
                  ? stopSpeaking()
                  : speakText(
                      `Pergunta da Vovó: ${activeQuestion.question}. Opções: ${activeQuestion.options.join(
                        '. '
                      )}`
                    )
              }
              className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-stone-800 text-[#C83E5B] dark:text-rose-300 border border-rose-200 dark:border-stone-700 font-extrabold text-xs flex items-center gap-2 shrink-0"
            >
              <i className="fa-solid fa-volume-high" />
              <span>Ouvir Pergunta na Voz da Vovó</span>
            </button>
          </div>

          <div className="space-y-3">
            {activeQuestion.options.map((opt, idx) => {
              const isChosen = selectedOption === idx;
              const isCorrect = idx === activeQuestion.correctIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuizOption(idx)}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-3 transition ${
                    selectedOption === null
                      ? 'bg-[#F8F6F2] dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-[#C83E5B]'
                      : isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-[#1E7E5A] text-[#1E7E5A] dark:text-emerald-300'
                      : isChosen
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-800 dark:text-rose-200'
                      : 'bg-[#F8F6F2] dark:bg-stone-950 border-stone-200 dark:border-stone-800 opacity-60'
                  }`}
                >
                  <span>{opt}</span>
                  {selectedOption !== null && isCorrect && (
                    <i className="fa-solid fa-circle-check text-xl text-[#1E7E5A] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedOption !== null && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs sm:text-sm font-bold leading-relaxed">
                <i className="fa-solid fa-star text-amber-500 mr-1.5" />
                {activeQuestion.explanation}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedOption(null);
                  setCurrentQuizIdx((i) => (i + 1) % VOVO_QUIZ_QUESTIONS.length);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#C83E5B] text-white font-extrabold text-xs shrink-0"
              >
                Próxima Pergunta
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-ABA 3: GERADOR DE CARTÕES DE BOM DIA / BOA TARDE PARA WHATSAPP */}
      {subTab === 'whatsapp-greetings' && (
        <div
          className={`rounded-3xl border p-6 sm:p-8 shadow-sm space-y-6 overflow-hidden ${
            highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
          }`}
        >
          <div className="space-y-1 border-b border-stone-100 dark:border-stone-800 pb-4">
            <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
              <i className="fa-brands fa-whatsapp text-[#25D366]" />
              <span>Mensagens Carinhosas de Bom Dia, Boa Tarde e Boa Noite da Vovó</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Escolha o momento do dia e envie uma mensagem linda com sugestão de receita para o grupo da família no WhatsApp!
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {GREETING_TEMPLATES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGreetingId(g.id)}
                className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 border transition ${
                  selectedGreetingId === g.id
                    ? 'bg-[#C83E5B] text-white border-[#C83E5B] shadow-sm'
                    : 'bg-[#F8F6F2] dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-700'
                }`}
              >
                <i className={`fa-solid ${g.icon}`} />
                <span>{g.period}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 p-6 rounded-3xl bg-gradient-to-br from-rose-50 via-amber-50/70 to-emerald-50/60 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 border-2 border-rose-200 dark:border-stone-700 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C83E5B] text-white text-xs font-extrabold">
                <i className={`fa-solid ${activeGreeting.icon}`} />
                <span>{activeGreeting.title}</span>
              </span>
              <p className="font-serif-vovo text-lg sm:text-xl font-bold leading-relaxed text-stone-800 dark:text-stone-100">
                “{activeGreeting.message}”
              </p>
              {includeRecipeTip && featuredRecipe && (
                <div className="p-3 rounded-2xl bg-white/90 dark:bg-stone-800 border border-rose-200 dark:border-stone-700 text-xs font-bold text-[#1E7E5A] dark:text-emerald-300">
                  <i className="fa-solid fa-utensils mr-1.5" />
                  Sugestão Deliciosa de Hoje: <strong>{featuredRecipe.title}</strong>
                </div>
              )}
              <p className="text-xs font-extrabold text-[#C83E5B] dark:text-rose-300">
                Com todo carinho, {customFamilyName} • Caderno da Vovó
              </p>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-stone-500 dark:text-stone-400 mb-1">
                  Assinar mensagem como:
                </label>
                <input
                  type="text"
                  value={customFamilyName}
                  onChange={(e) => setCustomFamilyName(e.target.value)}
                  className="w-full min-w-0 px-4 py-2.5 rounded-xl bg-[#F8F6F2] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-bold text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRecipeTip}
                  onChange={(e) => setIncludeRecipeTip(e.target.checked)}
                  className="rounded text-[#C83E5B]"
                />
                <span>Incluir sugestão da receita do dia na mensagem</span>
              </label>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(fullWhatsAppText)}`,
                      '_blank'
                    )
                  }
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
                >
                  <i className="fa-brands fa-whatsapp text-lg" />
                  <span>Enviar no WhatsApp da Família</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    isSpeaking ? stopSpeaking() : speakText(activeGreeting.message)
                  }
                  className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 dark:bg-stone-800 text-[#C83E5B] dark:text-rose-300 border border-rose-200 dark:border-stone-700 font-extrabold text-xs flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-volume-high" />
                  <span>Ouvir Mensagem na Voz da Vovó</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
