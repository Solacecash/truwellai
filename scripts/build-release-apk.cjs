'use strict';

/**
 * Local release APK (not EAS). Output: mobile/releases/truwell-<version>-release.apk
 *
 * Usage:
 *   npm run android:release-apk
 *
 * On Windows + OneDrive (or paths with spaces), mirrors the project to
 * %LOCALAPPDATA%\truwell-apk-build first — Gradle/CMake fails on cloud placeholders.
 * Set TRUWELL_BUILD_IN_PLACE=1 to skip mirroring (only if your path is local + no spaces).
 *
 * Optional env:
 *   TRUWELL_APK_ARCHITECTURES=arm64-v8a          (default: arm64-v8a)
 *   TRUWELL_LOCAL_BUILD_ROOT=C:\dev\truwell-build
 *   TRUWELL_RELEASE_STORE_FILE / _STORE_PASSWORD / _KEY_ALIAS / _KEY_PASSWORD
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sourceRoot = path.resolve(__dirname, '..');

/** @type {{ root: string; androidDir: string; releasesDir: string; mirrored: boolean }} */
let ctx = {
  root: sourceRoot,
  androidDir: path.join(sourceRoot, 'android'),
  releasesDir: path.join(sourceRoot, 'releases'),
  mirrored: false,
};

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, {
    stdio: 'inherit',
    cwd: opts.cwd ?? ctx.root,
    env: { ...process.env, ...opts.env },
    shell: true,
  });
}

function defaultGradleUserHome() {
  if (process.env.GRADLE_USER_HOME) return process.env.GRADLE_USER_HOME;
  if (process.platform === 'win32' && needsLocalMirror()) {
    return path.join(process.env.LOCALAPPDATA || 'C:\\Temp', 'truwell-gradle');
  }
  return path.join(process.env.HOME || process.env.USERPROFILE || '', '.gradle');
}

function ensureLocalGradleHome() {
  const gradleHome = defaultGradleUserHome();
  fs.mkdirSync(gradleHome, { recursive: true });
  process.env.GRADLE_USER_HOME = gradleHome;
  console.log('Using GRADLE_USER_HOME ->', gradleHome);
  return gradleHome;
}

function defaultSdkDir() {
  if (process.env.ANDROID_HOME) return process.env.ANDROID_HOME;
  if (process.env.ANDROID_SDK_ROOT) return process.env.ANDROID_SDK_ROOT;
  if (process.platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
  }
  return path.join(process.env.HOME || '', 'Library', 'Android', 'sdk');
}

function needsLocalMirror() {
  if (process.env.TRUWELL_BUILD_IN_PLACE === '1') return false;
  if (process.platform !== 'win32') return false;
  return /OneDrive/i.test(sourceRoot) || /\s/.test(sourceRoot);
}

function syncProjectMirror() {
  const dest =
    process.env.TRUWELL_LOCAL_BUILD_ROOT ||
    (process.platform === 'win32' && /OneDrive/i.test(sourceRoot)
      ? 'C:\\tw-build'
      : path.join(process.env.LOCALAPPDATA || 'C:\\Temp', 'truwell-apk-build'));

  fs.mkdirSync(dest, { recursive: true });

  const excludes = [
    'node_modules',
    'android\\app\\build',
    'android\\build',
    'android\\.gradle',
    'releases',
    '.git',
    '.expo',
    '.gradle',
  ]
    .map((d) => `"${d}"`)
    .join(' ');

  console.log(
    `\n[TruWell] Mirroring project to local disk for native build (OneDrive / spaces workaround):\n  ${dest}\n`,
  );

  const robocopyCmd = `robocopy "${sourceRoot}" "${dest}" /MIR /XD ${excludes} /NFL /NDL /NJH /NJS /nc /ns /np`;
  const rc = spawnSync(robocopyCmd, { shell: true, stdio: 'inherit' });
  const code = rc.status ?? 1;
  if (code >= 8) {
    console.error(`robocopy failed with exit code ${code}`);
    process.exit(code);
  }

  for (const envFile of ['.env', '.env.local']) {
    const src = path.join(sourceRoot, envFile);
    const dst = path.join(dest, envFile);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
    }
  }

  ctx = {
    root: dest,
    androidDir: path.join(dest, 'android'),
    releasesDir: path.join(dest, 'releases'),
    mirrored: true,
  };

  // node_modules is excluded — OneDrive cloud placeholders break native .so snapshotting.
  const nmDir = path.join(dest, 'node_modules');
  if (fs.existsSync(nmDir)) {
    console.log('[TruWell] Removing mirrored node_modules for clean npm ci…');
    try {
      fs.rmSync(nmDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 });
    } catch (e) {
      if (process.platform === 'win32') {
        console.warn('[TruWell] fs.rmSync failed — trying rmdir /s /q…');
        try {
          execSync(`cmd /c rmdir /s /q "${nmDir}"`, { stdio: 'inherit' });
        } catch {
          const staleDir = `${nmDir}.stale-${Date.now()}`;
          console.warn(`[TruWell] rmdir failed — renaming to ${path.basename(staleDir)}…`);
          try {
            fs.renameSync(nmDir, staleDir);
          } catch (renameErr) {
            console.error(
              'Could not remove mirrored node_modules. Stop Gradle in C:\\tw-build\\android (gradlew --stop) and retry.',
            );
            throw renameErr;
          }
        }
      } else {
        throw e;
      }
    }
  }
  console.log('\n[TruWell] Installing dependencies on local disk (npm ci)…\n');
  run('npm ci', { cwd: dest });
}

