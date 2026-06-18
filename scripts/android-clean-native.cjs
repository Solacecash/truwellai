'use strict';

/**
 * Removes Android/CMake intermediates under android/ and native libs in node_modules.
 * Use before release builds if Gradle fails with:
 * "Cannot snapshot ... libc++_shared.so: not a regular file" (Windows hard links / OneDrive).
 */

const fs = require('fs');
const path = require('path');

const mobileRoot = path.join(__dirname, '..');

/** @param {string} absolutePath */
function rmRf(absolutePath) {
  try {
    fs.rmSync(absolutePath, { recursive: true, force: true });
    console.log('removed:', path.relative(mobileRoot, absolutePath));
  } catch (e) {
    if (/** @type {NodeJS.ErrnoException} */ (e).code !== 'ENOENT') {
      console.warn('skip:', path.relative(mobileRoot, absolutePath), e.message);
    }
  }
}

/** @param {string} dir @param {string} name */
function rmNamedChildDirs(dir, name) {
  if (!fs.existsSync(dir)) return;
  /** @param {string} root @param {number} depth */
  function walk(root, depth) {
    if (depth > 6) return;
    let entries;
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const p = path.join(root, ent.name);
      if (ent.name === name) {
        rmRf(p);
        continue;
      }
      if (ent.name === '.git') continue;
      walk(p, depth + 1);
    }
  }
  walk(dir, 0);
}

/** @param {string} nmRel from node_modules/, use forward slashes */
function underNode(nmRel) {
  return path.join(mobileRoot, 'node_modules', ...nmRel.split('/'));
}

// Remove every node_modules package android/build folder (breaks stale Windows hard links).
function cleanAllNodeModuleAndroidBuilds() {
  const nmRoot = path.join(mobileRoot, 'node_modules');
  if (!fs.existsSync(nmRoot)) return;

  /** @param {string} dir */
  function walk(dir, depth) {
    if (depth > 4) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const p = path.join(dir, ent.name);
      if (ent.name === 'android' && fs.existsSync(path.join(p, 'build'))) {
        rmRf(path.join(p, 'build'));
      }
      if (ent.name === 'android' && fs.existsSync(path.join(p, '.cxx'))) {
        rmRf(path.join(p, '.cxx'));
      }
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
      walk(p, depth + 1);
    }
  }
  walk(nmRoot, 0);
}

[
  path.join(mobileRoot, 'android', 'build'),
  path.join(mobileRoot, 'android', 'app', 'build'),
  path.join(mobileRoot, 'android', '.gradle'),
  underNode('react-native-screens/android/build'),
  underNode('react-native-worklets/android/build'),
  underNode('expo-modules-core/android/build'),
  underNode('react-native-reanimated/android/build'),
].forEach(rmRf);

cleanAllNodeModuleAndroidBuilds();
rmNamedChildDirs(path.join(mobileRoot, 'android'), '.cxx');
rmNamedChildDirs(path.join(mobileRoot, 'node_modules'), '.cxx');
