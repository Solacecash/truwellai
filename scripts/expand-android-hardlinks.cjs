'use strict';

/**
 * Materialize hard-linked .so files as regular files (Windows Gradle snapshot fix).
 * Usage: node scripts/expand-android-hardlinks.cjs [androidModuleDir]
 */

const fs = require('fs');
const path = require('path');

const mobileRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

function materializeSo(filePath) {
  const tmp = `${filePath}.truwell.${process.pid}.tmp`;
  try {
    fs.copyFileSync(filePath, tmp);
    fs.rmSync(filePath, { force: true });
    fs.copyFileSync(tmp, filePath);
    fs.rmSync(tmp, { force: true });
    return true;
  } catch {
    try {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { force: true });
    } catch {
      /* ignore */
    }
    return false;
  }
}

function walkBuildTree(dir, stats) {
  if (!fs.existsSync(dir)) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkBuildTree(p, stats);
    } else if (ent.isFile() && ent.name.endsWith('.so')) {
      if (materializeSo(p)) stats.files += 1;
    }
  }
}

function pushIfExists(list, dir) {
  if (fs.existsSync(dir)) list.push(dir);
}

function targetsFromRoot(root) {
  const list = [];
  pushIfExists(list, path.join(root, 'android', 'app', 'build'));
  pushIfExists(list, path.join(root, 'android', 'app', '.cxx'));

  const nm = path.join(root, 'node_modules');
  if (!fs.existsSync(nm)) return list;

  for (const ent of fs.readdirSync(nm, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const androidDir = path.join(nm, ent.name, 'android');
    pushIfExists(list, path.join(androidDir, 'build'));
    pushIfExists(list, path.join(androidDir, '.cxx'));
    if (ent.name.startsWith('@')) {
      const scopeDir = path.join(nm, ent.name);
      for (const sub of fs.readdirSync(scopeDir, { withFileTypes: true })) {
        if (!sub.isDirectory()) continue;
        const scopedAndroid = path.join(scopeDir, sub.name, 'android');
        pushIfExists(list, path.join(scopedAndroid, 'build'));
        pushIfExists(list, path.join(scopedAndroid, '.cxx'));
      }
    }
  }
  return list;
}

const stats = { files: 0 };
const argPath = process.argv[2] ? path.resolve(process.argv[2]) : null;

if (argPath) {
  const base = path.basename(argPath);
  if (base === 'build' || base === '.cxx') {
    walkBuildTree(argPath, stats);
  } else {
    walkBuildTree(path.join(argPath, 'build'), stats);
    walkBuildTree(path.join(argPath, '.cxx'), stats);
  }
} else {
  for (const t of targetsFromRoot(mobileRoot)) {
    walkBuildTree(t, stats);
  }
}

if (stats.files > 0) {
  console.log(`[expand-hardlinks] materialized ${stats.files} .so file(s)`);
}
