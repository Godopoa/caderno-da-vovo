import React, { useEffect, useMemo, useState } from 'react';
import { Recipe, UserProfile } from '../types';
import { SeniorRecipeCard } from '../components/SeniorRecipeCard';
import { CloudSyncNotice } from '../components/CloudSyncNotice';
import { pushLocalDataToCloudIfLoggedIn } from '../api/client';

interface KitchenEconomyHubPageProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onSpeakSummary: (recipe: Recipe) => void;
  highContrastDark: boolean;
  user: UserProfile | null;
  onOpenAuthModal: (mode: 'login' | 'register' | 'vip') => void;
}

type EconomySubTab = 'planner' | 'fridge' | 'converter' | 'pricing';

const DAYS_OF_WEEK = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const FRIDGE_QUICK_ITEMS = [
  'Arroz cozido',
  'Ovos',
  'Frango',
  'Batata',
  'Banana',
  'Leite',
  'Pão',
  'Tomate',
  'Queijo',
  'Cenoura',
  'Milho',
  'Farinha de trigo',
];

const ZERO_WASTE_VOVO_RECIPES = [
  {
    title: 'Bolinho de Arroz Crocante de Forno ou Frigideira',
    uses: ['Arroz cozido', 'Ovos', 'Queijo', 'Farinha de trigo'],
    time: '20 min',
    tip: 'Use aquele arroz de ontem! Misture 2 xícaras de arroz cozido, 1 ovo, 3 colheres de queijo ralado, cheiro-verde e 3 colheres de farinha até dar ponto.',
  },
  {
    title: 'Pudim de Pão Amanhecido com Calda de Caramelo',
    uses: ['Pão', 'Leite', 'Ovos'],
    time: '45 min',
    tip: 'Não jogue pão duro fora! Bata 3 pães amanhecidos picados com 500 ml de leite morno, 3 ovos e 1 xícara de açúcar. Asse em banho-maria.',
  },
  {
    title: 'Doce Caseiro de Banana Madura com Canela (Sem Desperdício)',
    uses: ['Banana'],
    time: '15 min',
    tip: 'Sabe aquelas bananas bem pintadinhas na fruteira? Amasse com um garfo, leve ao fogo baixo com cravo e canela até encorpar. Nem precisa de muito açúcar!',
  },
  {
    title: 'Torta Rápida de Liquidificador Limpa-Geladeira',
    uses: ['Ovos', 'Leite', 'Farinha de trigo', 'Frango', 'Tomate', 'Milho', 'Cenoura'],
    time: '35 min',
    tip: 'Qualquer restinho de frango desfiado, milho, ervilha, cenoura ralada e tomate vira um recheio delicioso para uma massa rápida de liquidificador.',
  },
];

// Densidade aproximada por 1 xícara padrão (240ml) em gramas
const INGREDIENT_CONVERSIONS: Record<
  string,
  { label: string; gramsPerCup: number; gramsPerTbsp: number; isLiquid?: boolean }
> = {
  farinha_trigo: { label: 'Farinha de Trigo', gramsPerCup: 120, gramsPerTbsp: 7.5 },
  acucar_refinado: { label: 'Açúcar Refinado / Cristal', gramsPerCup: 180, gramsPerTbsp: 12 },
  acucar_mascavo: { label: 'Açúcar Mascavo', gramsPerCup: 150, gramsPerTbsp: 10 },
  manteiga: { label: 'Manteiga ou Margarina', gramsPerCup: 200, gramsPerTbsp: 12.5 },
  amido_milho: { label: 'Amido de Milho (Maizena)', gramsPerCup: 150, gramsPerTbsp: 9 },
  chocolate_po: { label: 'Chocolate em Pó / Cacau', gramsPerCup: 90, gramsPerTbsp: 6 },
  fuba: { label: 'Fubá / Farinha de Milho', gramsPerCup: 130, gramsPerTbsp: 8 },
  aveia: { label: 'Aveia em Flocos', gramsPerCup: 80, gramsPerTbsp: 5 },
  mel: { label: 'Mel Puro', gramsPerCup: 300, gramsPerTbsp: 18 },
  liquidos: { label: 'Leite / Água / Óleo / Suco', gramsPerCup: 240, gramsPerTbsp: 15, isLiquid: true },
};

