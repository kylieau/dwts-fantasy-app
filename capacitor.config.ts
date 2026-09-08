import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kylieau.dwtsfantasy',
  appName: 'Mirrorball Madness',
  webDir: 'public',
  server: {
    url: 'https://dwts-fantasy-app-six.vercel.app',
    // Supabase auth redirects (OAuth, magic links) can briefly navigate
    // the WebView to the Supabase project domain before bouncing back.
    allowNavigation: ['wssbwgtsejamlbvfofvu.supabase.co']
  }
};

export default config;
