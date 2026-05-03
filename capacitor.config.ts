import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.squaredthought.verbatim',
  appName: 'Verbatim',
  webDir: 'www',
  server: {
    url: 'https://verbatim.squaredthought.com',
    cleartext: false,
    allowNavigation: [
      'verbatim.squaredthought.com',
      '*.supabase.co',
      'us.i.posthog.com',
      'us-assets.i.posthog.com',
      'api.groq.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Default',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