const EMERGENCY_SUBSTITUTIONS = [
  {
    missing: 'Acabou o Ovo (1 unidade)',
    replaceWith: '1 colher (sopa) de linhaça ou chia hidratada em 3 colheres de água morna por 5 min, ou ½ banana bem amassada (para bolos doces).',
  },
  {
    missing: 'Acabou o Fermento de Bolo (1 colher de sopa)',
    replaceWith: '½ colher (chá) de bicarbonato de sódio + 1 colher (chá) de vinagre branco ou caldo de limão (coloque por último na massa).',
  },
  {
    missing: 'Acabou o Creme de Leite',
    replaceWith: '1 xícara de leite integral morno batido no liquidificador com 2 colheres (sopa) de manteiga sem sal, ou 1 pote de iogurte natural sem açúcar.',
  },
  {
    missing: 'Acabou o Leite Condensado',
    replaceWith: 'Bata no liquidificador por 5 min: 1 xícara de leite em pó + 1 xícara de açúcar + ½ xícara de água fervente + 1 colher (sopa) de manteiga.',
  },
  {
    missing: 'Acabou a Manteiga na Receita de Bolo',
    replaceWith: 'Use ¾ da medida em óleo vegetal (ex.: para substituir 100g de manteiga, use 75 ml de óleo de milho ou girassol).',
  },
  {
    missing: 'Precisa de Buttermilk (Leitelho para Bolo Fofinho)',
    replaceWith: 'Misture 1 xícara de leite morno com 1 colher (sopa) de suco de limão ou vinagre e deixe descansar 10 minutos até talhar levemente.',
  },
];

