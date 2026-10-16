import React, { useEffect, useState } from 'react';
import {
  CaptchaChallenge,
  CommentItem,
  MonetizationConfig,
  Recipe,
  UserProfile,
} from '../types';
import { fetchCaptchaChallenge, postRecipeCommentApi } from '../api/client';
import { useVoiceReader } from '../hooks/useVoiceReader';
import { CookingModeModal } from '../components/CookingModeModal';
import { AdSenseBanner } from '../components/AdSenseBanner';
import { SEOHead } from '../components/SEOHead';

interface RecipeDetailProps {
  recipe: Recipe;
  user: UserProfile | null;
  monetization: MonetizationConfig | null;
  onBack: () => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onDeleteRecipe: (recipe: Recipe) => void;
  onOpenVipModal: () => void;
  highContrastDark: boolean;
}

/**
 * Multiplica dinamicamente as quantidades numéricas do ingrediente (1/2x, 1x, 2x, 3x) — Inspirado no NYT Cooking!
 */
function scaleIngredientText(rawText: string, multiplier: number): string {
  if (multiplier === 1) return rawText;
  return rawText.replace(/(\d+(?:[\.,]\d+)?)/g, (match) => {
    const val = parseFloat(match.replace(',', '.'));
    if (isNaN(val)) return match;
    const scaled = Number((val * multiplier).toFixed(1));
    return String(scaled).replace('.', ',');
  });
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  user,
  monetization,
  onBack,
  onToggleFavorite,
  onDeleteRecipe,
  onOpenVipModal,
  highContrastDark,
}) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1);
  const [cookingModeOpen, setCookingModeOpen] = useState(false);

  // Comentários & Captcha Próprio
  const [comments, setComments] = useState<CommentItem[]>(recipe.comments || []);
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [madeIt, setMadeIt] = useState(true);
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [commentFeedback, setCommentFeedback] = useState<{
    type: 'ok' | 'err';
    msg: string;
  } | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const { isSpeaking, speakText, stopSpeaking } = useVoiceReader();

  const isLockedVip = Boolean(recipe.isVipOnly && !user?.isVip);

  const loadNewCaptcha = async () => {
    try {
      const c = await fetchCaptchaChallenge();
      setCaptcha(c);
      setCaptchaAnswer('');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setComments(recipe.comments || []);
    loadNewCaptcha();
  }, [recipe]);

  const toggleIngredientCheck = (id: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const readAllIngredients = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    const listText = recipe.ingredients
      .map((i) => scaleIngredientText(i.rawText, portionMultiplier))
      .join('. ');
    speakText(
      `Ingredientes para ${recipe.title}. Você vai precisar de: ${listText}. ${
        recipe.chefTip ? recipe.chefTip : ''
      }`
    );
  };

  const handleShareWhatsApp = () => {
    const ingList = recipe.ingredients
      .map((i) => `• ${scaleIngredientText(i.rawText, portionMultiplier)}`)
      .join('\n');
    const text = `👵 *${recipe.title}* (Caderno da Vovó)\n⏱️ Preparo: ${
      recipe.prepTimeMinutes || 35
    } min | 🍽️ Rende: ${recipe.servings || '6 porções'}\n\n🧺 *Ingredientes:*\n${ingList}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captcha) return;
    setSubmittingComment(true);
    setCommentFeedback(null);
    try {
      const res = await postRecipeCommentApi(recipe.id, {
        authorName: user?.name || authorName,
        rating,
        content: commentText,
        madeIt,
        captchaToken: captcha.captchaToken,
        captchaAnswer,
      });
      setComments((prev) => [res.comment, ...prev]);
      setCommentText('');
      setCommentFeedback({ type: 'ok', msg: res.message });
      loadNewCaptcha();
    } catch (err: any) {
      setCommentFeedback({
        type: 'err',
        msg: err?.message || 'Erro ao enviar comentário.',
      });
      loadNewCaptcha();
    } finally {
      setSubmittingComment(false);
    }
  };

  const defaultImg =
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=900&q=80';

  const baseCalories = recipe.caloriesPerServ || 240;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <SEOHead recipe={recipe} />

      {/* Topo de Navegação & Compartilhamento Rápido */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            stopSpeaking();
            onBack();
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border shadow-sm transition ${
            highContrastDark
              ? 'bg-stone-900 text-stone-100 border-stone-700'
              : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <i className="fa-solid fa-arrow-left text-[#C83E5B]" />
          <span>Voltar para as Receitas</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-[#25D366] hover:bg-[#1EBE5B] text-white flex items-center gap-2 shadow-sm transition"
          >
            <i className="fa-brands fa-whatsapp text-base" />
            <span>Enviar Lista no WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(recipe)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border transition ${
              recipe.isFavorite
                ? 'bg-[#C83E5B] text-white border-[#C83E5B]'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-rose-50'
            }`}
          >
            <i className={`${recipe.isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart`} />
            <span>{recipe.isFavorite ? 'Salva' : 'Favoritar'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-white text-stone-700 border border-stone-300 hover:bg-stone-100 flex items-center gap-2 transition"
          >
            <i className="fa-solid fa-print text-stone-600" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Cabeçalho Editorial da Receita */}
      <div
        className={`rounded-3xl border overflow-hidden shadow-sm mb-8 ${
          highContrastDark
            ? 'bg-stone-900 border-stone-800 text-white'
            : 'bg-white border-stone-200/90 text-[#1E1B18]'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-5 h-72 lg:h-auto bg-stone-100 relative">
            <img
              src={recipe.imageUrl || defaultImg}
              alt={recipe.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultImg;
              }}
            />
            {recipe.isVipOnly && (
              <span className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold px-3.5 py-1 rounded-full text-xs shadow flex items-center gap-1.5">
                <i className="fa-solid fa-crown" />
                <span>Receita Exclusiva VIP</span>
              </span>
            )}
          </div>

          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full font-bold text-xs bg-rose-50 text-[#C83E5B] border border-rose-200">
                  <i className="fa-solid fa-utensils mr-1.5" />
                  {recipe.category}
                </span>
                <span className="px-3 py-1 rounded-full font-bold text-xs bg-amber-50 text-amber-800 border border-amber-200">
                  <i className="fa-solid fa-star text-amber-500 mr-1" />
                  {(recipe.rating || 4.9).toFixed(1)} ({comments.length} avaliações)
                </span>
                <span className="px-3 py-1 rounded-full font-bold text-xs bg-emerald-50 text-[#1E7E5A] border border-emerald-200">
                  <i className="fa-solid fa-fire-flame-simple mr-1" />
                  {baseCalories} kcal/porção
                </span>
              </div>

              <h1 className="font-serif-vovo text-2xl sm:text-4xl font-bold leading-snug mb-3">
                {recipe.title}
              </h1>

              {recipe.description && (
                <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 mb-5 leading-relaxed">
                  {recipe.description}
                </p>
              )}

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80 text-center">
                  <i className="fa-regular fa-clock text-[#C83E5B] text-lg mb-1 block" />
                  <span className="text-xs text-stone-500 block">Preparo</span>
                  <strong className="text-sm">{recipe.prepTimeMinutes || 35} min</strong>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80 text-center">
                  <i className="fa-solid fa-bowl-food text-[#1E7E5A] text-lg mb-1 block" />
                  <span className="text-xs text-stone-500 block">Rendimento</span>
                  <strong className="text-sm">{recipe.servings || '6 porções'}</strong>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80 text-center">
                  <i className="fa-solid fa-award text-amber-600 text-lg mb-1 block" />
                  <span className="text-xs text-stone-500 block">Dificuldade</span>
                  <strong className="text-sm">{recipe.difficulty || 'Fácil'}</strong>
                </div>
              </div>
            </div>

            {!isLockedVip && (
              <div className="no-print space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setCookingModeOpen(true);
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-base bg-[#1E7E5A] hover:bg-emerald-800 text-white flex items-center justify-center gap-2.5 shadow-md transition"
                >
                  <i className="fa-solid fa-play-circle text-xl" />
                  <span>Iniciar Modo Cozinha Guiado (Voz + Relógio)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Segredinho da Vovó */}
      {recipe.chefTip && (
        <div className="mb-8 p-5 rounded-3xl bg-amber-50/90 border-2 border-dashed border-amber-300 flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <i className="fa-solid fa-wand-magic-sparkles text-lg" />
          </div>
          <div>
            <h3 className="font-serif-vovo text-lg font-bold text-amber-950">
              Segredinho da Vovó Helena:
            </h3>
            <p className="text-sm sm:text-base font-semibold text-amber-900 mt-0.5">
              {recipe.chefTip}
            </p>
          </div>
        </div>
      )}

      {isLockedVip ? (
        <div className="rounded-3xl border-2 border-amber-400 bg-white p-8 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <i className="fa-solid fa-crown text-3xl" />
          </div>
          <h2 className="font-serif-vovo text-2xl sm:text-3xl font-bold text-stone-900">
            Receita Exclusiva do Clube VIP da Vovó
          </h2>
          <p className="text-stone-600 max-w-xl mx-auto text-sm sm:text-base">
            Assine o Clube VIP (ou use o login rápido VIP de demonstração) para desbloquear todos
            os ingredientes, o modo cozinha falado e navegar sem anúncios!
          </p>
          <button
            type="button"
            onClick={onOpenVipModal}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-base shadow-md inline-flex items-center gap-2"
          >
            <i className="fa-solid fa-unlock-keyhole" />
            <span>Desbloquear com o Clube VIP</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Coluna Esquerda: Ingredientes + Calculadora de Porções */}
            <section
              className={`lg:col-span-5 rounded-3xl border p-6 shadow-sm self-start space-y-4 ${
                highContrastDark
                  ? 'bg-stone-900 border-stone-800 text-white'
                  : 'bg-white border-stone-200/90 text-[#1E1B18]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                  <i className="fa-solid fa-basket-shopping text-[#C83E5B] text-lg" />
                  <span>Ingredientes</span>
                </h2>

                <button
                  type="button"
                  onClick={readAllIngredients}
                  className="no-print px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-[#C83E5B] border border-rose-200 flex items-center gap-1.5 transition"
                >
                  <i className={isSpeaking ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'} />
                  <span>{isSpeaking ? 'Parar Voz' : 'Ouvir Lista'}</span>
                </button>
              </div>

              {/* Calculadora Inteligente de Porções (Inspirada no NYT Cooking) */}
              <div className="no-print p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80">
                <span className="text-xs font-extrabold uppercase text-stone-500 flex items-center gap-1.5 mb-2">
                  <i className="fa-solid fa-scale-balanced text-[#C83E5B]" />
                  <span>Ajustar Quantidade da Receita:</span>
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { mult: 0.5, label: '½x Metade' },
                    { mult: 1, label: '1x Normal' },
                    { mult: 2, label: '2x Dobro' },
                    { mult: 3, label: '3x Triplo' },
                  ].map((opt) => (
                    <button
                      key={opt.mult}
                      type="button"
                      onClick={() => setPortionMultiplier(opt.mult)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                        portionMultiplier === opt.mult
                          ? 'bg-[#C83E5B] text-white shadow-sm'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-rose-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <ul className="space-y-2.5">
                {recipe.ingredients.map((ing) => {
                  const checked = !!checkedIngredients[ing.id];
                  const scaledText = scaleIngredientText(ing.rawText, portionMultiplier);
                  return (
                    <li key={ing.id}>
                      <button
                        type="button"
                        onClick={() => toggleIngredientCheck(ing.id)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition ${
                          checked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : highContrastDark
                            ? 'bg-stone-950 border-stone-800 text-stone-200'
                            : 'bg-[#F8F6F2] border-stone-200/80 hover:bg-rose-50/40'
                        }`}
                      >
                        <i
                          className={`text-lg ${
                            checked
                              ? 'fa-solid fa-square-check text-[#1E7E5A]'
                              : 'fa-regular fa-square text-stone-400'
                          }`}
                        />
                        <span
                          className={`text-sm sm:text-base font-semibold ${
                            checked ? 'line-through opacity-65' : ''
                          }`}
                        >
                          {scaledText}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Coluna Direita: Modo de Preparo */}
            <section
              className={`lg:col-span-7 rounded-3xl border p-6 shadow-sm ${
                highContrastDark
                  ? 'bg-stone-900 border-stone-800 text-white'
                  : 'bg-white border-stone-200/90 text-[#1E1B18]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-3 border-b border-stone-100 dark:border-stone-800">
                <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                  <i className="fa-solid fa-kitchen-set text-[#1E7E5A] text-lg" />
                  <span>Modo de Preparo</span>
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setCookingModeOpen(true);
                  }}
                  className="no-print px-4 py-1.5 rounded-xl text-xs font-extrabold bg-[#1E7E5A] hover:bg-emerald-800 text-white flex items-center gap-1.5 transition"
                >
                  <i className="fa-solid fa-expand" />
                  <span>Tela Cheia Passo a Passo</span>
                </button>
              </div>

              <ol className="space-y-4">
                {recipe.steps.map((step, index) => (
                  <li
                    key={step.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      highContrastDark
                        ? 'bg-stone-950 border-stone-800'
                        : 'bg-[#F8F6F2] border-stone-200/80'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="w-8 h-8 rounded-xl bg-[#C83E5B] text-white font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm sm:text-base font-semibold leading-relaxed">
                          {step.instruction}
                        </p>
                        {step.timerSeconds && step.timerSeconds > 0 && (
                          <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-[#1E7E5A] border border-emerald-200 text-xs font-bold">
                            <i className="fa-regular fa-bell" />
                            <span>Timer integrado de {Math.round(step.timerSeconds / 60)} min</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakText(`Passo ${index + 1}. ${step.instruction}`)}
                      className="no-print self-end sm:self-center px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 text-[#C83E5B] border border-stone-200 shrink-0 flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-volume-high" />
                      <span>Ouvir</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <AdSenseBanner
            config={monetization}
            user={user}
            slotType="recipe"
            onOpenVipModal={onOpenVipModal}
          />

          {/* SEÇÃO DE COMENTÁRIOS, NOTAS E CAPTCHA PRÓPRIO DA VOVÓ */}
          <section
            className={`no-print mt-10 rounded-3xl border p-6 sm:p-8 shadow-sm space-y-6 ${
              highContrastDark
                ? 'bg-stone-900 border-stone-800 text-white'
                : 'bg-white border-stone-200/90 text-[#1E1B18]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                  <i className="fa-regular fa-comments text-[#C83E5B]" />
                  <span>Comentários & Quem Já Fez ({comments.length})</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  Conte como ficou a sua receita ou deixe uma dica para outros leitores!
                </p>
              </div>
            </div>

            {/* Formulário de Novo Comentário Protegido pelo Captcha Próprio */}
            <form
              onSubmit={handleSubmitComment}
              className="p-5 rounded-2xl bg-[#F8F6F2] dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-4"
            >
              {commentFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    commentFeedback.type === 'ok'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}
                >
                  <i
                    className={
                      commentFeedback.type === 'ok'
                        ? 'fa-solid fa-circle-check'
                        : 'fa-solid fa-circle-exclamation'
                    }
                  />
                  <span>{commentFeedback.msg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {!user && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                      Seu Nome:
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Ex: Dona Rosa"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm font-semibold"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Sua Nota:
                  </label>
                  <div className="flex items-center gap-1 py-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-xl text-amber-500 hover:scale-110 transition"
                      >
                        <i className={`${star <= rating ? 'fa-solid' : 'fa-regular'} fa-star`} />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-stone-600">{rating}/5</span>
                  </div>
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1E7E5A]">
                    <input
                      type="checkbox"
                      checked={madeIt}
                      onChange={(e) => setMadeIt(e.target.checked)}
                      className="w-4 h-4 accent-[#1E7E5A]"
                    />
                    <i className="fa-solid fa-circle-check text-[#1E7E5A]" />
                    <span>Eu fiz esta receita e deu certo!</span>
                  </label>
                </div>
              </div>

              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escreva aqui o que achou da receita ou alguma dica especial..."
                className="w-full p-3.5 rounded-xl border border-stone-300 text-stone-900 text-sm font-semibold"
                required
              />

              {/* Captcha Próprio da Vovó (SVG + Resposta) */}
              {captcha && (
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-stone-200 dark:border-stone-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <img
                      src={captcha.svgDataUri}
                      alt="Desafio Captcha da Vovó"
                      className="h-12 rounded-xl border border-stone-300 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={loadNewCaptcha}
                      title="Gerar outra continha"
                      className="p-2 rounded-lg bg-white border border-stone-300 text-stone-600 hover:text-stone-900 text-xs"
                    >
                      <i className="fa-solid fa-arrows-rotate" />
                    </button>
                    <input
                      type="number"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      placeholder="Resposta da continha"
                      className="w-44 px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm font-bold"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="px-6 py-2.5 rounded-xl bg-[#C83E5B] hover:bg-rose-700 text-white font-bold text-sm shadow transition"
                  >
                    {submittingComment ? 'Enviando...' : 'Publicar Avaliação'}
                  </button>
                </div>
              )}
            </form>

            {/* Lista de Comentários */}
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-[#F8F6F2]/60 dark:bg-stone-950"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-rose-100 text-[#C83E5B] font-extrabold text-xs flex items-center justify-center">
                        {c.authorName.charAt(0).toUpperCase()}
                      </span>
                      <strong className="text-sm">{c.authorName}</strong>
                      {c.authorIsVip && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold inline-flex items-center gap-1">
                          <i className="fa-solid fa-crown text-amber-600" />
                          <span>Membro VIP</span>
                        </span>
                      )}
                      {c.madeIt && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#1E7E5A] text-[10px] font-extrabold inline-flex items-center gap-1">
                          <i className="fa-solid fa-circle-check" />
                          <span>Fez e Aprovou</span>
                        </span>
                      )}
                    </div>

                    <div className="text-amber-500 text-xs">
                      {Array.from({ length: c.rating }).map((_, idx) => (
                        <i key={idx} className="fa-solid fa-star mr-0.5" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-stone-700 dark:text-stone-300 pl-10">{c.content}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {user?.role === 'ADMIN' && (
        <div className="no-print mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Deseja apagar a receita "${recipe.title}"?`)) {
                onDeleteRecipe(recipe);
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5"
          >
            <i className="fa-solid fa-trash-can" />
            <span>Excluir Receita (Admin)</span>
          </button>
        </div>
      )}

      {cookingModeOpen && (
        <CookingModeModal
          recipe={recipe}
          onClose={() => setCookingModeOpen(false)}
          highContrastDark={highContrastDark}
        />
      )}
    </div>
  );
};
