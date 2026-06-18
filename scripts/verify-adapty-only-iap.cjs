'use strict';

/**
 * Fail fast if another App Store / Play Billing subscription SDK is declared.
 * TruWell mobile IAP must use react-native-adapty only (see CLAUDE.md).
 *
 * Stripe (@stripe/stripe-react-native) is intentional for card rails only, not IAP.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/** Competitor IAP layers — keep out of mobile/package.json and lockfile. */
const FORBIDDEN = [
  'react-native-purchases',
  'react-native-purchases-ui',
  'react-native-iap',
  'expo-in-app-purchases',
];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function forbidLockKey(pkgKey, name) {
  const esc = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`/node_modules/${esc}(?:\\/|$)`);
  return re.test(pkgKey);
}

function checkPackageJson() {
  const pkg = readJson(path.join(ROOT, 'package.json'));
  const blocks = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
  const hits = [];
  for (const block of blocks) {
    const obj = pkg[block];
    if (!obj || typeof obj !== 'object') continue;
    for (const name of FORBIDDEN) {
      if (Object.prototype.hasOwnProperty.call(obj, name)) hits.push(`${block}.${name}`);
    }
  }
  return hits;
}

function checkLockfile() {
  const lockPath = path.join(ROOT, 'package-lock.json');
  if (!fs.existsSync(lockPath)) return [];
  const lock = readJson(lockPath);
  const pkgs = lock.packages || {};
  const hits = [];
  for (const key of Object.keys(pkgs)) {
    for (const name of FORBIDDEN) {
      if (forbidLockKey(key, name)) hits.push(`${key}`);
    }
  }
  return [...new Set(hits)].sort();
}

function main() {
  if (process.env.SKIP_ADAPTY_IAP_VERIFY === '1') {
    console.warn('[TruWell] SKIP_ADAPTY_IAP_VERIFY=1 — skipping IAP SDK guard.');
    process.exit(0);
  }

  const fromPkg = checkPackageJson();
  const fromLock = checkLockfile();

  if (fromPkg.length || fromLock.length) {
    console.error('');
    console.error('[TruWell] Forbidden in-app subscription SDK detected.');
    console.error('  Allowed for App Store / Play IAP: react-native-adapty only.');
    console.error('');
    console.error('  Remove these from mobile/package.json and reinstall:');
    if (fromPkg.length) console.error(`    package.json hits: ${fromPkg.join(', ')}`);
    if (fromLock.length) {
      const sample = fromLock.slice(0, 25);
      console.error(`    package-lock hits (${fromLock.length} paths), sample:`);
      sample.forEach((h) => console.error(`      ${h}`));
      if (fromLock.length > sample.length) console.error(`      … +${fromLock.length - sample.length} more`);
    }
    console.error('');
    process.exit(1);
  }

  const pkg = readJson(path.join(ROOT, 'package.json'));
  const merged = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };
  if (!merged['react-native-adapty']) {
    console.error('[TruWell] react-native-adapty must be listed in dependencies.');
    process.exit(1);
  }

  console.log('[TruWell] IAP SDK check OK: Adapty only (no RevenueCat / react-native-iap / expo-iap).');
}

main();
