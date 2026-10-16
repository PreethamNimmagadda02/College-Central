/**
 * Fails the build when the bundle contains something that looks like a credential.
 *
 * Everything in dist/ is public: Vite inlines every `VITE_*` variable that source
 * code references, and the result is served to every visitor. A variable may only
 * reach the bundle if it is listed in PUBLIC_VARS below.
 *
 * Runs automatically after `vite build` (see "build" in package.json).
 * Usage: node scripts/check-bundle-secrets.js [dir]
 */

import fs from 'fs';
import path from 'path';
import { loadEnv } from 'vite';

const RULES = [
  // Google issues keys in two formats: AIza... and the newer AQ....
  { name: 'Google API key', pattern: /AIza[0-9A-Za-z_-]{35}|\bAQ\.[A-Za-z0-9_-]{40,}/g },
  { name: 'OpenAI API key', pattern: /\bsk-[A-Za-z0-9_-]{32,}/g },
  { name: 'Google OAuth client secret', pattern: /GOCSPX-[A-Za-z0-9_-]{28}/g },
  { name: 'Private key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { name: 'Service account file', pattern: /"type":\s*"service_account"/g },
];

// Variables whose values are meant to ship to the browser. Adding a name here
// publishes its value, so only add identifiers, never secrets.
const PUBLIC_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_FIREBASE_APPCHECK_SITE_KEY',
  'VITE_EMAILJS_SERVICE_ID',
  'VITE_EMAILJS_TEMPLATE_ID',
  'VITE_EMAILJS_PUBLIC_KEY',
  'VITE_ALLOWED_EMAIL_DOMAIN',
  'VITE_HOSTED_DOMAIN',
  'VITE_GOOGLE_MAPS_MAP_ID',
];

// Values shorter than this are too generic to search for (e.g. "true").
const MIN_VALUE_LENGTH = 8;

const dir = path.resolve(process.argv[2] ?? 'dist');
const env = loadEnv('production', process.cwd(), 'VITE_');
const allowed = new Set(PUBLIC_VARS.map((name) => env[name]).filter(Boolean));
const privateVars = Object.entries(env).filter(
  ([name, value]) => !PUBLIC_VARS.includes(name) && value.length >= MIN_VALUE_LENGTH
);

// Never print a full match: CI logs for this repository are public.
const mask = (value) => (value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value);

function listFiles(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(root, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

if (!fs.existsSync(dir)) {
  console.error(`✗ ${dir} does not exist. Run the build first.`);
  process.exit(1);
}

const findings = [];
for (const file of listFiles(dir)) {
  const content = fs.readFileSync(file, 'latin1');
  // Catches any secret format: the value of a non-public variable is in the bundle.
  for (const [name, value] of privateVars) {
    if (content.includes(value)) {
      findings.push(`${path.relative(process.cwd(), file)}: value of ${name}`);
    }
  }
  for (const { name, pattern } of RULES) {
    for (const value of new Set(content.match(pattern) ?? [])) {
      if (!allowed.has(value)) {
        findings.push(`${path.relative(process.cwd(), file)}: ${name} (${mask(value)})`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error(`✗ Found ${findings.length} credential(s) in the bundle:\n`);
  findings.forEach((finding) => console.error(`  ${finding}`));
  console.error(
    '\nAnything in the bundle is readable by every visitor. Keep the credential on a' +
      '\nserver and remove the VITE_ variable that exposes it. Do not deploy this build.' +
      '\nIf the value really is public, add its variable to PUBLIC_VARS in this script.'
  );
  process.exit(1);
}

console.log('✓ No credentials found in the bundle');
