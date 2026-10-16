import React, { useEffect, useState } from 'react';
import {
  discoverTudoGostoso,
  fetchSystemInfo,
  importBatchTudoGostosoUrls,
  importSingleTudoGostosoUrl,
} from '../api/client';
import { DiscoveredSuggestion, Recipe, SystemInfo } from '../types';

interface AdminImporterPanelProps {
  onRecipeImported: (recipe?: Recipe) => void;
  highContrastDark?: boolean;
}

export const AdminImporterPanel: React.FC<AdminImporterPanelProps> = ({
  onRecipeImported,
  highContrastDark,
}) => {
  const [singleUrl, setSingleUrl] = useState('');
  const [batchUrlsText, setBatchUrlsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [suggestions, setSuggestions] = useState<DiscoveredSuggestion[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    discoverTudoGostoso()
      .then((list) => setSuggestions(list || []))
      .catch(() => {});
    fetchSystemInfo()
      .then((info) => setSystemInfo(info))
      .catch(() => {});
  }, []);

  const handleImportSingle = async (urlToImport: string) => {
    if (!urlToImport.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const recipe = await importSingleTudoGostosoUrl(urlToImport.trim());
      setFeedback({
        type: 'success',
        message: `Receita "${recipe.title}" importada com sucesso para o Caderno da Vovó!`,
      });
      setSingleUrl('');
      onRecipeImported(recipe);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Não foi possível importar a URL informada.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = batchUrlsText
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http'));

    if (urls.length === 0) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await importBatchTudoGostosoUrls(urls);
      setFeedback({
        type: 'success',
        message: `Importação concluída: ${res.importedCount} receitas salvas no banco!`,
      });
      setBatchUrlsText('');
      onRecipeImported();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erro na importação em lote.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div
        className={`rounded-3xl p-6 sm:p-8 border shadow-sm ${
          highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#C83E5B] flex items-center justify-center text-2xl shadow-sm">
              <i className="fa-solid fa-cloud-arrow-down" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">
                Importador Manual TudoGostoso (Exclusivo Admin)
              </h2>
              <p className="text-sm text-stone-500">
                Importe links específicos ou em lote. Para importação infinita sem parar, use a aba "Robô Auto-Importer" no Painel Admin.
              </p>
            </div>
          </div>

          {systemInfo && (
            <div className="bg-[#F8F6F2] px-4 py-2.5 rounded-2xl border border-stone-200 text-xs font-bold text-stone-700 flex items-center gap-2">
              <i className="fa-solid fa-wifi text-[#1E7E5A]" />
              <span>API Local Mobile: {systemInfo.recommendedMobileApiUrl}</span>
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={`mt-6 p-4 rounded-2xl border font-bold text-sm flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <i
              className={`fa-solid ${
                feedback.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'
              } text-lg`}
            />
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Import Single URL */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleImportSingle(singleUrl);
            }}
            className="bg-[#F8F6F2] p-6 rounded-2xl border border-stone-200 space-y-4 text-stone-800"
          >
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              <i className="fa-solid fa-link text-[#C83E5B]" /> Importar 1 Receita por Link
            </h3>
            <input
              type="url"
              required
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              placeholder="https://www.tudogostoso.com.br/receita/..."
              className="w-full px-4 py-3 rounded-xl bg-white border border-stone-300 text-stone-800 text-sm focus:border-[#C83E5B] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#C83E5B] hover:bg-rose-700 text-white font-bold text-sm shadow transition-all"
            >
              {loading ? 'Extraindo receita...' : 'Importar Receita Agora'}
            </button>
          </form>

          {/* Import Batch URLs */}
          <form
            onSubmit={handleImportBatch}
            className="bg-[#F8F6F2] p-6 rounded-2xl border border-stone-200 space-y-4 text-stone-800"
          >
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-[#1E7E5A]" /> Importação em Lote (Vários Links)
            </h3>
            <textarea
              rows={3}
              value={batchUrlsText}
              onChange={(e) => setBatchUrlsText(e.target.value)}
              placeholder="Cole vários links do TudoGostoso (1 por linha)..."
              className="w-full px-4 py-3 rounded-xl bg-white border border-stone-300 text-stone-800 text-sm focus:border-[#1E7E5A] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#1E7E5A] hover:bg-emerald-800 text-white font-bold text-sm shadow transition-all"
            >
              {loading ? 'Processando lote...' : 'Importar Lote Completo'}
            </button>
          </form>
        </div>

        {/* Quick Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-8 pt-6 border-t border-stone-100">
            <h3 className="text-base font-extrabold mb-3 flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-amber-500" /> Sugestões Rápidas do TudoGostoso (1-Clique)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestions.map((sug) => (
                <div
                  key={sug.url}
                  className="p-3.5 rounded-2xl bg-[#F8F6F2] border border-stone-200 flex items-center justify-between gap-3 text-stone-800"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{sug.title}</p>
                  </div>
                  <button
                    onClick={() => handleImportSingle(sug.url)}
                    disabled={loading}
                    className="shrink-0 px-3 py-2 rounded-xl bg-white hover:bg-[#C83E5B] hover:text-white text-stone-700 border border-stone-200 text-xs font-bold transition-colors"
                  >
                    Importar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
