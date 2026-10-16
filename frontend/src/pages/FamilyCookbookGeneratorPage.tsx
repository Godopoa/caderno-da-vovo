import React, { useState } from 'react';
import { Recipe, UserProfile } from '../types';

interface FamilyCookbookGeneratorPageProps {
  recipes: Recipe[];
  user: UserProfile | null;
  highContrastDark: boolean;
}

export const FamilyCookbookGeneratorPage: React.FC<FamilyCookbookGeneratorPageProps> = ({
  recipes,
  user,
  highContrastDark,
}) => {
  const [bookTitle, setBookTitle] = useState('O Livro de Ouro de Receitas da Nossa Família');
  const [authorName, setAuthorName] = useState(user?.name || 'Vovó Helena');
  const [dedication, setDedication] = useState(
    'Para meus filhos e netos queridos: que o cheirinho de bolo assando e o tempero da nossa família continuem aquecendo o coração de vocês por muitas gerações. Com todo o meu amor!'
  );
  const [coverTheme, setCoverTheme] = useState<'berry' | 'sage' | 'gold'>('berry');
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>(() =>
    recipes.slice(0, 5).map((r) => r.id)
  );

  const toggleRecipeInBook = (id: string) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedBookRecipes = recipes.filter((r) => selectedRecipeIds.includes(r.id));

  const coverColors =
    coverTheme === 'berry'
      ? 'from-[#C83E5B] via-rose-700 to-rose-900 border-rose-300'
      : coverTheme === 'sage'
      ? 'from-[#1E7E5A] via-emerald-800 to-teal-950 border-emerald-300'
      : 'from-amber-600 via-amber-700 to-stone-900 border-amber-300';

  return (
    <div className="space-y-8">
      {/* Painel de Configuração do Livro (Oculto na hora de imprimir o PDF!) */}
      <div
        className={`no-print rounded-3xl border p-6 sm:p-8 shadow-sm space-y-6 ${
          highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold uppercase">
              <i className="fa-solid fa-book-bookmark text-amber-600" />
              <span>Memórias de Família • Exportação em PDF</span>
            </span>
            <h1 className="font-serif-vovo text-3xl font-extrabold">
              Gerador de Livro de Receitas da Família
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              Personalize a capa, escreva uma dedicatória emocionante para seus filhos e netos e gere um livro diagramado pronto para salvar em PDF ou imprimir!
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-6 py-4 rounded-2xl bg-gradient-to-r from-[#C83E5B] to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold text-sm shadow-lg flex items-center gap-2.5 shrink-0 transition transform active:scale-95"
          >
            <i className="fa-solid fa-file-pdf text-lg" />
            <span>Imprimir / Salvar Livro em PDF ({selectedBookRecipes.length} receitas)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                Título Oficial do Livro:
              </label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F8F6F2] border border-stone-300 text-stone-800 font-bold text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                  Nome da Autora / Vovó:
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F6F2] border border-stone-300 text-stone-800 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                  Cor da Capa Clássica:
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'berry', label: 'Framboesa' },
                    { id: 'sage', label: 'Verde Sálvia' },
                    { id: 'gold', label: 'Dourado Real' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCoverTheme(c.id as any)}
                      className={`flex-1 py-2 rounded-xl text-xs font-extrabold border transition ${
                        coverTheme === c.id
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-[#F8F6F2] text-stone-700 border-stone-300'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1">
                Dedicatória Afetiva para a Família:
              </label>
              <textarea
                rows={3}
                value={dedication}
                onChange={(e) => setDedication(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-[#F8F6F2] border border-stone-300 text-stone-800 text-sm font-medium"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase text-stone-500">
                Escolha quais receitas entram no livro ({selectedBookRecipes.length} selecionadas):
              </label>
              <button
                type="button"
                onClick={() => setSelectedRecipeIds(recipes.map((r) => r.id))}
                className="text-xs font-bold text-[#C83E5B] hover:underline"
              >
                Selecionar Todas
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {recipes.map((r) => {
                const checked = selectedRecipeIds.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRecipeInBook(r.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2.5 transition ${
                      checked
                        ? 'bg-emerald-50 border-[#1E7E5A] text-[#1E7E5A]'
                        : 'bg-[#F8F6F2] border-stone-200 text-stone-600'
                    }`}
                  >
                    <i className={`fa-solid ${checked ? 'fa-square-check' : 'fa-regular fa-square'}`} />
                    <span className="truncate">{r.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* PRÉVIA EDITORIAL DO LIVRO (TAMBÉM É O QUE SAI IMPRESSO NO PDF!) */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* CAPA DO LIVRO DE FAMÍLIA */}
        <div
          className={`rounded-[2.5rem] border-4 bg-gradient-to-br ${coverColors} text-white p-10 sm:p-16 text-center shadow-2xl space-y-6 relative overflow-hidden`}
        >
          <div className="w-24 h-24 rounded-full border-4 border-white/80 mx-auto overflow-hidden shadow-lg">
            <img
              src="/images/logo-vovo.jpg"
              alt={authorName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-amber-200 block">
              Edição Especial de Família • Caderno da Vovó
            </span>
            <h2 className="font-serif-vovo text-3xl sm:text-5xl font-bold leading-tight">
              {bookTitle}
            </h2>
            <p className="text-sm sm:text-lg text-white/90 font-semibold">
              Organizado com carinho por <strong>{authorName}</strong>
            </p>
          </div>

          <div className="max-w-xl mx-auto p-6 rounded-3xl bg-black/20 backdrop-blur-xs border border-white/20 italic text-sm sm:text-base leading-relaxed">
            “{dedication}”
          </div>
        </div>

        {/* PÁGINAS DE RECEITAS DO LIVRO */}
        <div className="space-y-6">
          {selectedBookRecipes.map((rec, idx) => (
            <div
              key={rec.id}
              className="rounded-3xl border-2 border-stone-200 bg-white text-stone-900 p-8 shadow-sm space-y-5"
            >
              <div className="flex items-center justify-between border-b-2 border-stone-100 pb-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#C83E5B]">
                    Receita Nº {idx + 1} • {rec.category}
                  </span>
                  <h3 className="font-serif-vovo text-2xl sm:text-3xl font-bold mt-0.5">
                    {rec.title}
                  </h3>
                </div>
                <div className="text-right text-xs font-bold text-stone-500">
                  <p>Preparo: {rec.prepTimeMinutes || 35} min</p>
                  <p>Rende: {rec.servings || '6 porções'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#1E7E5A] mb-2">
                    Ingredientes:
                  </h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm">
                    {rec.ingredients.map((ing) => (
                      <li key={ing.id} className="flex items-start gap-2">
                        <span className="text-[#C83E5B] font-bold">•</span>
                        <span>{ing.rawText}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-7">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#C83E5B] mb-2">
                    Modo de Preparo da Família:
                  </h4>
                  <ol className="space-y-2 text-xs sm:text-sm">
                    {rec.steps.map((st, sIdx) => (
                      <li key={st.id} className="leading-relaxed">
                        <strong>{sIdx + 1}.</strong> {st.instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
