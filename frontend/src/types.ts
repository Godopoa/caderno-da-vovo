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
  isFavorite: boolean;
  isVipOnly?: boolean;
  viewsCount?: number;
  likesCount?: number;
  rating?: number;
  ingredients: Ingredient[];
  steps: Step[];
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
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
