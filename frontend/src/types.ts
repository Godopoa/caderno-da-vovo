export interface Ingredient {
  id: string;
  recipeId?: string;
  section: string;
  rawText: string;
  orderIndex: number;
}

export interface Step {
  id: string;
  recipeId?: string;
  section: string;
  stepNumber: number;
  instruction: string;
  timerSeconds?: number | null;
}

export interface CommentItem {
  id: string;
  recipeId: string;
  userId?: string | null;
  authorName: string;
  authorAvatar?: string | null;
  authorIsVip: boolean;
  rating: number;
  content: string;
  madeIt: boolean;
  likesCount: number;
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  chefTip?: string | null;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  category: string;
  prepTimeMinutes?: number | null;
  servings?: string | null;
  difficulty: string;
  caloriesPerServ?: number | null;
  isFavorite: boolean;
  isVipOnly?: boolean;
  viewsCount?: number;
  likesCount?: number;
  rating?: number;
  ingredients: Ingredient[];
  steps: Step[];
  comments?: CommentItem[];
  createdAt?: string;
}

export interface NewsPostItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  imageUrl?: string | null;
  authorName: string;
  readMinutes: number;
  likesCount: number;
  createdAt: string;
}

export interface CaptchaChallenge {
  svgDataUri: string;
  promptText: string;
  captchaToken: string;
}

export interface AutoImporterLog {
  id: string;
  timestamp: string;
  type: 'IMPORTED' | 'SKIPPED' | 'CRAWLED' | 'INFO' | 'ERROR';
  title?: string;
  url?: string;
  message: string;
}

export interface AutoImporterStatus {
  isRunning: boolean;
  intervalSeconds: number;
  queueSize: number;
  visitedCount: number;
  totalImportedInSession: number;
  totalSkippedDuplicates: number;
  currentAction: string;
  recentLogs: AutoImporterLog[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  specialty?: string | null;
  avatarUrl?: string | null;
  role: 'USER' | 'VIP' | 'ADMIN';
  isVip: boolean;
  vipPlan?: string | null;
  vipExpiresAt?: string | null;
}

export interface MonetizationConfig {
  siteName: string;
  adsenseEnabled: boolean;
  adsenseClientId: string;
  adsenseHeaderSlot: string;
  adsenseInFeedSlot: string;
  adsenseRecipeSlot: string;
  vipMonthlyPrice: number;
  vipAnnualPrice: number;
  pixKey: string;
}

export interface AdminDashboardData {
  kpis: {
    totalRecipes: number;
    vipRecipesCount: number;
    importedRecipesCount: number;
    totalUsers: number;
    vipUsersCount: number;
    totalViews: number;
    totalLikes: number;
    estimatedVipMrr: number;
    estimatedAdsenseRevenue: number;
    totalEstimatedMonthlyRevenue: number;
  };
  security: {
    passwordAlgorithm: string;
    tokenAlgorithm: string;
    storageEncryption: string;
  };
  users: UserProfile[];
  auditLogs: {
    id: string;
    action: string;
    actor: string;
    ipAddress?: string;
    details?: string;
    createdAt: string;
  }[];
}

export interface DiscoveredSuggestion {
  title: string;
  url: string;
  imageUrl?: string;
}

export interface SystemInfo {
  status: string;
  port: number;
  lanIps: string[];
  recommendedMobileApiUrl: string;
  stats: {
    totalRecipes: number;
    favoriteRecipes: number;
  };
}
