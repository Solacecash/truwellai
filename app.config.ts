import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * AUTHORITATIVE EXPO CONFIG FOR EAS AND LOCAL BUILDS.
 * EAS merges app.json then applies this file. Store version, plugins, and native
 * settings here take precedence. Keep app.json aligned when possible; see
 * PHASE_20_CONFIGURATION_ALIGNMENT_PLAN.md.
 */

// Plain CommonJS shim for Node config evaluation on EAS and local expo config (avoid .ts transitive require).
const { allowLocalSupabaseFromEnv, sanitizeSupabaseProjectUrl } = require('./lib/supabasePublicUrl.forAppConfig.cjs');

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TruWell AI',
  slug: 'truwell-ai',
  version: '3.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: ['truwell', 'truwellai'],
  userInterfaceStyle: 'automatic',
  // Must stay in sync with app.json. Fabric + some native stacks (MaskedView, Reanimated)
  // have triggered IllegalViewOperationException on certain Android dev builds; disable until stable.
  newArchEnabled: true,
  splash: {
    image: './assets/images/truwell-logo.png',
    resizeMode: 'contain',
    backgroundColor: '#020A14',
    imageWidth: 200,
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.truwell.ai',
    usesAppleSignIn: true,
    buildNumber: '1',
    associatedDomains: ['applinks:truwellai.xyz'],
    infoPlist: {
      NSCameraUsageDescription:
        'TruWell uses your camera to scan product ' +
        'barcodes and photograph ingredient labels ' +
        'for safety analysis.',
      NSPhotoLibraryUsageDescription: 'TruWell AI accesses your photo library to upload product images for ingredient analysis.',
      NSUserNotificationUsageDescription: 'TruWell AI sends you personalized health alerts and safety notifications.',
      NSMicrophoneUsageDescription: 'TruWell AI uses your microphone so you can talk to the health assistant instead of typing.',
      NSFaceIDUsageDescription: 'TruWell AI uses Face ID to sign you in instantly',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.truwell.ai',
    versionCode: 1,
  adaptiveIcon: {
    foregroundImage: './assets/images/adaptive-icon.png',
    backgroundColor: '#020A14',
  },
    permissions: ['CAMERA', 'READ_EXTERNAL_STORAGE', 'READ_MEDIA_IMAGES', 'RECORD_AUDIO', 'USE_BIOMETRIC', 'USE_FINGERPRINT'],
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          { scheme: 'truwellai', host: 'post-verify' },
          { scheme: 'https', host: 'truwellai.xyz', pathPrefix: '/login' },
          { scheme: 'https', host: 'truwellai.xyz', pathPrefix: '/verify' },
          { scheme: 'truwell', host: 'auth' },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    '@react-native-google-signin/google-signin',
    'expo-dev-client',
    'expo-apple-authentication',
    'expo-router',
    [
      'expo-build-properties',
      {
        ios: {
          // ML Kit 8.x and several Expo 54 pods require 15.5+; 16.1 satisfies EAS prebuild checks.
          deploymentTarget: '16.1',
          // GoogleMLKit Swift pods fail pod install without static frameworks on Expo SDK 54.
          useFrameworks: 'static',
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#020A14',
        image: './assets/images/truwell-logo.png',
        imageWidth: 200,
      },
    ],
    'expo-secure-store',
    [
      'expo-camera',
      {
        cameraPermission: 'TruWell AI uses your camera to scan products and ingredients.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#020A14',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'TruWell AI accesses your photo library to upload product images.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'TruWell AI uses your location to find nearby hospitals in emergencies.',
      },
    ],
    [
      'expo-audio',
      {
        microphonePermission: 'TruWell AI uses your microphone so you can speak to the health assistant.',
      },
    ],
    'react-native-adapty',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: sanitizeSupabaseProjectUrl(rawSupabaseUrl, {
      allowLocalInsecure:
        allowLocalSupabaseFromEnv() || process.env.NODE_ENV === 'development',
    }),
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
    eas: {
      projectId: 'c0c8501b-e3e7-4e96-8012-24459ea247c8',
    },
  },
});
