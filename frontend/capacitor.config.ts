import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cadernodavovo.receitas',
  appName: 'Caderno da Vovó',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'http',
  },
};

export default config;
