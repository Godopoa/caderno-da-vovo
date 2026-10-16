import React, { useState } from 'react';
import { MonetizationConfig, Recipe, UserProfile } from '../types';
import { useVoiceReader } from '../hooks/useVoiceReader';
import { CookingModeModal } from '../components/CookingModeModal';
import { AdSenseBanner } from '../components/AdSenseBanner';

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
  const [cookingModeOpen, setCookingModeOpen] = useState(false);
  const { isSpeaking, speakText, stopSpeaking } = useVoiceReader();

  const isLockedVip = Boolean(recipe.isVipOnly && !user?.isVip);

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
    const listText = recipe.ingredients.map((i) => i.rawText).join('. ');
    speakText(
      `Ingredientes para ${recipe.title}. Você vai precisar de: ${listText}. ${
        recipe.chefTip ? recipe.chefTip : ''
      }`
    );
  };

  const defaultImg =
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=900&q=80';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Topo de Navegação */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            stopSpeaking();
            onBack();
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border shadow-sm transition ${
            highContrastDark
              ? 'bg-stone-900 text-amber-300 border-stone-700'
              : 'bg-white text-stone-800 border-amber-200 hover:bg-amber-50'
          }`}
        >
          <i className="fa-solid fa-arrow-left" />
          <span>Voltar para o Caderno</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(recipe)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border transition ${
              recipe.isFavorite
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-rose-50'
            }`}
          >
            <i className={`${recipe.isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart`} />
            <span>{recipe.isFavorite ? 'Salva nas Favoritas' : 'Favoritar'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-white text-stone-700 border border-stone-300 hover:bg-stone-100 flex items-center gap-2 transition"
          >
            <i className="fa-solid fa-print text-amber-800" />
            <span>Imprimir Receita</span>
          </button>
        </div>
      </div>

      {/* Card Principal de Apresentação da Receita */}
      <div
        className={`rounded-3xl border overflow-hidden shadow-md mb-8 ${
          highContrastDark
            ? 'bg-stone-900 border-stone-800 text-white'
            : 'bg-white border-amber-200/80 text-[#2D241E]'
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
              <span className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold px-3.5 py-1 rounded-full text-xs shadow flex items-center gap-1.5">
                <i className="fa-solid fa-crown" />
                <span>Receita Exclusiva VIP</span>
              </span>
            )}
          </div>

          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full font-bold text-xs bg-amber-100 text-amber-900">
                  <i className="fa-solid fa-utensils mr-1.5" />
                  {recipe.category}
                </span>
                <span className="px-3 py-1 rounded-full font-bold text-xs bg-amber-50 text-amber-800 border border-amber-200">
                  <i className="fa-solid fa-star text-amber-500 mr-1" />
                  {(recipe.rating || 4.9).toFixed(1)} ({recipe.viewsCount || 150} visualizações)
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
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-stone-800 border border-amber-200/60 text-center">
                  <i className="fa-regular fa-clock text-amber-700 text-lg mb-1 block" />
                  <span className="text-xs text-stone-500 block">Preparo</span>
                  <strong className="text-sm">{recipe.prepTimeMinutes || 35} min</strong>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-stone-800 border border-emerald-200/60 text-center">
                  <i className="fa-solid fa-bowl-food text-emerald-700 text-lg mb-1 block" />
                  <span className="text-xs text-stone-500 block">Rendimento</span>
                  <strong className="text-sm">{recipe.servings || '6 porções'}</strong>
                </div>
                <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-stone-800 border border-orange-200/60 text-center">
                  <i className="fa-solid fa-fire-burner text-orange-600 text-lg mb-1 block" />
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
                  className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-base bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-2.5 shadow-md transition"
                >
                  <i className="fa-solid fa-play-circle text-xl" />
                  <span>Iniciar Modo Cozinha Guiado (Voz + Timer)</span>
                </button>

                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-stone-500 hover:text-amber-800 flex items-center justify-center gap-1.5 pt-1"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                    <span>Fonte parceira: TudoGostoso.com.br</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Segredinho da Vovó */}
      {recipe.chefTip && (
        <div className="mb-8 p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border-2 border-dashed border-amber-400 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow">
            <i className="fa-solid fa-wand-magic-sparkles text-xl" />
          </div>
          <div>
            <h3 className="font-serif-vovo text-lg font-bold text-amber-950">
              O Segredinho da Vovó para não errar:
            </h3>
            <p className="text-sm sm:text-base font-semibold text-amber-900 mt-0.5">
              {recipe.chefTip}
            </p>
          </div>
        </div>
      )}

      {/* Bloqueio Exclusivo VIP caso a receita seja VIP e o usuário ainda não seja assinante */}
      {isLockedVip ? (
        <div className="rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border-2 border-amber-300">
            <i className="fa-solid fa-crown text-3xl" />
          </div>
          <h2 className="font-serif-vovo text-2xl sm:text-3xl font-bold text-amber-950">
            Esta é uma Receita Exclusiva do Clube VIP da Vovó
          </h2>
          <p className="text-stone-600 max-w-xl mx-auto text-sm sm:text-base">
            Assine o Clube VIP (ou entre com a conta VIP de demonstração em 1 clique) para liberar os{' '}
            <strong>{recipe.ingredients.length} ingredientes</strong>, o passo a passo completo com
            voz e navegar sem nenhum anúncio!
          </p>
          <button
            type="button"
            onClick={onOpenVipModal}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-base shadow-md inline-flex items-center gap-2 transition"
          >
            <i className="fa-solid fa-unlock-keyhole" />
            <span>Desbloquear Receita com o Clube VIP</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Coluna Esquerda: Ingredientes */}
            <section
              className={`lg:col-span-5 rounded-3xl border p-6 shadow-sm self-start ${
                highContrastDark
                  ? 'bg-stone-900 border-stone-800 text-white'
                  : 'bg-white border-amber-200/80 text-[#2D241E]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-amber-100 dark:border-stone-800">
                <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                  <i className="fa-solid fa-basket-shopping text-amber-700 text-lg" />
                  <span>Ingredientes</span>
                </h2>

                <button
                  type="button"
                  onClick={readAllIngredients}
                  className="no-print px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center gap-1.5 transition"
                >
                  <i className={isSpeaking ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'} />
                  <span>{isSpeaking ? 'Parar Voz' : 'Ouvir Lista'}</span>
                </button>
              </div>

              <p className="text-xs text-stone-500 font-semibold mb-3">
                Marque os itens que você já separou na bancada:
              </p>

              <ul className="space-y-2.5">
                {recipe.ingredients.map((ing) => {
                  const checked = !!checkedIngredients[ing.id];
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
                            : 'bg-[#FDFBF7] border-amber-200/60 hover:bg-amber-50/50'
                        }`}
                      >
                        <i
                          className={`text-lg ${
                            checked
                              ? 'fa-solid fa-square-check text-emerald-600'
                              : 'fa-regular fa-square text-stone-400'
                          }`}
                        />
                        <span className={`text-sm sm:text-base font-semibold ${checked ? 'line-through opacity-65' : ''}`}>
                          {ing.rawText}
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
                  : 'bg-white border-amber-200/80 text-[#2D241E]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-3 border-b border-amber-100 dark:border-stone-800">
                <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                  <i className="fa-solid fa-kitchen-set text-emerald-700 text-lg" />
                  <span>Modo de Preparo</span>
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setCookingModeOpen(true);
                  }}
                  className="no-print px-4 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition"
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
                        : 'bg-[#FDFBF7] border-amber-200/60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="w-8 h-8 rounded-xl bg-amber-800 text-white font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm sm:text-base font-semibold leading-relaxed">
                          {step.instruction}
                        </p>
                        {step.timerSeconds && step.timerSeconds > 0 && (
                          <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
                            <i className="fa-regular fa-bell text-amber-700" />
                            <span>Timer integrado de {Math.round(step.timerSeconds / 60)} min</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakText(`Passo ${index + 1}. ${step.instruction}`)}
                      className="no-print self-end sm:self-center px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 shrink-0 flex items-center gap-1.5"
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
        </>
      )}

      {/* Exclusão apenas para Admin */}
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
