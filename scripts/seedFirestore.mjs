/**
 * Seed a college's Firestore so the app can run on it.
 *
 * The security rules only let a user in once appConfig/collegeInfo names their email domain,
 * and only an admin can write appConfig, so a new project cannot bootstrap itself from the
 * browser. This script writes with admin credentials instead:
 *   - creates every missing appConfig section from the bundled defaults (existing ones are kept)
 *   - with --admin, grants admin to that email: the app reads appConfig/adminEmails and the
 *     rules read users/{uid}.role, so it sets both
 *
 * Usage:  npm run seed:firestore -- [--project <id>] [--admin <email>]
 * Credentials: `gcloud auth application-default login`, or GOOGLE_APPLICATION_CREDENTIALS
 * pointing at a service account key. Set FIRESTORE_EMULATOR_HOST to seed the emulator instead.
 */
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { createServer } from 'vite';

const { values } = parseArgs({
  options: { project: { type: 'string' }, admin: { type: 'string' } },
});
const projectId =
  values.project ?? JSON.parse(readFileSync('.firebaserc', 'utf8')).projects.default;

// Load the bundled defaults through Vite so the app's path aliases resolve
const vite = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true },
});
const { generateDefaultConfig } = await vite.ssrLoadModule('/src/config/defaultConfig.ts');
const { CONFIG_COLLECTION, CONFIG_DOCS, toConfigDocData } = await vite.ssrLoadModule(
  '/src/services/configDocs.ts'
);
await vite.close();

initializeApp({ projectId });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true }); // e.g. collegeInfo.heroImageUrl
const target = process.env.FIRESTORE_EMULATOR_HOST ? `emulator ${projectId}` : projectId;
console.log(`Seeding ${target}`);

const configCol = db.collection(CONFIG_COLLECTION);
const existing = new Set((await configCol.listDocuments()).map((doc) => doc.id));
const defaults = generateDefaultConfig();
const batch = db.batch();
const created = [];
for (const [section, docId] of Object.entries(CONFIG_DOCS)) {
  if (existing.has(docId)) continue;
  batch.create(configCol.doc(docId), toConfigDocData(section, defaults[section]));
  created.push(docId);
}
await batch.commit();
console.log(created.length ? `Created ${created.join(', ')}` : 'All config sections already exist');

if (values.admin) {
  const email = values.admin.trim().toLowerCase();
  await configCol.doc('adminEmails').set({ items: FieldValue.arrayUnion(email) }, { merge: true });
  const users = await db.collection('users').where('email', '==', email).get();
  await Promise.all(users.docs.map((user) => user.ref.update({ role: 'admin' })));
  console.log(
    users.empty
      ? `Added ${email} to adminEmails. They have no profile yet: once they sign in, run this again to set their role.`
      : `Granted admin to ${email}`
  );
}