function writeLocalProperties() {
  const sdkDir = defaultSdkDir();
  if (!fs.existsSync(sdkDir)) {
    console.error(`Android SDK not found at: ${sdkDir}`);
    console.error('Set ANDROID_HOME or install Android SDK.');
    process.exit(1);
  }
  const escaped = sdkDir.replace(/\\/g, '\\\\');
  fs.mkdirSync(ctx.androidDir, { recursive: true });
  fs.writeFileSync(path.join(ctx.androidDir, 'local.properties'), `sdk.dir=${escaped}\n`, 'utf8');
  console.log('Wrote android/local.properties ->', sdkDir);
}

function patchGradleWrapperForWindows() {
  if (process.platform !== 'win32') return;
  const wrapperPath = path.join(ctx.androidDir, 'gradle', 'wrapper', 'gradle-wrapper.properties');
  if (!fs.existsSync(wrapperPath)) return;
  let content = fs.readFileSync(wrapperPath, 'utf8');
  if (content.includes('gradle-8.14.3-bin.zip')) {
    content = content.replace(
      'gradle-8.14.3-bin.zip',
      'gradle-8.13-bin.zip',
    );
    fs.writeFileSync(wrapperPath, content, 'utf8');
    console.log('Patched Gradle wrapper to 8.13 (Windows hardlink workaround).');
  }
}

function patchAndroidBuildGradleForHardlinkFix() {
  if (process.platform !== 'win32') return;
  const buildGradlePath = path.join(ctx.androidDir, 'build.gradle');
  if (!fs.existsSync(buildGradlePath)) return;
  const marker = 'truwell-windows-hardlink-fix-v3';
  let gradle = fs.readFileSync(buildGradlePath, 'utf8');
  if (gradle.includes(marker)) return;

  gradle = gradle.replace(
    /\n\/\/ truwell-windows-hardlink-fix[\s\S]*?subprojects \{ sub ->[\s\S]*?\}\n\}/,
    '',
  );
  gradle = gradle.replace(
    /\n\/\/ truwell-windows-hardlink-fix-v2[\s\S]*?subprojects \{ sub ->[\s\S]*?\}\n\}/,
    '',
  );

  const applyBlock = `
// ${marker} — Windows libc++_shared.so hardlink snapshot workaround
if (System.getProperty('os.name').toLowerCase().contains('windows')) {
  def truwellMobileRoot = rootDir.parentFile
  def truwellExpand = new File(truwellMobileRoot, 'scripts/expand-android-hardlinks.cjs')

  def truwellMaterializeAll = {
    if (!truwellExpand.exists()) return
    exec {
      workingDir truwellMobileRoot
      commandLine 'node', truwellExpand.absolutePath
    }
  }

  def truwellMaterializeModule = { project ->
    if (!truwellExpand.exists()) return
    exec {
      workingDir truwellMobileRoot
      commandLine 'node', truwellExpand.absolutePath, project.projectDir.absolutePath
    }
  }

  def truwellWireNativeTasks = { project ->
    project.tasks.configureEach { task ->
      def n = task.name.toLowerCase()
      def isNativeTask = n.contains('cmake') || n.contains('prefab') ||
        n.contains('externalnative') || n.contains('mergenativelibs') ||
        n.contains('mergereleasenativelibs') || n.contains('mergedebugnativelibs') ||
        n.contains('mergenative')
      if (!isNativeTask) return
      if (task.ext.has('truwellHardlinkWired')) return
      task.ext.truwellHardlinkWired = true
      task.doNotTrackState('TruWell Windows hardlink snapshot workaround')
      if (n.contains('mergenativelibs') || n.contains('mergereleasenativelibs') ||
          n.contains('mergedebugnativelibs') || n.contains('mergenative')) {
        task.doFirst { truwellMaterializeAll() }
      } else {
        task.doFirst { truwellMaterializeModule(project) }
        task.doLast { truwellMaterializeModule(project) }
      }
    }
  }

  subprojects { sub ->
    sub.plugins.withId('com.android.library') { truwellWireNativeTasks(sub) }
    sub.plugins.withId('com.android.application') { truwellWireNativeTasks(sub) }
  }
}
`;

  gradle += applyBlock;
  fs.writeFileSync(buildGradlePath, gradle, 'utf8');
  console.log('Patched android/build.gradle with Windows hardlink fix (v3).');
}

