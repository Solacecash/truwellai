'use strict';

/**
 * Local release AAB for Play Store (not EAS).
 * Output: mobile/releases/truwell-<version>-release.aab
 *
 * Requires upload keystore env vars (same as APK script):
 *   TRUWELL_RELEASE_STORE_FILE
 *   TRUWELL_RELEASE_STORE_PASSWORD
 *   TRUWELL_RELEASE_KEY_ALIAS
 *   TRUWELL_RELEASE_KEY_PASSWORD
 *
 * Usage:
 *   npm run android:release-aab
 */

process.env.TRUWELL_ANDROID_ARTIFACT = 'aab';
require('./build-release-apk.cjs');
