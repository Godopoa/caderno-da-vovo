import React, { useState } from 'react';
import { updateUserProfileApi } from '../api/client';
import { Recipe, UserProfile } from '../types';
import { SeniorRecipeCard } from '../components/SeniorRecipeCard';

interface UserProfilePageProps {
  user: UserProfile | null;
  favoriteRecipes: Recipe[];
  onUserUpdated: (user: UserProfile) => void;
  onOpenRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onSpeakSummary: (recipe: Recipe) => void;
  onOpenVipModal: () => void;
  highContrastDark: boolean;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  user,
  favoriteRecipes,
  onUserUpdated,
  onOpenRecipe,
  onToggleFavorite,
  onSpeakSummary,
  onOpenVipModal,
  highContrastDark,
}) => {
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(
    user?.bio || 'Apaixonado(a) por receitas caseiras de família!'
  );
  const [specialty, setSpecialty] = useState(
    user?.specialty || 'Bolos Caseiros & Café da Tarde'
  );
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await updateUserProfileApi({
        name,
        bio,
        specialty,
        avatarUrl: avatarUrl || undefined,
        newPassword: newPassword || undefined,
      });
      onUserUpdated(res.user);
      setNewPassword('');
      setStatusMsg(res.message);
    } catch (err: any) {
      setStatusMsg(err?.message || 'Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Cartão Principal do Perfil */}
      <div
        className={`rounded-3xl border overflow-hidden shadow-sm ${
          highContrastDark
            ? 'bg-stone-900 border-stone-800 text-white'
            : 'bg-white border-stone-200 text-[#1E1B18]'
        }`}
      >
        <div className="h-32 bg-gradient-to-r from-[#C83E5B] via-rose-500 to-amber-500 relative" />
        <div className="px-6 sm:px-8 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <img
              src={user.avatarUrl || '/images/logo-vovo.jpg'}
              alt={user.name}
              className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-md bg-white"
            />
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="font-serif-vovo text-2xl sm:text-3xl font-bold">
                  {user.name}
                </h1>
                {user.isVip && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold flex items-center gap-1">
                    <i className="fa-solid fa-crown text-amber-600" />
                    <span>VIP</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-500 font-semibold">
                {user.email} • Especialidade: <strong className="text-[#1E7E5A]">{specialty}</strong>
              </p>
            </div>
          </div>

          {!user.isVip ? (
            <button
              type="button"
              onClick={onOpenVipModal}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-xs sm:text-sm shadow flex items-center gap-2"
            >
              <i className="fa-solid fa-crown" />
              <span>Ativar Meu Clube VIP</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1E7E5A] text-xs font-extrabold flex items-center gap-2">
              <i className="fa-solid fa-circle-check" />
              <span>Assinatura Clube VIP Ativa (Sem Anúncios)</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna Esquerda: Formulário Editar Perfil e Senha */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleSaveProfile}
            className={`rounded-3xl border p-6 shadow-sm space-y-4 ${
              highContrastDark
                ? 'bg-stone-900 border-stone-800 text-white'
                : 'bg-white border-stone-200 text-[#1E1B18]'
            }`}
          >
            <h2 className="font-serif-vovo text-xl font-bold flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
              <i className="fa-solid fa-user-pen text-[#C83E5B]" />
              <span>Editar Meu Perfil & Conta</span>
            </h2>

            {statusMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <i className="fa-solid fa-circle-check text-emerald-600" />
                <span>{statusMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Seu Nome no Caderno:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Qual é a sua especialidade na cozinha?
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ex: Bolos de Aniversário, Pães Caseiros, Massas..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Sobre Você (Bio Culinária):
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 text-stone-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Foto de Perfil (URL opcional):
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs"
              />
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Trocar Senha (deixe em branco para manter a atual):
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha protegida com Scrypt"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[#C83E5B] hover:bg-rose-700 text-white font-bold text-sm shadow transition"
            >
              {saving ? 'Salvando alterações...' : 'Salvar Alterações do Perfil'}
            </button>
          </form>
        </div>

        {/* Coluna Direita: Caderninho Pessoal do Usuário */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif-vovo text-2xl font-bold">
              ❤️ Meu Caderninho Salvo ({favoriteRecipes.length} receitas)
            </h2>
          </div>

          {favoriteRecipes.length === 0 ? (
            <div className="p-8 rounded-3xl border border-stone-200 bg-white text-center text-stone-600">
              <i className="fa-regular fa-heart text-3xl text-[#C83E5B] mb-2 block" />
              <p className="font-bold">Você ainda não favoritou nenhuma receita.</p>
              <p className="text-xs mt-1">
                Clique no coraçãozinho em qualquer receita para guardá-la aqui!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favoriteRecipes.map((r) => (
                <SeniorRecipeCard
                  key={r.id}
                  recipe={r}
                  onOpenRecipe={onOpenRecipe}
                  onToggleFavorite={onToggleFavorite}
                  onSpeakSummary={onSpeakSummary}
                  highContrastDark={highContrastDark}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
