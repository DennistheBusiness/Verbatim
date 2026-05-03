import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.squaredthought.verbatim',
  appName: 'Verbatim',
  webDir: 'www',
  server: {
    url: 'https://app.verbatim.so',
    cleartext: false,
    allowNavigation: [
      'app.verbatim.so',
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
