import React, { useEffect, useState } from 'react';
import { createNewsPostApi, fetchNewsPostsApi, likeNewsPostApi } from '../api/client';
import { NewsPostItem, UserProfile } from '../types';
import { useVoiceReader } from '../hooks/useVoiceReader';

interface NewsFeedPageProps {
  user: UserProfile | null;
  highContrastDark: boolean;
}

export const NewsFeedPage: React.FC<NewsFeedPageProps> = ({ user, highContrastDark }) => {
  const [posts, setPosts] = useState<NewsPostItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [showPublishForm, setShowPublishForm] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Dicas da Vovó');
  const [newImageUrl, setNewImageUrl] = useState('');

  const { isSpeaking, speakText, stopSpeaking } = useVoiceReader();

  useEffect(() => {
    fetchNewsPostsApi().then(setPosts);
  }, []);

  const handleLike = async (id: string) => {
    const updated = await likeNewsPostApi(id);
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    const created = await createNewsPostApi({
      title: newTitle,
      summary: newSummary || newContent.slice(0, 130),
      content: newContent,
      category: newCategory,
      imageUrl: newImageUrl || undefined,
      readMinutes: 3,
    });
    setPosts((prev) => [created, ...prev]);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setNewImageUrl('');
    setShowPublishForm(false);
  };

  const filteredPosts =
    selectedCategory === 'Todas'
      ? posts
      : posts.filter((p) => p.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho do Jornalzinho da Vovó */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
          highContrastDark
            ? 'bg-stone-900 border-stone-800 text-white'
            : 'bg-gradient-to-r from-emerald-900 via-[#1B4332] to-emerald-800 text-white border-emerald-950'
        }`}
      >
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-200 text-xs font-extrabold uppercase tracking-wider">
            <i className="fa-regular fa-newspaper" />
            <span>Jornalzinho & Feed da Vovó</span>
          </span>
          <h1 className="font-serif-vovo text-3xl sm:text-4xl font-bold">
            Histórias de Cozinha, Dicas de Confeitaria & Bem-Estar
          </h1>
          <p className="text-sm sm:text-base text-emerald-100">
            Matérias curtinhas, truques de família que salvam receitas e dicas de ervas e chás com
            leitura em voz alta.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            type="button"
            onClick={() => setShowPublishForm((v) => !v)}
            className="px-5 py-3 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold text-sm shadow flex items-center gap-2 shrink-0 transition"
          >
            <i className="fa-solid fa-pen-nib text-[#C83E5B]" />
            <span>{showPublishForm ? 'Fechar Editor' : 'Publicar Nova Matéria'}</span>
          </button>
        )}
      </div>

      {/* Formulário Admin para Publicar no Feed */}
      {showPublishForm && user?.role === 'ADMIN' && (
        <form
          onSubmit={handlePublish}
          className="rounded-3xl border border-stone-200 bg-white p-6 shadow-md space-y-4 text-stone-900"
        >
          <h3 className="font-serif-vovo text-xl font-bold text-[#1E1B18] flex items-center gap-2">
            <i className="fa-solid fa-pen-nib text-[#C83E5B]" />
            <span>Publicar Nova Dica ou Notícia no Feed</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título da matéria ou dica..."
              className="sm:col-span-2 px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-bold"
              required
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-bold"
            >
              <option value="Dicas da Vovó">Dicas da Vovó</option>
              <option value="Saúde & Bem-Estar">Saúde & Bem-Estar</option>
              <option value="Novidades">Novidades</option>
              <option value="Histórias de Família">Histórias de Família</option>
            </select>
          </div>
          <input
            type="text"
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            placeholder="Resumo curto que aparece no card..."
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm"
          />
          <textarea
            rows={4}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Texto completo da matéria..."
            className="w-full p-4 rounded-xl border border-stone-300 text-sm"
            required
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#1E7E5A] hover:bg-emerald-800 text-white font-bold text-sm"
          >
            Publicar Agora no Feed
          </button>
        </form>
      )}

      {/* Filtros de Categoria do Feed */}
      <div className="flex flex-wrap gap-2">
        {['Todas', 'Dicas da Vovó', 'Saúde & Bem-Estar', 'Novidades', 'Histórias de Família'].map(
          (cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm border transition ${
                selectedCategory === cat
                  ? 'bg-[#C83E5B] text-white border-[#C83E5B] shadow-sm'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-rose-50'
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      {/* Lista de Artigos do Feed */}
      <div className="space-y-6">
        {filteredPosts.map((post) => {
          const isExpanded = expandedPostId === post.id;
          return (
            <article
              key={post.id}
              className={`rounded-3xl border overflow-hidden shadow-sm transition ${
                highContrastDark
                  ? 'bg-stone-900 border-stone-800 text-stone-100'
                  : 'bg-white border-stone-200/90 text-[#1E1B18]'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-4 h-56 md:h-auto bg-stone-100">
                  <img
                    src={
                      post.imageUrl ||
                      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80'
                    }
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="md:col-span-8 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold mb-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#1E7E5A] border border-emerald-200">
                        {post.category}
                      </span>
                      <span className="text-stone-400">
                        <i className="fa-regular fa-clock mr-1" />
                        Leitura de {post.readMinutes} min • Por {post.authorName}
                      </span>
                    </div>

                    <h2 className="font-serif-vovo text-2xl font-bold mb-2 leading-snug">
                      {post.title}
                    </h2>

                    <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                      {isExpanded ? post.content : post.summary}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPostId(isExpanded ? null : post.id)
                        }
                        className="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-[#1E1B18] hover:bg-stone-800 text-white transition"
                      >
                        {isExpanded ? 'Recolher Texto' : 'Ler Matéria Completa'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (isSpeaking) stopSpeaking();
                          else speakText(`${post.title}. ${post.content}`);
                        }}
                        className="px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm bg-rose-50 hover:bg-rose-100 text-[#C83E5B] border border-rose-200 flex items-center gap-1.5 transition"
                      >
                        <i className="fa-solid fa-volume-high" />
                        <span>Ouvir Dica</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-[#C83E5B] flex items-center gap-1.5 transition"
                    >
                      <i className="fa-solid fa-heart text-[#C83E5B]" />
                      <span>Amei ({post.likesCount})</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
