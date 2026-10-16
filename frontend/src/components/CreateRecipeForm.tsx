import React, { useState } from 'react';
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
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div
        className={`rounded-3xl border p-6 sm:p-10 shadow-sm ${
          highContrastDark
            ? 'bg-stone-900 border-stone-800 text-white'
            : 'bg-white border-stone-200/90 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-4 pb-6 mb-6 border-b border-stone-100 dark:border-stone-800">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#C83E5B] flex items-center justify-center text-2xl shrink-0 shadow-2xs">
            <i className="fa-solid fa-feather-pointed" />
          </div>
          <div>
            <h2 className="font-serif-vovo text-2xl sm:text-3xl font-extrabold">
              Anotar Nova Receita no Caderno
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Escreva uma receita especial da sua família. O Estúdio Modo Cozinha com leitura por voz será gerado automaticamente.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-sm flex items-center gap-2.5">
            <i className="fa-solid fa-circle-exclamation text-[#C83E5B]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-2">
              1. Nome da Receita
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Bolo de Milho Cremoso da Tia Maria"
              className="w-full px-4 py-3.5 rounded-2xl bg-[#F8F6F2] border border-stone-200 text-stone-800 text-base font-bold focus:bg-white focus:border-[#C83E5B] focus:outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-2">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-[#F8F6F2] border border-stone-200 text-stone-800 text-sm font-bold focus:bg-white focus:border-[#C83E5B] focus:outline-none transition"
              >
                <option value="Bolos e Tortas">Bolos e Tortas</option>
                <option value="Sopas e Caldos">Sopas e Caldos</option>
                <option value="Massas e Assados">Massas e Assados</option>
                <option value="Doces Caseiros">Doces Caseiros</option>
                <option value="Chás & Saúde">Chás & Saúde</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-2">
                Tempo de Preparo (minutos)
              </label>
              <input
                type="number"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="w-full px-4 py-3.5 rounded-2xl bg-[#F8F6F2] border border-stone-200 text-stone-800 text-sm font-bold focus:bg-white focus:border-[#C83E5B] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-2">
                Rendimento
              </label>
              <input
                type="text"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="Ex: 8 porções"
                className="w-full px-4 py-3.5 rounded-2xl bg-[#F8F6F2] border border-stone-200 text-stone-800 text-sm font-bold focus:bg-white focus:border-[#C83E5B] focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-2">
              2. Lista de Ingredientes (um por linha)
            </label>
            <textarea
              rows={5}
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder={'3 ovos inteiros\n2 xícaras de açúcar\n1 lata de milho verde\n1 colher de sopa de fermento'}
              className="w-full p-4 rounded-2xl bg-[#F8F6F2] border border-stone-200 text-stone-800 text-sm font-semibold focus:bg-white focus:border-[#C83E5B] focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-2">
              3. Modo de Preparo Passo a Passo (um passo por linha)
            </label>
            <textarea
              rows={5}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              placeholder={
                'Bata todos os ingredientes no liquidificador por 3 minutos.\nDespeje em uma forma untada e enfarinhada.\nAsse em forno médio por 40 minutos até dourar.'
              }
              className="w-full p-4 rounded-2xl bg-[#F8F6F2] border border-stone-200 text-stone-800 text-sm font-semibold focus:bg-white focus:border-[#C83E5B] focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-2">
              Foto da Receita (URL opcional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-2xl bg-[#F8F6F2] border border-stone-200 text-stone-800 text-sm focus:bg-white focus:border-[#C83E5B] focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 px-6 rounded-2xl font-extrabold text-base bg-[#1E7E5A] hover:bg-emerald-800 text-white flex items-center justify-center gap-2.5 shadow-md transition active:scale-98"
          >
            <i className="fa-solid fa-circle-check text-lg" />
            <span>{saving ? 'Salvando no Caderno...' : 'Salvar Receita no Caderno'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
