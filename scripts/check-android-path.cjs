'use strict';

/**
 * AGP's generated prefab_command.bat line-wraps long paths; a space in the path
 * (e.g. .../Claude code/...) breaks quoting and fails configureCMake / prefab.
 */

const path = require('path');

const mobileRoot = path.resolve(__dirname, '..');
if (process.env.SKIP_ANDROID_PATH_CHECK === '1') {
  process.exit(0);
}
if (/\s/.test(mobileRoot)) {
  console.error(
    '\n[TruWell] Android native build will fail: the app path contains spaces.\n\n' +
      `  ${mobileRoot}\n\n` +
      'Rename or move the folder so the path has no spaces (for example "Claude code" -> "Claude-code"),\n' +
      'then run again. If you previously saw libc++ snapshot errors on OneDrive, also use\n' +
      '`npm run android:clean-native` or keep the repo on disk outside cloud placeholders.\n'
  );
  process.exit(1);
}