const NINJA_MIN_VERSION = '1.12.0';
const NINJA_RELEASE = 'v1.12.1';

/** @returns {string | null} Directory containing ninja.exe to prepend to PATH */
function ensureModernNinja() {
  if (process.platform !== 'win32') return null;

  const sdkNinja = path.join(defaultSdkDir(), 'cmake', '3.22.1', 'bin', 'ninja.exe');
  let sdkVersion = '';
  if (fs.existsSync(sdkNinja)) {
    try {
      sdkVersion = execSync(`"${sdkNinja}" --version`, { encoding: 'utf8' }).trim();
    } catch {
      /* ignore */
    }
  }

  if (sdkVersion && compareSemver(sdkVersion, NINJA_MIN_VERSION) >= 0) {
    console.log(`Ninja ${sdkVersion} OK (>= ${NINJA_MIN_VERSION}).`);
    return path.dirname(sdkNinja);
  }

  const cacheRoot = path.join(
    process.env.LOCALAPPDATA || 'C:\\Temp',
    'truwell-ndk-tools',
    'ninja-1.12.1',
  );
  const cachedNinja = path.join(cacheRoot, 'ninja.exe');
  if (!fs.existsSync(cachedNinja)) {
    fs.mkdirSync(cacheRoot, { recursive: true });
    const zipPath = path.join(cacheRoot, 'ninja-win.zip');
    const url = `https://github.com/ninja-build/ninja/releases/download/${NINJA_RELEASE}/ninja-win.zip`;
    console.log(
      `Ninja ${sdkVersion || 'missing'} is too old for Windows RN builds — downloading ${NINJA_RELEASE}…`,
    );
    run(`curl.exe -fL "${url}" -o "${zipPath}"`, { cwd: cacheRoot });
    if (!fs.existsSync(zipPath)) {
      console.error('Ninja download failed — zip missing at', zipPath);
      process.exit(1);
    }
    run(
      `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${cacheRoot.replace(/'/g, "''")}' -Force"`,
      { cwd: cacheRoot },
    );
    if (!fs.existsSync(cachedNinja)) {
      console.error('Failed to install modern Ninja to', cacheRoot);
      process.exit(1);
    }
  }

  const cachedVersion = execSync(`"${cachedNinja}" --version`, { encoding: 'utf8' }).trim();
  console.log(`Using cached Ninja ${cachedVersion} from ${cacheRoot}`);

  if (fs.existsSync(sdkNinja) && compareSemver(cachedVersion, NINJA_MIN_VERSION) >= 0) {
    try {
      fs.copyFileSync(cachedNinja, sdkNinja);
      console.log(`Patched Android SDK Ninja at ${sdkNinja}`);
    } catch (e) {
      console.warn('Could not patch SDK Ninja (Gradle may still use PATH):', e.message);
    }
  }

  return cacheRoot;
}

/** @param {string} a @param {string} b @returns {number} */
function compareSemver(a, b) {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

function ensureGradleReleaseFlags() {
  const propsPath = path.join(ctx.androidDir, 'gradle.properties');
  if (!fs.existsSync(propsPath)) return;
  let props = fs.readFileSync(propsPath, 'utf8');
  const additions = [
    ['org.gradle.caching', 'false'],
    ['org.gradle.configuration-cache', 'false'],
    ['org.gradle.parallel', 'false'],
    ['org.gradle.workers.max', '1'],
    ['org.gradle.vfs.watch', 'false'],
  ];
  for (const [key, value] of additions) {
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(props)) props = props.replace(re, `${key}=${value}`);
    else props += `\n${key}=${value}\n`;
  }
  fs.writeFileSync(propsPath, props, 'utf8');
  console.log('Set org.gradle.caching=false for release native build.');
}

