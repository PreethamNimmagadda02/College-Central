/**
 * Script: Add Admin User
 * 
 * Adds an email address to the authorized admins list (privateConfig/adminEmails) in Firestore.
 * 
 * Usage:
 * npx ts-node scripts/addAdmin.ts [email]
 * 
 * If email is not provided as an argument, it will prompt for one.
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

// Initialize Firebase Admin SDK
// You'll need to download your service account key from Firebase Console
// Place it in the project root as 'serviceAccountKey.json'
const serviceAccountPath = join(process.cwd(), 'serviceAccountKey.json');
let serviceAccount;

try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('Error loading serviceAccountKey.json. Make sure it exists in the project root.');
  console.error('You can download it from Firebase Console -> Project Settings -> Service accounts');
  process.exit(1);
}

// Check if already initialized to avoid "default app already exists" error
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const addAdminEmail = async (email: string) => {
  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email address provided.');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  console.log(`\n🚀 Adding ${normalizedEmail} to admin list...`);

  try {
    const configRef = db.collection('privateConfig').doc('adminEmails');

    // Use transaction to ensure atomic update
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(configRef);

      let currentEmails: string[] = [];

      if (doc.exists) {
        const data = doc.data();
        if (data && Array.isArray(data.items)) {
          currentEmails = data.items;
        }
      }

      // Check if already in list (case-insensitive)
      if (currentEmails.map(e => e.toLowerCase()).includes(normalizedEmail)) {
        console.log(`⚠️  ${normalizedEmail} is already an admin.`);
        return;
      }

      const updatedEmails = [...currentEmails, normalizedEmail];

      // Store in { items: [...] } format
      transaction.set(configRef, { items: updatedEmails }, { merge: true });

      console.log(`✅ Successfully added ${normalizedEmail} as an admin!`);
      console.log(`   Current admins: ${updatedEmails.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Failed to update admin list:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Main execution
const args = process.argv.slice(2);

if (args.length > 0) {
  addAdminEmail(args[0]);
} else {
  rl.question('Enter email address to grant admin access: ', (email) => {
    rl.close();
    addAdminEmail(email);
  });
}
