/**
 * For USB-connected Android: forwards device localhost:8081 → PC Metro (port 8081).
 * Run once after plugging in the phone (USB debugging on, adb shows "device").
 * Then: npm run start:usb  →  in Metro press "a" to open Expo Go.
 */
const { execFileSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const win = process.platform === 'win32';
const base = win ? process.env.LOCALAPPDATA : process.env.HOME;
const candidates = [
  path.join(base || '', 'Android', 'Sdk', 'platform-tools', 'adb' + (win ? '.exe' : '')),
  process.env.ANDROID_HOME && path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb' + (win ? '.exe' : '')),
  process.env.ANDROID_SDK_ROOT && path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb' + (win ? '.exe' : '')),
].filter(Boolean);

const adb = candidates.find((p) => existsSync(p));
if (!adb) {
  console.error('adb not found. Install Android SDK platform-tools or add adb to PATH.');
  process.exit(1);
}

let devicesOut = '';
try {
  devicesOut = execFileSync(adb, ['devices'], { encoding: 'utf8' });
} catch {
  console.error('adb failed. Is the phone connected with USB debugging?');
  process.exit(1);
}
const lines = devicesOut
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('List'));
const hasDevice = lines.some((l) => /\tdevice$/.test(l));
if (!hasDevice) {
  console.error('No Android device in "adb devices" with status "device".');
  console.error('Unlock the phone, enable USB debugging, accept the RSA prompt, then retry.');
  if (lines.length) console.error('Current:', lines.join('\n'));
  process.exit(1);
}

for (const port of ['8081', '8082']) {
  try {
    execFileSync(adb, ['reverse', `tcp:${port}`, `tcp:${port}`], { stdio: 'inherit' });
    console.log(`OK: adb reverse tcp:${port} tcp:${port}`);
  } catch {
    console.error(`Failed reverse for port ${port}`);
    process.exit(1);
  }
}

console.log('\nNext: npm run start:usb   (then press a in Metro, or open project in Expo Go)');
