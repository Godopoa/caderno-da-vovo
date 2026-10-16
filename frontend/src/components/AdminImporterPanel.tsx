import React, { useEffect, useState } from 'react';
import {
  DownloadCloud,
  Search,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Wifi,
  Sparkles,
  Loader2,
  Link2,
} from 'lucide-react';
import {
  discoverTudoGostoso,
  fetchSystemInfo,
  getApiBaseUrl,
  importBatchTudoGostosoUrls,
  importSingleTudoGostosoUrl,
  setCustomApiBaseUrl,
} from '../api/client';
import { DiscoveredSuggestion, Recipe, SystemInfo } from '../types';

interface AdminImporterPanelProps {
  onRecipeImported: (recipe?: Recipe) => void;
  highContrastDark: boolean;
}

export const AdminImporterPanel: React.FC<AdminImporterPanelProps> = ({
  onRecipeImported,
  highContrastDark,
}) => {
  const [singleUrl, setSingleUrl] = useState('');
  const [batchUrlsText, setBatchUrlsText] = useState('');
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [suggestions, setSuggestions] = useState<DiscoveredSuggestion[]>([]);
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [importingUrl, setImportingUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseUrl());

  useEffect(() => {
    discoverTudoGostoso().then(setSuggestions);
    fetchSystemInfo().then(setSystemInfo);
  }, []);

  const handleImportSingle = async (urlToImport: string) => {
    if (!urlToImport.trim()) return;
    setLoadingSingle(true);
    setImportingUrl(urlToImport);
    setStatusMessage(null);
    try {
      const recipe = await importSingleTudoGostosoUrl(urlToImport);
      setStatusMessage({
        type: 'success',
        text: `✅ Receita "${recipe.title}" importada com sucesso do TudoGostoso! (${recipe.ingredients.length} ingredientes e ${recipe.steps.length} passos preparados para voz).`,
      });
      setSingleUrl('');
      onRecipeImported(recipe);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Não foi possível importar esta URL.',
      });
    } finally {
      setLoadingSingle(false);
      setImportingUrl(null);
    }
  };

  const handleImportBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = batchUrlsText
      .split(/\r?\n+/)
      .map((u) => u.trim())
      .filter((u) => u.includes('tudogostoso.com.br'));

    if (urls.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Cole pelo menos um link válido de tudogostoso.com.br (um por linha).',
      });
      return;
    }

    setLoadingBatch(true);
    setStatusMessage(null);
    try {
      const result = await importBatchTudoGostosoUrls(urls);
      setStatusMessage({
        type: 'success',
        text: `🎉 Importação em lote concluída! ${result.importedCount} receita(s) importada(s) com sucesso.`,
      });
      setBatchUrlsText('');
      onRecipeImported();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Erro ao importar lote de receitas.',
      });
    } finally {
      setLoadingBatch(false);
    }
  };

  const handleSearchTudoGostoso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingDiscover(true);
    try {
      const list = await discoverTudoGostoso(discoverQuery);
      setSuggestions(list);
    } finally {
      setLoadingDiscover(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Cabeçalho da Parceria TudoGostoso */}
      <div
        className={`rounded-3xl border-4 p-6 sm:p-8 shadow-md ${
          highContrastDark
            ? 'bg-stone-900 border-amber-400 text-white'
            : 'bg-white border-stone-300 text-[#1C1917]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <span className="px-4 py-1.5 rounded-full bg-amber-600 text-white font-extrabold text-base">
            🤝 PARCERIA OFICIAL TUDOGOSTOSO.COM.BR
          </span>
        </div>
        <h2 className="text-3xl font-extrabold mb-2">
          🌐 Central de Importação de Receitas & Conexão Celular
        </h2>
        <p className="text-xl font-semibold opacity-90">
          Puxe qualquer receita do TudoGostoso em 1 clique. O sistema limpa o texto automaticamente,
          expande abreviações para a leitura em voz alta e cria os relógios de forno/fogo para os idosos!
        </p>

        {statusMessage && (
          <div
            className={`mt-6 p-5 rounded-2xl border-4 flex items-center gap-4 text-xl font-extrabold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-100 border-emerald-700 text-emerald-950'
                : 'bg-rose-100 border-rose-700 text-rose-950'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-8 h-8 text-rose-700 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Seção 1: Descobrir e Importar em 1 Clique do TudoGostoso */}
      <section
        className={`rounded-3xl border-4 p-6 sm:p-8 shadow-md ${
          highContrastDark
            ? 'bg-stone-900 border-stone-700 text-white'
            : 'bg-white border-stone-300 text-[#1C1917]'
        }`}
      >
        <h3 className="text-2xl font-extrabold flex items-center gap-3 mb-2">
          <Sparkles className="w-7 h-7 text-[#C2410C]" />
          <span>1. Buscar e Puxar Direto do TudoGostoso (1 Clique)</span>
        </h3>
        <p className="text-lg font-semibold opacity-85 mb-5">
          Pesquise o prato desejado ou clique em uma das sugestões abaixo para importar na hora:
        </p>

        <form onSubmit={handleSearchTudoGostoso} className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={discoverQuery}
            onChange={(e) => setDiscoverQuery(e.target.value)}
            placeholder="Ex: bolo de fubá, sopa de legumes, frango assado..."
            className="flex-1 min-h-[62px] px-5 py-3 rounded-2xl border-2 border-stone-400 text-stone-900 text-xl font-bold"
          />
          <button
            type="submit"
            disabled={loadingDiscover}
            className="min-h-[62px] px-6 py-3 rounded-2xl font-extrabold text-xl bg-[#C2410C] hover:bg-[#9A3412] text-white flex items-center justify-center gap-2 shrink-0"
          >
            {loadingDiscover ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <Search className="w-7 h-7" />
            )}
            <span>Buscar no TudoGostoso</span>
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((item) => {
            const isBusy = importingUrl === item.url;
            return (
              <div
                key={item.url}
                className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  highContrastDark
                    ? 'bg-stone-950 border-stone-700'
                    : 'bg-[#FAF5EB] border-stone-300'
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-xl">{item.title}</h4>
                  <p className="text-sm opacity-75 truncate max-w-xs sm:max-w-sm">{item.url}</p>
                </div>

                <button
                  type="button"
                  disabled={loadingSingle}
                  onClick={() => handleImportSingle(item.url)}
                  className="min-h-[54px] px-5 py-2.5 rounded-xl font-extrabold text-base bg-[#15803D] hover:bg-[#166534] text-white flex items-center gap-2 shrink-0 shadow"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Importando...</span>
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-5 h-5" />
                      <span>📥 Puxar Receita</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Seção 2: Importar por Link Único ou Lote de Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section
          className={`rounded-3xl border-4 p-6 sm:p-8 shadow-md ${
            highContrastDark
              ? 'bg-stone-900 border-stone-700 text-white'
              : 'bg-white border-stone-300 text-[#1C1917]'
          }`}
        >
          <h3 className="text-2xl font-extrabold flex items-center gap-2 mb-3">
            <Link2 className="w-7 h-7 text-[#15803D]" />
            <span>2. Importar por Link (URL)</span>
          </h3>
          <p className="text-base font-semibold opacity-85 mb-4">
            Cole o endereço de qualquer receita do site <strong>tudogostoso.com.br</strong>:
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleImportSingle(singleUrl);
            }}
            className="space-y-4"
          >
            <input
              type="url"
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              placeholder="https://www.tudogostoso.com.br/receita/..."
              className="w-full min-h-[60px] px-4 py-3 rounded-2xl border-2 border-stone-400 text-stone-900 text-lg font-bold"
              required
            />
            <button
              type="submit"
              disabled={loadingSingle}
              className="w-full min-h-[64px] px-6 py-3 rounded-2xl font-extrabold text-xl bg-[#15803D] hover:bg-[#166534] text-white flex items-center justify-center gap-3 shadow"
            >
              {loadingSingle ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span>Extraindo Ingredientes e Passos...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-7 h-7" />
                  <span>Importar Receita Agora</span>
                </>
              )}
            </button>
          </form>
        </section>

        <section
          className={`rounded-3xl border-4 p-6 sm:p-8 shadow-md ${
            highContrastDark
              ? 'bg-stone-900 border-stone-700 text-white'
              : 'bg-white border-stone-300 text-[#1C1917]'
          }`}
        >
          <h3 className="text-2xl font-extrabold flex items-center gap-2 mb-3">
            <DownloadCloud className="w-7 h-7 text-[#C2410C]" />
            <span>3. Importar Várias de Uma Vez (Em Lote)</span>
          </h3>
          <p className="text-base font-semibold opacity-85 mb-4">
            Cole várias URLs do TudoGostoso (uma por linha) para abastecer o caderno inteiro:
          </p>

          <form onSubmit={handleImportBatch} className="space-y-4">
            <textarea
              rows={4}
              value={batchUrlsText}
              onChange={(e) => setBatchUrlsText(e.target.value)}
              placeholder={
                'https://www.tudogostoso.com.br/receita/23-bolo-de-cenoura.html\nhttps://www.tudogostoso.com.br/receita/31593-pudim-de-leite-condensado.html'
              }
              className="w-full p-4 rounded-2xl border-2 border-stone-400 text-stone-900 text-base font-bold"
            />
            <button
              type="submit"
              disabled={loadingBatch}
              className="w-full min-h-[64px] px-6 py-3 rounded-2xl font-extrabold text-xl bg-[#C2410C] hover:bg-[#9A3412] text-white flex items-center justify-center gap-3 shadow"
            >
              {loadingBatch ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span>Importando Lote...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-7 h-7" />
                  <span>Importar Todas as URLs</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>

      {/* Seção 4: Conexão com o Aplicativo do Celular (Capacitor / Rede Wi-Fi) */}
      <section
        className={`rounded-3xl border-4 p-6 sm:p-8 shadow-md ${
          highContrastDark
            ? 'bg-stone-900 border-stone-700 text-white'
            : 'bg-white border-stone-300 text-[#1C1917]'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <Smartphone className="w-8 h-8 text-[#15803D]" />
          <h3 className="text-2xl font-extrabold">
            📱 4. Conexão com o Celular (Site Mobile & App Android/iOS)
          </h3>
        </div>

        <p className="text-lg font-semibold opacity-90 mb-4">
          Este painel roda no seu PC e também sincroniza em tempo real com o celular na mesma rede Wi-Fi:
        </p>

        {systemInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-5 rounded-2xl bg-emerald-50 text-stone-900 border-2 border-emerald-600">
              <div className="flex items-center gap-2 font-extrabold text-lg text-emerald-900 mb-1">
                <Wifi className="w-6 h-6" />
                <span>Endereço da API na sua Rede Wi-Fi:</span>
              </div>
              <p className="text-2xl font-black font-mono">
                {systemInfo.recommendedMobileApiUrl}
              </p>
              <p className="text-sm font-bold mt-1 opacity-80">
                Para abrir direto no navegador do celular no Wi-Fi, acesse a porta 5173 deste mesmo IP!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 text-stone-900 border-2 border-amber-600">
              <p className="font-extrabold text-lg text-amber-900 mb-1">
                📦 Gerar Aplicativo Android (Capacitor APK):
              </p>
              <code className="block text-sm font-mono bg-stone-900 text-amber-300 p-3 rounded-xl">
                cd frontend && npm run mobile:sync && npm run mobile:open
              </code>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="font-extrabold text-lg shrink-0">
            Endereço do Servidor API conectado:
          </label>
          <input
            type="text"
            value={apiUrlInput}
            onChange={(e) => setApiUrlInput(e.target.value)}
            className="flex-1 min-h-[56px] px-4 py-2 rounded-2xl border-2 border-stone-400 text-stone-900 font-bold text-lg"
          />
          <button
            type="button"
            onClick={() => {
              setCustomApiBaseUrl(apiUrlInput);
              setStatusMessage({
                type: 'success',
                text: `Endereço da API salvo como: ${getApiBaseUrl()}`,
              });
            }}
            className="min-h-[56px] px-6 py-2.5 rounded-2xl font-extrabold text-lg bg-stone-800 hover:bg-stone-700 text-white"
          >
            Salvar Servidor
          </button>
        </div>
      </section>
    </div>
  );
};
