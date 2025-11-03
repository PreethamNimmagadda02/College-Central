/**
 * Migration Script: Update Course Options for 24JE+ Students
 *
 * This script migrates existing users with admission numbers starting from 24JE
 * to use the NEP (National Education Policy) course structure instead of CBCS.
 *
 * Usage:
 * 1. Make sure you have Firebase Admin SDK credentials
 * 2. Run: npx ts-node scripts/migrateCourseOptions.ts
 *
 * What it does:
 * - Finds all users with admission numbers 24JE, 25JE, 26JE, etc.
 * - Updates their courseOption from CBCS to NEP (if not already NEP)
 * - Logs the changes for each user
 * - Creates an activity log entry for transparency
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin SDK
// You'll need to download your service account key from Firebase Console
// Place it in the project root as 'serviceAccountKey.json'
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

interface User {
  id: string;
  admissionNumber: string;
  courseOption?: 'CBCS' | 'NEP';
  name?: string;
  email?: string;
}

/**
 * Check if admission number should use NEP (24JE onwards)
 */
function shouldUseNEP(admissionNumber: string): boolean {
  const yearMatch = admissionNumber.match(/^(\d{2})/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    return year >= 24;
  }
  return false;
}

/**
 * Main migration function
 */
async function migrateCourseOptions() {
  console.log('🚀 Starting Course Option Migration...\n');
  console.log('Target: Update 24JE+ students to NEP\n');
  console.log('─'.repeat(60));

  try {
    // Fetch all users
    const usersSnapshot = await db.collection('users').get();

    let totalUsers = 0;
    let eligibleUsers = 0;
    let alreadyNEP = 0;
    let updated = 0;
    let errors = 0;

    const usersToUpdate: User[] = [];

    // First pass: Identify users that need migration
    console.log('\n📊 Analyzing users...\n');

    usersSnapshot.forEach((doc) => {
      totalUsers++;
      const userData = doc.data();
      const user: User = {
        id: doc.id,
        admissionNumber: userData.admissionNumber || '',
        courseOption: userData.courseOption,
        name: userData.name,
        email: userData.email,
      };

      // Check if user should use NEP
      if (shouldUseNEP(user.admissionNumber)) {
        eligibleUsers++;

        if (user.courseOption === 'NEP') {
          alreadyNEP++;
          console.log(`✅ ${user.admissionNumber} (${user.name}) - Already NEP`);
        } else {
          usersToUpdate.push(user);
          console.log(`🔄 ${user.admissionNumber} (${user.name}) - Needs update: ${user.courseOption || 'Not set'} → NEP`);
        }
      }
    });

    console.log('\n' + '─'.repeat(60));
    console.log('\n📈 Analysis Summary:');
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Eligible for NEP (24JE+): ${eligibleUsers}`);
    console.log(`   Already using NEP: ${alreadyNEP}`);
    console.log(`   Need migration: ${usersToUpdate.length}`);

    if (usersToUpdate.length === 0) {
      console.log('\n✨ No users need migration. All done!');
      return;
    }

    // Second pass: Update users
    console.log('\n' + '─'.repeat(60));
    console.log('\n🔧 Starting migration...\n');

    const batch = db.batch();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    for (const user of usersToUpdate) {
      try {
        const userRef = db.collection('users').doc(user.id);

        // Update course option
        batch.update(userRef, {
          courseOption: 'NEP',
          courseOptionUpdatedAt: timestamp,
          courseOptionMigrated: true,
        });

        // Create activity log
        const activityRef = db.collection('users').doc(user.id).collection('activity').doc();
        batch.set(activityRef, {
          type: 'update',
          title: 'Course Structure Updated',
          description: 'Your course structure has been automatically updated to NEP (National Education Policy) based on your admission batch (2024 onwards).',
          icon: '📚',
          timestamp: timestamp,
        });

        console.log(`✅ Queued: ${user.admissionNumber} (${user.name})`);
        updated++;
      } catch (error) {
        console.error(`❌ Error queuing ${user.admissionNumber}:`, error);
        errors++;
      }
    }

    // Commit all changes
    console.log('\n💾 Committing changes to Firestore...');
    await batch.commit();

    console.log('\n' + '─'.repeat(60));
    console.log('\n✨ Migration Complete!\n');
    console.log('📊 Results:');
    console.log(`   ✅ Successfully updated: ${updated} users`);
    console.log(`   ❌ Errors: ${errors} users`);
    console.log('\n' + '─'.repeat(60));

    // List updated users
    if (updated > 0) {
      console.log('\n📋 Updated Users:');
      usersToUpdate.forEach((user) => {
        console.log(`   • ${user.admissionNumber} - ${user.name} (${user.email})`);
      });
    }

    console.log('\n✅ All users with admission numbers 24JE and onwards have been migrated to NEP!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Dry run mode - Preview changes without applying them
 */
async function dryRun() {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
  console.log('─'.repeat(60));

  try {
    const usersSnapshot = await db.collection('users').get();

    let totalUsers = 0;
    let eligibleUsers = 0;
    let alreadyNEP = 0;
    let needsUpdate = 0;

    console.log('\n📊 Users that would be affected:\n');

    usersSnapshot.forEach((doc) => {
      totalUsers++;
      const userData = doc.data();
      const admissionNumber = userData.admissionNumber || '';
      const courseOption = userData.courseOption;
      const name = userData.name || 'Unknown';

      if (shouldUseNEP(admissionNumber)) {
        eligibleUsers++;
        if (courseOption === 'NEP') {
          alreadyNEP++;
        } else {
          needsUpdate++;
          console.log(`   🔄 ${admissionNumber} - ${name}`);
          console.log(`      Current: ${courseOption || 'Not set'} → Would change to: NEP\n`);
        }
      }
    });

    console.log('─'.repeat(60));
    console.log('\n📈 Dry Run Summary:');
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Eligible for NEP (24JE+): ${eligibleUsers}`);
    console.log(`   Already using NEP: ${alreadyNEP}`);
    console.log(`   Would be updated: ${needsUpdate}`);
    console.log('\n💡 Run without --dry-run flag to apply changes\n');
  } catch (error) {
    console.error('\n❌ Dry run failed:', error);
    throw error;
  }
}

// Main execution
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  dryRun()
    .then(() => {
      console.log('✅ Dry run completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Dry run failed:', error);
      process.exit(1);
    });
} else {
  console.log('⚠️  WARNING: This will modify user data in Firestore!');
  console.log('💡 Use --dry-run flag to preview changes first\n');

  // Wait 3 seconds to give time to cancel
  setTimeout(() => {
    migrateCourseOptions()
      .then(() => {
        console.log('✅ Migration completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
      });
  }, 3000);

  console.log('⏳ Starting in 3 seconds... (Press Ctrl+C to cancel)\n');
}