function ensureNewArchitectureEnabled() {
  const propsPath = path.join(ctx.androidDir, 'gradle.properties');
  if (!fs.existsSync(propsPath)) return;
  let props = fs.readFileSync(propsPath, 'utf8');
  if (/^newArchEnabled=false/m.test(props)) {
    props = props.replace(/^newArchEnabled=false/m, 'newArchEnabled=true');
    fs.writeFileSync(propsPath, props, 'utf8');
    console.log('Set newArchEnabled=true (required by react-native-reanimated 4).');
  }
}

function readVersionName() {
  try {
    const gradle = fs.readFileSync(path.join(ctx.androidDir, 'app', 'build.gradle'), 'utf8');
    const m = gradle.match(/versionName\s+"([^"]+)"/);
    if (m) return m[1];
  } catch {
    /* ignore */
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(ctx.root, 'package.json'), 'utf8'));
  return pkg.version || '1.0.0';
}

function ensureAndroidProject() {
  if (
    !fs.existsSync(path.join(ctx.androidDir, 'gradlew.bat')) &&
    !fs.existsSync(path.join(ctx.androidDir, 'gradlew'))
  ) {
    console.log('No android/ folder — running expo prebuild…');
    run('npx expo prebuild --platform android --no-install');
  }
}

function patchReleaseSigningIfEnv() {
  const storeFile = process.env.TRUWELL_RELEASE_STORE_FILE;
  if (!storeFile) return;

  const gradlePath = path.join(ctx.androidDir, 'app', 'build.gradle');
  let gradle = fs.readFileSync(gradlePath, 'utf8');
  if (gradle.includes('signingConfigs.release')) return;

  const storePassword = process.env.TRUWELL_RELEASE_STORE_PASSWORD || '';
  const keyAlias = process.env.TRUWELL_RELEASE_KEY_ALIAS || '';
  const keyPassword = process.env.TRUWELL_RELEASE_KEY_PASSWORD || storePassword;

  const block = `
        release {
            if (project.hasProperty('TRUWELL_RELEASE_STORE_FILE')) {
                storeFile file(TRUWELL_RELEASE_STORE_FILE)
                storePassword TRUWELL_RELEASE_STORE_PASSWORD
                keyAlias TRUWELL_RELEASE_KEY_ALIAS
                keyPassword TRUWELL_RELEASE_KEY_PASSWORD
            }
        }`;

  gradle = gradle.replace(
    /signingConfigs \{\s*\n\s*debug \{/,
    `signingConfigs {${block}\n        debug {`,
  );
  gradle = gradle.replace(
    /release \{\s*\n\s*\/\/ Caution!/,
    `release {
            signingConfig signingConfigs.release
            // Caution!`,
  );
  fs.writeFileSync(gradlePath, gradle, 'utf8');

  const propsPath = path.join(ctx.androidDir, 'gradle.properties');
  fs.appendFileSync(
    propsPath,
    [
      '',
      '# Local release signing',
      `TRUWELL_RELEASE_STORE_FILE=${storeFile.replace(/\\/g, '/')}`,
      `TRUWELL_RELEASE_STORE_PASSWORD=${storePassword}`,
      `TRUWELL_RELEASE_KEY_ALIAS=${keyAlias}`,
      `TRUWELL_RELEASE_KEY_PASSWORD=${keyPassword}`,
      '',
    ].join('\n'),
    'utf8',
  );
  console.log('Configured release signing from TRUWELL_RELEASE_* env vars.');
}

function findApk() {
  const apkRoot = path.join(ctx.androidDir, 'app', 'build', 'outputs', 'apk', 'release');
  if (!fs.existsSync(apkRoot)) return null;
  const files = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith('.apk')) files.push(p);
    }
  }
  walk(apkRoot);
  if (!files.length) return null;
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

function findAab() {
  const aabRoot = path.join(ctx.androidDir, 'app', 'build', 'outputs', 'bundle', 'release');
  const candidate = path.join(aabRoot, 'app-release.aab');
  if (fs.existsSync(candidate)) return candidate;
  if (!fs.existsSync(aabRoot)) return null;
  const files = fs
    .readdirSync(aabRoot)
    .filter((n) => n.endsWith('.aab'))
    .map((n) => path.join(aabRoot, n));
  if (!files.length) return null;
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

function gradleInitArgs() {
  if (process.platform !== 'win32') return [];
  const initScript = path.join(ctx.root, 'scripts', 'gradle-windows-hardlink-fix.gradle');
  if (!fs.existsSync(initScript)) return [];
  // Gradle -I path: use forward slashes (works on Windows)
  const initPath = initScript.replace(/\\/g, '/');
  console.log('Applying Windows native build init script:', initPath);
  return ['-I', initPath];
}

function main() {
  if (needsLocalMirror()) {
    syncProjectMirror();
  } else if (/\s/.test(sourceRoot)) {
    console.warn(
      '\n[TruWell] Warning: path contains spaces. Set TRUWELL_BUILD_IN_PLACE=1 only if builds succeed in-place.\n',
    );
  }

  ensureAndroidProject();
  ensureLocalGradleHome();
  writeLocalProperties();
  ensureNewArchitectureEnabled();
  patchGradleWrapperForWindows();
  patchAndroidBuildGradleForHardlinkFix();
  ensureGradleReleaseFlags();
  patchReleaseSigningIfEnv();

  console.log('Cleaning native CMake intermediates (keeps codegen outputs)…');
  run('node ./scripts/android-clean-native.cjs');

  if (process.platform === 'win32') {
    console.log('Pre-materializing any hard-linked .so files before Gradle…');
    run('node ./scripts/expand-android-hardlinks.cjs');
  }

  const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const initArgs = gradleInitArgs();
  // Do not run `gradlew clean` — it removes codegen jni dirs and breaks :app:configureCMake on Windows.

  const archFlag = process.env.TRUWELL_APK_ARCHITECTURES || 'arm64-v8a';
  const artifact = process.env.TRUWELL_ANDROID_ARTIFACT === 'aab' ? 'aab' : 'apk';
  const gradleTask = artifact === 'aab' ? 'bundleRelease' : 'assembleRelease';
  const ninjaDir = ensureModernNinja();
  const gradlePath =
    ninjaDir && process.env.PATH
      ? `${ninjaDir};${process.env.PATH}`
      : ninjaDir
        ? ninjaDir
        : process.env.PATH;
  const result = spawnSync(
    gradlew,
    [...initArgs, gradleTask, '--no-daemon', `-PreactNativeArchitectures=${archFlag}`],
    {
      cwd: ctx.androidDir,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        CMAKE_BUILD_PARALLEL_LEVEL: process.env.CMAKE_BUILD_PARALLEL_LEVEL || '1',
        ...(gradlePath ? { PATH: gradlePath } : {}),
      },
    },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const version = readVersionName();
  if (artifact === 'aab') {
    const aab = findAab();
    if (!aab) {
      console.error('bundleRelease finished but no AAB found under app/build/outputs/bundle/release');
      process.exit(1);
    }
    const outName = `truwell-${version}-release.aab`;
    const destInWork = path.join(ctx.releasesDir, outName);
    fs.mkdirSync(ctx.releasesDir, { recursive: true });
    fs.copyFileSync(aab, destInWork);
    const finalDest = path.join(sourceRoot, 'releases', outName);
    fs.mkdirSync(path.dirname(finalDest), { recursive: true });
    fs.copyFileSync(destInWork, finalDest);
    const stat = fs.statSync(finalDest);
    console.log('\n✓ Release AAB ready for Play Console upload:\n');
    console.log(`  ${finalDest}`);
    console.log(`  ${(stat.size / (1024 * 1024)).toFixed(1)} MB`);
    if (ctx.mirrored) console.log(`\n  (Built from mirror: ${ctx.root})`);
    console.log('');
    return;
  }

  const apk = findApk();
  if (!apk) {
    console.error('assembleRelease finished but no APK found under app/build/outputs/apk/release');
    process.exit(1);
  }

  const outName = `truwell-${version}-release.apk`;
  const destInWork = path.join(ctx.releasesDir, outName);
  fs.mkdirSync(ctx.releasesDir, { recursive: true });
  fs.copyFileSync(apk, destInWork);

  const finalDest = path.join(sourceRoot, 'releases', outName);
  fs.mkdirSync(path.dirname(finalDest), { recursive: true });
  fs.copyFileSync(destInWork, finalDest);

  const stat = fs.statSync(finalDest);
  console.log('\n✓ Release APK ready for sideload testing:\n');
  console.log(`  ${finalDest}`);
  console.log(`  ${(stat.size / (1024 * 1024)).toFixed(1)} MB`);
  if (ctx.mirrored) {
    console.log(`\n  (Built from mirror: ${ctx.root})`);
  }
  console.log('\nInstall on a connected device:');
  console.log(`  adb install -r "${finalDest}"\n`);
}

main();
