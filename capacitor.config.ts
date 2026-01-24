import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'college.central_02',
  appName: 'College Central',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com',
      '*.firebaseapp.com'
    ]
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '659896441461-fe0921ravutsrl1hm5lj2mpdosthlvir.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
