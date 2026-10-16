import React, { useState } from 'react';
import { PlusCircle, CheckCircle2 } from 'lucide-react';
import { createManualRecipe } from '../api/client';
import { Recipe } from '../types';

interface CreateRecipeFormProps {
  onRecipeCreated: (recipe: Recipe) => void;
  highContrastDark: boolean;
}

export const CreateRecipeForm: React.FC<CreateRecipeFormProps> = ({
  onRecipeCreated,
  highContrastDark,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Bolos e Tortas');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(40);
  const [servings, setServings] = useState('6 porções');
  const [imageUrl, setImageUrl] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const ingredients = ingredientsText
      .split(/\r?\n+/)
      .map((i) => i.trim())
      .filter(Boolean);
    const steps = stepsText
      .split(/\r?\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!title.trim() || ingredients.length === 0 || steps.length === 0) {
      setError('Por favor, preencha o nome da receita, os ingredientes e os passos.');
      return;
    }

    setSaving(true);
    try {
      const created = await createManualRecipe({
        title,
        category,
        prepTimeMinutes: Number(prepTimeMinutes) || 35,
        servings,
        imageUrl: imageUrl.trim() || undefined,
        ingredients,
        steps,
      });
      onRecipeCreated(created);
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar a receita.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div
        className={`rounded-3xl border-4 p-6 sm:p-8 shadow-md ${
          highContrastDark
            ? 'bg-stone-900 border-stone-700 text-white'
            : 'bg-white border-stone-300 text-[#1C1917]'
        }`}
      >
        <h2 className="text-3xl font-extrabold flex items-center gap-3 mb-2">
          <PlusCircle className="w-8 h-8 text-[#C2410C]" />
          <span>✍️ Anotar Nova Receita no Caderno</span>
        </h2>
        <p className="text-lg font-semibold opacity-90 mb-6">
          Escreva aqui uma receita especial da sua família. O sistema criará automaticamente o Modo Cozinha com leitura em voz alta!
        </p>

        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-100 border-2 border-rose-600 text-rose-950 font-extrabold text-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xl font-extrabold mb-2">
              1. Qual é o nome da receita?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Bolo de Milho Cremoso da Tia Maria"
              className="w-full min-h-[60px] px-5 py-3 rounded-2xl border-2 border-stone-400 text-stone-900 text-xl font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-lg font-extrabold mb-2">Categoria:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full min-h-[60px] px-4 py-3 rounded-2xl border-2 border-stone-400 text-stone-900 text-lg font-bold"
              >
                <option value="Bolos e Tortas">🍰 Bolos e Tortas</option>
                <option value="Sopas e Caldos">🍲 Sopas e Caldos</option>
                <option value="Almoço de Família">🍛 Almoço de Família</option>
                <option value="Doces Caseiros">🍮 Doces Caseiros</option>
                <option value="Lanches e Pães">🥐 Lanches e Pães</option>
                <option value="Receitas Caseiras">📖 Receitas Caseiras</option>
              </select>
            </div>

            <div>
              <label className="block text-lg font-extrabold mb-2">Tempo (em minutos):</label>
              <input
                type="number"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="w-full min-h-[60px] px-4 py-3 rounded-2xl border-2 border-stone-400 text-stone-900 text-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-lg font-extrabold mb-2">Rendimento:</label>
              <input
                type="text"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="Ex: 8 porções"
                className="w-full min-h-[60px] px-4 py-3 rounded-2xl border-2 border-stone-400 text-stone-900 text-lg font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xl font-extrabold mb-2">
              2. Ingredientes (escreva um por linha):
            </label>
            <textarea
              rows={5}
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder={'3 ovos inteiros\n2 xícaras de açúcar\n1 lata de milho verde\n1 colher de sopa de fermento'}
              className="w-full p-4 rounded-2xl border-2 border-stone-400 text-stone-900 text-xl font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xl font-extrabold mb-2">
              3. Modo de Preparo Passo a Passo (escreva um passo por linha):
            </label>
            <textarea
              rows={5}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              placeholder={
                'Bata todos os ingredientes no liquidificador por 3 minutos.\nDespeje em uma forma untada e enfarinhada.\nAsse em forno médio por 40 minutos até dourar.'
              }
              className="w-full p-4 rounded-2xl border-2 border-stone-400 text-stone-900 text-xl font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-extrabold mb-2">
              Foto da Receita (Link opcional):
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full min-h-[56px] px-4 py-2.5 rounded-2xl border-2 border-stone-400 text-stone-900 text-base font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-[70px] px-6 py-4 rounded-2xl font-extrabold text-2xl bg-[#15803D] hover:bg-[#166534] text-white flex items-center justify-center gap-3 shadow-lg transition active:scale-95"
          >
            <CheckCircle2 className="w-8 h-8" />
            <span>{saving ? 'Salvando no Caderno...' : '✅ Salvar Receita no Caderno'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
