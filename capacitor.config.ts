import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.sch.gopkl',
  appName: 'Go-PKL',
  webDir: 'dist',
  /* Navy = warna splash native & splash React, supaya tidak ada kedipan
     putih di antara splash native dan frame pertama WebView. */
  backgroundColor: '#152A42',
  server: {
    androidScheme: 'https',
  },
};

export default config;