export const KitchenEconomyHubPage: React.FC<KitchenEconomyHubPageProps> = ({
  recipes,
  onSelectRecipe,
  onToggleFavorite,
  onSpeakSummary,
  highContrastDark,
  user,
  onOpenAuthModal,
}) => {
  const [subTab, setSubTab] = useState<EconomySubTab>('planner');

  // --- 1. Estado do Cardápio Semanal (Local + Nuvem) ---
  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('caderno_vovo_weekly_menu');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    const initial: Record<string, string> = {};
    DAYS_OF_WEEK.forEach((day, idx) => {
      if (recipes[idx % Math.max(1, recipes.length)]) {
        initial[day] = recipes[idx % recipes.length].id;
      }
    });
    return initial;
  });

  useEffect(() => {
    localStorage.setItem('caderno_vovo_weekly_menu', JSON.stringify(weeklyPlan));
    pushLocalDataToCloudIfLoggedIn();
  }, [weeklyPlan]);

  const handleAutoGenerateWeek = () => {
    if (recipes.length === 0) return;
    const shuffled = [...recipes].sort(() => Math.random() - 0.5);
    const nextPlan: Record<string, string> = {};
    DAYS_OF_WEEK.forEach((day, idx) => {
      nextPlan[day] = shuffled[idx % shuffled.length].id;
    });
    setWeeklyPlan(nextPlan);
  };

  const consolidatedShoppingList = useMemo(() => {
    const items: string[] = [];
    Object.values(weeklyPlan).forEach((recipeId) => {
      const found = recipes.find((r) => r.id === recipeId);
      if (found) {
        found.ingredients.forEach((ing) => items.push(ing.rawText));
      }
    });
    return Array.from(new Set(items));
  }, [weeklyPlan, recipes]);

  const handleSendWeeklyListWhatsApp = () => {
    const lines = DAYS_OF_WEEK.map((day) => {
      const r = recipes.find((rec) => rec.id === weeklyPlan[day]);
      return `• *${day}:* ${r ? r.title : 'Livre'}`;
    }).join('\n');
    const shopping = consolidatedShoppingList.slice(0, 25).map((i) => `- ${i}`).join('\n');
    const msg = `*Cardápio da Semana — Caderno da Vovó*\n\n${lines}\n\n*Lista de Feira da Semana:*\n${shopping}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // --- 2. Estado "O Que Tem na Geladeira?" ---
  const [selectedFridgeItems, setSelectedFridgeItems] = useState<string[]>(['Ovos', 'Leite']);
  const [customFridgeInput, setCustomFridgeInput] = useState('');

  const toggleFridgeItem = (item: string) => {
    setSelectedFridgeItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const matchingCatalogRecipes = useMemo(() => {
    const activeTerms = [
      ...selectedFridgeItems.map((s) => s.toLowerCase().split(' ')[0]),
      ...customFridgeInput
        .toLowerCase()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ];
    if (activeTerms.length === 0) return recipes;
    return recipes.filter((r) =>
      activeTerms.some(
        (term) =>
          r.title.toLowerCase().includes(term) ||
          r.ingredients.some((ing) => ing.rawText.toLowerCase().includes(term))
      )
    );
  }, [recipes, selectedFridgeItems, customFridgeInput]);

  // --- 3. Estado do Conversor de Medidas ---
  const [convIngredient, setConvIngredient] = useState<string>('farinha_trigo');
  const [convCups, setConvCups] = useState<number>(2);

  // --- 4. Estado da Calculadora "Faça e Venda" ---
  const [productName, setProductName] = useState('Bolo Caseiro da Vovó no Pote');
  const [ingredientsCost, setIngredientsCost] = useState<number>(28);
  const [packagingCost, setPackagingCost] = useState<number>(7);
  const [overheadPercent, setOverheadPercent] = useState<number>(15); // Gás, luz, água
  const [unitsYield, setUnitsYield] = useState<number>(10);
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(100);
  const [daysSoldPerMonth, setDaysSoldPerMonth] = useState<number>(20);

  useEffect(() => {
    localStorage.setItem(
      'caderno_vovo_pricing_calc',
      JSON.stringify({
        productName,
        ingredientsCost: String(ingredientsCost),
        packagingCost: String(packagingCost),
        overheadPercent: String(overheadPercent),
        unitsYield: String(unitsYield),
        profitMarginPercent: String(profitMarginPercent),
        daysSoldPerMonth: String(daysSoldPerMonth),
      })
    );
    pushLocalDataToCloudIfLoggedIn();
  }, [
    productName,
    ingredientsCost,
    packagingCost,
    overheadPercent,
    unitsYield,
    profitMarginPercent,
    daysSoldPerMonth,
  ]);

  const totalBatchCost =
    (ingredientsCost + packagingCost) * (1 + overheadPercent / 100);
  const unitCost = unitsYield > 0 ? totalBatchCost / unitsYield : 0;
  const suggestedUnitPrice = unitCost * (1 + profitMarginPercent / 100);
  const profitPerUnit = suggestedUnitPrice - unitCost;
  const profitPerBatch = profitPerUnit * unitsYield;
  const estimatedMonthlyProfit = profitPerBatch * daysSoldPerMonth;

  return (
    <div className="space-y-8">
      {/* Cabeçalho da Central de Economia Doméstica */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
          highContrastDark
            ? 'bg-stone-900 border-stone-800 text-white'
            : 'bg-gradient-to-r from-[#C83E5B] via-rose-600 to-amber-600 text-white border-rose-200'
        }`}
      >
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase tracking-wider">
            <i className="fa-solid fa-piggy-bank" />
            <span>Central da Dona de Casa & Economia do Lar</span>
          </span>
          <h1 className="font-serif-vovo text-3xl sm:text-4xl font-extrabold">
            Planejamento da Semana, Zero Desperdício & Renda Extra
          </h1>
          <p className="text-rose-50 text-sm sm:text-base leading-relaxed">
            Ferramentas práticas para economizar no supermercado, aproveitar o que tem na geladeira,
            converter medidas sem balança e calcular o preço justo das suas receitas para vender.
          </p>
        </div>

        {/* Sub-abas da Central */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          {[
            { id: 'planner', label: 'Cardápio & Feira', icon: 'fa-calendar-check' },
            { id: 'fridge', label: 'Na Geladeira', icon: 'fa-temperature-arrow-down' },
            { id: 'converter', label: 'Medidas & Trocas', icon: 'fa-scale-balanced' },
            { id: 'pricing', label: 'Faça e Venda', icon: 'fa-hand-holding-dollar' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as EconomySubTab)}
              className={`px-4 py-3 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition ${
                subTab === t.id
                  ? 'bg-white text-[#C83E5B] shadow-md'
                  : 'bg-black/20 hover:bg-black/30 text-white'
              }`}
            >
              <i className={`fa-solid ${t.icon}`} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Aviso de Salvamento Permanente na Nuvem vs. Modo Sem Login */}
      <CloudSyncNotice
        user={user}
        onOpenAuthModal={onOpenAuthModal}
        moduleName="seu Cardápio da Semana, Lista de Feira e Calculadora Faça e Venda"
      />

      {/* SUB-ABA 1: CARDÁPIO SEMANAL + LISTA DE FEIRA INTELIGENTE */}
      {subTab === 'planner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div
            className={`lg:col-span-7 rounded-3xl border p-6 sm:p-8 shadow-sm space-y-5 ${
              highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                  <i className="fa-solid fa-calendar-days text-[#C83E5B]" />
                  <span>Cardápio da Semana (Segunda a Domingo)</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  Escolha o prato de cada dia ou deixe a Vovó sortear uma semana econômica para você.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoGenerateWeek}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-[#C83E5B] text-[#C83E5B] hover:text-white border border-rose-200 font-extrabold text-xs flex items-center gap-2 transition"
              >
                <i className="fa-solid fa-wand-magic-sparkles" />
                <span>Sortear Semana Econômica</span>
              </button>
            </div>

            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const selectedId = weeklyPlan[day] || '';
                const currentRec = recipes.find((r) => r.id === selectedId);
                return (
                  <div
                    key={day}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      highContrastDark
                        ? 'bg-stone-950 border-stone-800'
                        : 'bg-[#F8F6F2] border-stone-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-28 font-extrabold text-xs uppercase tracking-wider text-[#C83E5B]">
                        {day}
                      </span>
                      <select
                        value={selectedId}
                        onChange={(e) =>
                          setWeeklyPlan((prev) => ({ ...prev, [day]: e.target.value }))
                        }
                        className="px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 text-sm font-bold focus:border-[#C83E5B] focus:outline-none"
                      >
                        {recipes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title} ({r.prepTimeMinutes || 35} min)
                          </option>
                        ))}
                      </select>
                    </div>

                    {currentRec && (
                      <button
                        type="button"
                        onClick={() => onSelectRecipe(currentRec)}
                        className="text-xs font-extrabold text-[#1E7E5A] hover:underline flex items-center gap-1 self-end sm:self-center"
                      >
                        <span>Abrir receita</span>
                        <i className="fa-solid fa-arrow-right" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lista de Feira Consolidada */}
          <div
            className={`lg:col-span-5 rounded-3xl border p-6 sm:p-8 shadow-sm space-y-5 ${
              highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="font-serif-vovo text-xl font-bold flex items-center gap-2">
                  <i className="fa-solid fa-cart-shopping text-[#1E7E5A]" />
                  <span>Lista de Feira Consolidada</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {consolidatedShoppingList.length} itens somados automaticamente para a semana
                </p>
              </div>
              <button
                type="button"
                onClick={handleSendWeeklyListWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <i className="fa-brands fa-whatsapp text-sm" />
                <span>WhatsApp</span>
              </button>
            </div>

            <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {consolidatedShoppingList.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#F8F6F2] dark:bg-stone-950 border border-stone-200/70 dark:border-stone-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5"
                >
                  <i className="fa-solid fa-check text-[#1E7E5A]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* SUB-ABA 2: O QUE TEM NA GELADEIRA? (ZERO DESPERDÍCIO) */}
      {subTab === 'fridge' && (
        <div className="space-y-8">
          <div
            className={`rounded-3xl border p-6 sm:p-8 shadow-sm space-y-5 ${
              highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-kitchen-set text-[#1E7E5A]" />
              <span>Marque o que você tem sobrando na geladeira ou despensa:</span>
            </h2>

            <div className="flex flex-wrap gap-2">
              {FRIDGE_QUICK_ITEMS.map((item) => {
                const active = selectedFridgeItems.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleFridgeItem(item)}
                    className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold border flex items-center gap-2 transition ${
                      active
                        ? 'bg-[#1E7E5A] text-white border-[#1E7E5A] shadow-sm'
                        : 'bg-[#F8F6F2] text-stone-700 border-stone-200 hover:border-[#1E7E5A]'
                    }`}
                  >
                    <i className={`fa-solid ${active ? 'fa-check' : 'fa-plus'}`} />
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>

            <div className="max-w-xl">
              <input
                type="text"
                value={customFridgeInput}
                onChange={(e) => setCustomFridgeInput(e.target.value)}
                placeholder="Ou digite outros ingredientes separados por vírgula (ex: mandioca, fubá, maçã)..."
                className="w-full px-4 py-3 rounded-2xl bg-[#F8F6F2] border border-stone-200 text-stone-800 text-sm font-semibold focus:bg-white focus:border-[#1E7E5A] focus:outline-none"
              />
            </div>
          </div>

          {/* Receitas de Ouro de Reaproveitamento da Vovó */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ZERO_WASTE_VOVO_RECIPES.map((zw, i) => (
              <div
                key={i}
                className={`p-5 rounded-3xl border shadow-sm space-y-2 ${
                  highContrastDark
                    ? 'bg-stone-900 border-stone-800'
                    : 'bg-emerald-50/50 border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1E7E5A] text-white text-[11px] font-extrabold">
                    Zero Desperdício • {zw.time}
                  </span>
                  <span className="text-xs font-bold text-stone-500">
                    Usa: {zw.uses.join(', ')}
                  </span>
                </div>
                <h3 className="font-serif-vovo text-lg font-bold text-stone-800 dark:text-white">
                  {zw.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {zw.tip}
                </p>
              </div>
            ))}
          </div>

          {/* Receitas do Catálogo que Combinam */}
          <div>
            <h3 className="font-serif-vovo text-2xl font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-utensils text-[#C83E5B]" />
              <span>Receitas do Caderno que usam esses ingredientes ({matchingCatalogRecipes.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchingCatalogRecipes.slice(0, 6).map((r) => (
                <SeniorRecipeCard
                  key={r.id}
                  recipe={r}
                  onOpen={onSelectRecipe}
                  onToggleFavorite={onToggleFavorite}
                  onSpeakSummary={onSpeakSummary}
                  highContrastDark={highContrastDark}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-ABA 3: CONVERSOR DE MEDIDAS DA VOVÓ & TABELA DE SUBSTITUIÇÕES */}
      {subTab === 'converter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Calculadora de Xícaras para Gramas / Colheres */}
          <div
            className={`lg:col-span-5 rounded-3xl border p-6 sm:p-8 shadow-sm space-y-5 ${
              highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-scale-balanced text-[#C83E5B]" />
              <span>Conversor de Xícaras & Gramas</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Não tem balança em casa? Escolha o ingrediente e a quantidade de xícaras para ver o peso exato e quantas colheres de sopa equivalem.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                  Ingrediente:
                </label>
                <select
                  value={convIngredient}
                  onChange={(e) => setConvIngredient(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F8F6F2] border border-stone-300 text-stone-800 font-bold text-sm"
                >
                  {Object.entries(INGREDIENT_CONVERSIONS).map(([k, val]) => (
                    <option key={k} value={k}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                  Quantidade de Xícaras (Padrão 240 ml):
                </label>
                <div className="flex flex-wrap gap-2">
                  {[0.25, 0.5, 0.75, 1, 1.5, 2, 3].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setConvCups(q)}
                      className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition ${
                        convCups === q
                          ? 'bg-[#C83E5B] text-white shadow'
                          : 'bg-[#F8F6F2] text-stone-700 border border-stone-200'
                      }`}
                    >
                      {q === 0.25 ? '¼ xíc' : q === 0.5 ? '½ xíc' : q === 0.75 ? '¾ xíc' : `${q} xíc`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resultado Instantâneo */}
              {INGREDIENT_CONVERSIONS[convIngredient] && (
                <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 text-stone-900 space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-200/70 pb-2">
                    <span className="text-xs font-bold text-stone-600">Peso Equivalente:</span>
                    <strong className="text-2xl font-black text-[#C83E5B]">
                      {Math.round(INGREDIENT_CONVERSIONS[convIngredient].gramsPerCup * convCups)}{' '}
                      {INGREDIENT_CONVERSIONS[convIngredient].isLiquid ? 'ml' : 'gramas'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-rose-200/70 pb-2">
                    <span className="text-xs font-bold text-stone-600">Em Colheres de Sopa:</span>
                    <strong className="text-lg font-extrabold text-[#1E7E5A]">
                      {Math.round(16 * convCups)} colheres (sopa)
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-600">Volume em Mililitros:</span>
                    <strong className="text-sm font-bold text-stone-700">
                      {Math.round(240 * convCups)} ml
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Guia de Substituições de Emergência */}
          <div
            className={`lg:col-span-7 rounded-3xl border p-6 sm:p-8 shadow-sm space-y-4 ${
              highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-arrows-rotate text-[#1E7E5A]" />
              <span>Faltou um Ingrediente na Hora do Preparo? Veja como Substituir!</span>
            </h2>
            <div className="space-y-3">
              {EMERGENCY_SUBSTITUTIONS.map((sub, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border ${
                    highContrastDark
                      ? 'bg-stone-950 border-stone-800'
                      : 'bg-[#F8F6F2] border-stone-200/80'
                  }`}
                >
                  <p className="font-extrabold text-sm text-[#C83E5B] flex items-center gap-2">
                    <i className="fa-solid fa-circle-question" />
                    <span>{sub.missing}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 mt-1 font-medium">
                    <strong className="text-[#1E7E5A]">Solução da Vovó:</strong> {sub.replaceWith}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-ABA 4: CALCULADORA "FAÇA E VENDA" (RENDA EXTRA EM CASA) */}
      {subTab === 'pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div
            className={`lg:col-span-6 rounded-3xl border p-6 sm:p-8 shadow-sm space-y-4 ${
              highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-calculator text-[#C83E5B]" />
              <span>Calculadora Faça e Venda da Vovó</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Descubra por quanto vender seus bolos, pães caseiros, doces ou salgados sem ter prejuízo com gás e embalagem.
            </p>

            <div>
              <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                O que você vai produzir?
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F8F6F2] border border-stone-300 text-stone-800 font-bold text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                  Custo dos Ingredientes (R$):
                </label>
                <input
                  type="number"
                  value={ingredientsCost}
                  onChange={(e) => setIngredientsCost(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F6F2] border border-stone-300 text-stone-800 font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                  Custo de Embalagens (R$):
                </label>
                <input
                  type="number"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F6F2] border border-stone-300 text-stone-800 font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                  Rendimento (Unidades/Potes):
                </label>
                <input
                  type="number"
                  min={1}
                  value={unitsYield}
                  onChange={(e) => setUnitsYield(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F6F2] border border-stone-300 text-stone-800 font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                  Taxa de Gás/Luz/Água (%):
                </label>
                <input
                  type="number"
                  value={overheadPercent}
                  onChange={(e) => setOverheadPercent(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F6F2] border border-stone-300 text-stone-800 font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                  Margem de Lucro Desejada (%):
                </label>
                <input
                  type="number"
                  value={profitMarginPercent}
                  onChange={(e) => setProfitMarginPercent(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F6F2] border border-stone-300 text-stone-800 font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                  Dias de Produção no Mês:
                </label>
                <input
                  type="number"
                  value={daysSoldPerMonth}
                  onChange={(e) => setDaysSoldPerMonth(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F6F2] border border-stone-300 text-stone-800 font-bold text-sm"
                />
              </div>
            </div>
          </div>

          {/* Painel de Resultado do Faça e Venda */}
          <div className="lg:col-span-6 rounded-3xl bg-gradient-to-br from-[#1E7E5A] to-emerald-900 text-white p-6 sm:p-8 shadow-lg space-y-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                Ficha Financeira • {productName}
              </span>
              <h3 className="font-serif-vovo text-3xl font-bold mt-1">
                Preço Sugerido de Venda: R$ {suggestedUnitPrice.toFixed(2).replace('.', ',')} / un.
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                <span className="text-xs text-emerald-100 block">Custo Real por Unidade</span>
                <strong className="text-2xl font-extrabold">
                  R$ {unitCost.toFixed(2).replace('.', ',')}
                </strong>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                <span className="text-xs text-emerald-100 block">Seu Lucro Livre por Unidade</span>
                <strong className="text-2xl font-extrabold text-amber-300">
                  R$ {profitPerUnit.toFixed(2).replace('.', ',')}
                </strong>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                <span className="text-xs text-emerald-100 block">Lucro por Receita ({unitsYield} un.)</span>
                <strong className="text-2xl font-extrabold">
                  R$ {profitPerBatch.toFixed(2).replace('.', ',')}
                </strong>
              </div>
              <div className="p-4 rounded-2xl bg-amber-400 text-stone-950">
                <span className="text-xs font-bold uppercase block">Renda Extra no Mês ({daysSoldPerMonth} dias)</span>
                <strong className="text-2xl font-black">
                  R$ {estimatedMonthlyProfit.toFixed(2).replace('.', ',')}
                </strong>
              </div>
            </div>

            <p className="text-xs text-emerald-100 leading-relaxed">
              <i className="fa-solid fa-lightbulb text-amber-300 mr-1.5" />
              Dica da Vovó: Capriche em uma fitinha de cetim e uma etiqueta com a data de fabricação. Valoriza o produto artesanal e fideliza a vizinhança!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
