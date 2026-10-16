import {
  AdminDashboardData,
  AutoImporterStatus,
  CaptchaChallenge,
  CommentItem,
  DiscoveredSuggestion,
  MonetizationConfig,
  NewsPostItem,
  Recipe,
  SystemInfo,
  UserProfile,
} from '../types';

const STORAGE_API_URL_KEY = 'caderno_vovo_api_url';
const STORAGE_RECIPES_CACHE_KEY = 'caderno_vovo_offline_recipes';
const STORAGE_AUTH_TOKEN_KEY = 'caderno_vovo_auth_token';
const STORAGE_AUTH_USER_KEY = 'caderno_vovo_auth_user';

export function getApiBaseUrl(): string {
  const custom = localStorage.getItem(STORAGE_API_URL_KEY);
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:3333`;
}

export function setCustomApiBaseUrl(url: string): void {
  if (!url.trim()) {
    localStorage.removeItem(STORAGE_API_URL_KEY);
  } else {
    localStorage.setItem(STORAGE_API_URL_KEY, url.trim().replace(/\/+$/, ''));
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_AUTH_TOKEN_KEY);
}

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: UserProfile): void {
  localStorage.setItem(STORAGE_AUTH_TOKEN_KEY, token);
  localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(user));
}

export function updateStoredUserOnly(user: UserProfile): void {
  localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem(STORAGE_AUTH_TOKEN_KEY);
  localStorage.removeItem(STORAGE_AUTH_USER_KEY);
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCachedRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECIPES_CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveRecipesToCache(recipes: Recipe[]): void {
  try {
    localStorage.setItem(STORAGE_RECIPES_CACHE_KEY, JSON.stringify(recipes));
  } catch {
    // ignore quota error
  }
}

export async function fetchRecipes(params?: {
  search?: string;
  category?: string;
  favorite?: boolean;
  fridge?: string;
}): Promise<{ recipes: Recipe[]; isOffline: boolean }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.category && params.category !== 'Todas') query.set('category', params.category);
  if (params?.favorite) query.set('favorite', 'true');
  if (params?.fridge) query.set('fridge', params.fridge);

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/recipes?${query.toString()}`);
    if (!res.ok) throw new Error('Falha na API');
    const data = await res.json();
    const list: Recipe[] = data.recipes || [];

    if (!params?.search && (!params?.category || params.category === 'Todas') && !params?.favorite && !params?.fridge) {
      saveRecipesToCache(list);
    }
    return { recipes: list, isOffline: false };
  } catch {
    let cached = getCachedRecipes();
    if (params?.category && params.category !== 'Todas') {
      cached = cached.filter((r) => r.category === params.category);
    }
    if (params?.favorite) {
      cached = cached.filter((r) => r.isFavorite);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      cached = cached.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.rawText.toLowerCase().includes(q))
      );
    }
    if (params?.fridge) {
      const terms = params.fridge
        .toLowerCase()
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      cached = cached.filter((r) =>
        terms.every((t) => r.ingredients.some((i) => i.rawText.toLowerCase().includes(t)))
      );
    }
    return { recipes: cached, isOffline: true };
  }
}

export async function toggleFavoriteRecipe(id: string): Promise<Recipe> {
  const res = await fetch(`${getApiBaseUrl()}/api/recipes/${id}/favorite`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Não foi possível favoritar a receita.');
  const data = await res.json();
  return data.recipe;
}

export async function createManualRecipe(payload: {
  title: string;
  description?: string;
  chefTip?: string;
  category: string;
  prepTimeMinutes: number;
  servings: string;
  imageUrl?: string;
  ingredients: string[];
  steps: string[];
}): Promise<Recipe> {
  const res = await fetch(`${getApiBaseUrl()}/api/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao salvar receita.');
  return data.recipe;
}

export async function deleteRecipeById(id: string): Promise<void> {
  await fetch(`${getApiBaseUrl()}/api/recipes/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
}

export async function importSingleTudoGostosoUrl(url: string): Promise<Recipe> {
  const res = await fetch(`${getApiBaseUrl()}/api/import/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha ao importar link do TudoGostoso.');
  return data.recipe;
}

export async function importBatchTudoGostosoUrls(urls: string[]): Promise<{
  importedCount: number;
  errorCount: number;
  imported: Recipe[];
  errors: { url: string; error: string }[];
}> {
  const res = await fetch(`${getApiBaseUrl()}/api/import/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ urls }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha na importação em lote.');
  return data;
}

export async function discoverTudoGostoso(query?: string): Promise<DiscoveredSuggestion[]> {
  const q = query ? `?q=${encodeURIComponent(query)}` : '';
  const res = await fetch(`${getApiBaseUrl()}/api/import/discover${q}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions || [];
}

export async function fetchSystemInfo(): Promise<SystemInfo | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/system/info`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// --- CAPTCHA PRÓPRIO DA VOVÓ ---
export async function fetchCaptchaChallenge(): Promise<CaptchaChallenge> {
  const res = await fetch(`${getApiBaseUrl()}/api/security/captcha`);
  return await res.json();
}

// --- COMENTÁRIOS E AVALIAÇÕES ---
export async function postRecipeCommentApi(
  recipeId: string,
  payload: {
    authorName?: string;
    rating: number;
    content: string;
    madeIt: boolean;
    captchaToken: string;
    captchaAnswer: string;
  }
): Promise<{ comment: CommentItem; message: string }> {
  const res = await fetch(`${getApiBaseUrl()}/api/recipes/${recipeId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao enviar comentário.');
  return data;
}

// --- FEED DE NOTÍCIAS E DICAS ---
export async function fetchNewsPostsApi(): Promise<NewsPostItem[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/news`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  } catch {
    return [];
  }
}

export async function createNewsPostApi(payload: {
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrl?: string;
  readMinutes?: number;
}): Promise<NewsPostItem> {
  const res = await fetch(`${getApiBaseUrl()}/api/news`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao publicar notícia.');
  return data.post;
}

export async function likeNewsPostApi(id: string): Promise<NewsPostItem> {
  const res = await fetch(`${getApiBaseUrl()}/api/news/${id}/like`, {
    method: 'POST',
  });
  const data = await res.json();
  return data.post;
}

// --- AUTENTICAÇÃO, PERFIL E CLUBE VIP ---
export async function loginApi(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao fazer login.');
  saveAuthSession(data.token, data.user);
  return data;
}

export async function registerApi(payload: {
  name: string;
  email: string;
  password: string;
  wantVip?: boolean;
  vipPlan?: 'MENSAL' | 'ANUAL';
}): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao criar conta.');
  saveAuthSession(data.token, data.user);
  return data;
}

export async function updateUserProfileApi(payload: {
  name: string;
  bio: string;
  specialty: string;
  avatarUrl?: string;
  newPassword?: string;
}): Promise<{ user: UserProfile; message: string }> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao salvar perfil.');
  updateStoredUserOnly(data.user);
  return data;
}

export async function upgradeToVipApi(
  plan: 'MENSAL' | 'ANUAL',
  paymentMethod: string
): Promise<{ token: string; user: UserProfile; message: string }> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/upgrade-vip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ plan, paymentMethod }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao ativar assinatura VIP.');
  saveAuthSession(data.token, data.user);
  return data;
}

// --- MONETIZAÇÃO, ADMIN E ROBÔ AUTO-IMPORTER ---
export async function fetchMonetizationConfig(): Promise<MonetizationConfig | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/monetization/config`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const res = await fetch(`${getApiBaseUrl()}/api/admin/dashboard`, {
    headers: { ...getAuthHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Acesso negado ao Painel Admin.');
  return data;
}

export async function updateMonetizationConfigApi(payload: Partial<MonetizationConfig>): Promise<{ message: string }> {
  const res = await fetch(`${getApiBaseUrl()}/api/admin/monetization`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao salvar configurações.');
  return data;
}

export async function toggleUserVipAdminApi(userId: string): Promise<UserProfile> {
  const res = await fetch(`${getApiBaseUrl()}/api/admin/users/${userId}/toggle-vip`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao alterar status VIP.');
  return data.user;
}

export async function toggleRecipeVipAdminApi(recipeId: string): Promise<Recipe> {
  const res = await fetch(`${getApiBaseUrl()}/api/admin/recipes/${recipeId}/toggle-vip`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao alterar status VIP da receita.');
  return data.recipe;
}

export async function fetchAutoImporterStatusApi(): Promise<AutoImporterStatus> {
  const res = await fetch(`${getApiBaseUrl()}/api/admin/auto-importer/status`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Falha ao consultar status do Auto-Importer.');
  return await res.json();
}

export async function startAutoImporterApi(intervalSeconds?: number): Promise<AutoImporterStatus> {
  const res = await fetch(`${getApiBaseUrl()}/api/admin/auto-importer/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ intervalSeconds }),
  });
  if (!res.ok) throw new Error('Falha ao iniciar Auto-Importer.');
  return await res.json();
}

export async function pauseAutoImporterApi(): Promise<AutoImporterStatus> {
  const res = await fetch(`${getApiBaseUrl()}/api/admin/auto-importer/pause`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Falha ao pausar Auto-Importer.');
  return await res.json();
}
