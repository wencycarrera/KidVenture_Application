import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Cloud Function to migrate user documents to use Firebase Auth UID as document ID
 * 
 * This function:
 * 1. Fetches all user documents from Firestore
 * 2. For each user, finds the corresponding Firebase Auth user by email
 * 3. Creates a new document with Firebase Auth UID as the document ID
 * 4. Deletes the old document
 * 5. Updates any references in other collections (classrooms, etc.)
 * 
 * WARNING: This is a destructive operation. Make sure to backup your data first!
 * 
 * Usage: Call this function via HTTP or from admin panel
 */
export const migrateUserDocuments = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes (max for Cloud Functions)
    memory: '512MB',
  })
  .region('us-central1') // Change to your preferred region
  .https.onCall(async (data, context) => {
    // Only allow admins to run this migration
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be authenticated to run this migration'
      );
    }

    // Check if user is admin
    const adminDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can run this migration'
      );
    }

    const db = admin.firestore();
    const auth = admin.auth();
    
    let migrated = 0;
    let failed = 0;
    const errors: string[] = [];
    const BATCH_SIZE = 400; // Firestore batch limit is 500, use 400 to be safe

    try {
      // Get all user documents
      const usersSnapshot = await db.collection('users').get();
      
      console.log(`Found ${usersSnapshot.size} user documents to migrate`);

      // Process users and collect operations
      const operations: Array<{
        type: 'set' | 'delete' | 'update';
        ref: admin.firestore.DocumentReference;
        data?: any;
      }> = [];

      for (const userDoc of usersSnapshot.docs) {
        try {
          const userData = userDoc.data();
          const oldDocId = userDoc.id;
          const email = userData.email;

          if (!email) {
            console.warn(`Skipping user ${oldDocId}: no email found`);
            failed++;
            errors.push(`User ${oldDocId}: No email found`);
            continue;
          }

          // Find Firebase Auth user by email
          let firebaseAuthUser;
          try {
            firebaseAuthUser = await auth.getUserByEmail(email);
          } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
              console.warn(`Skipping user ${oldDocId}: Firebase Auth user not found for email ${email}`);
              failed++;
              errors.push(`User ${oldDocId}: Firebase Auth user not found for email ${email}`);
              continue;
            }
            throw error;
          }

          const firebaseAuthUID = firebaseAuthUser.uid;

          // Skip if document ID already matches Firebase Auth UID
          if (oldDocId === firebaseAuthUID) {
            console.log(`Skipping user ${oldDocId}: already using correct ID (matches Firebase Auth UID)`);
            continue;
          }
          
          console.log(`User ${oldDocId} needs migration: ${oldDocId} -> ${firebaseAuthUID}`);

          // Check if document with new ID already exists
          const newDocRef = db.collection('users').doc(firebaseAuthUID);
          const newDocExists = await newDocRef.get();
          
          if (newDocExists.exists) {
            console.warn(`Skipping user ${oldDocId}: Document with ID ${firebaseAuthUID} already exists`);
            failed++;
            errors.push(`User ${oldDocId}: Document with new ID ${firebaseAuthUID} already exists`);
            continue;
          }

          // Add operations to queue
          // Create new document
          operations.push({
            type: 'set',
            ref: newDocRef,
            data: {
              ...userData,
              migratedFrom: oldDocId,
              migratedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
          });

          // Delete old document
          operations.push({
            type: 'delete',
            ref: db.collection('users').doc(oldDocId),
          });

          // Update references in other collections
          // Update classrooms
          const classroomsSnapshot = await db
            .collection('classrooms')
            .where('teacherID', '==', oldDocId)
            .get();
          
          for (const classroomDoc of classroomsSnapshot.docs) {
            operations.push({
              type: 'update',
              ref: classroomDoc.ref,
              data: { teacherID: firebaseAuthUID },
            });
          }

          // Update teacher_feedback
          const feedbackSnapshot = await db
            .collection('teacher_feedback')
            .where('teacherID', '==', oldDocId)
            .get();
          
          for (const feedbackDoc of feedbackSnapshot.docs) {
            operations.push({
              type: 'update',
              ref: feedbackDoc.ref,
              data: { teacherID: firebaseAuthUID },
            });
          }

          // Update notifications
          const notificationsSnapshot = await db
            .collection('notifications')
            .where('recipientID', '==', oldDocId)
            .get();
          
          for (const notificationDoc of notificationsSnapshot.docs) {
            operations.push({
              type: 'update',
              ref: notificationDoc.ref,
              data: { recipientID: firebaseAuthUID },
            });
          }

          migrated++;
          console.log(`Queued migration for user ${oldDocId} -> ${firebaseAuthUID} (${email})`);

        } catch (error: any) {
          console.error(`Error processing user ${userDoc.id}:`, error);
          failed++;
          errors.push(`User ${userDoc.id}: ${error.message}`);
        }
      }

      // Execute operations in batches
      if (operations.length === 0) {
        console.log('No operations to execute. All users may already have correct IDs or no users need migration.');
      } else {
        console.log(`Executing ${operations.length} operations in batches of ${BATCH_SIZE}...`);
        
        for (let i = 0; i < operations.length; i += BATCH_SIZE) {
          const batch = db.batch();
          const batchOps = operations.slice(i, i + BATCH_SIZE);
          
          for (const op of batchOps) {
            if (op.type === 'set') {
              batch.set(op.ref, op.data!);
            } else if (op.type === 'delete') {
              batch.delete(op.ref);
            } else if (op.type === 'update') {
              batch.update(op.ref, op.data!);
            }
          }
          
          await batch.commit();
          console.log(`Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${batchOps.length} operations)`);
        }
      }

      const skipped = usersSnapshot.size - migrated - failed;
      
      return {
        success: true,
        message: `Migration completed: ${migrated} migrated, ${failed} failed, ${skipped} skipped (already correct)`,
        migrated,
        failed,
        skipped,
        total: usersSnapshot.size,
        errors: errors.slice(0, 10), // Return first 10 errors
      };
    } catch (error: any) {
      console.error('Migration error:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Migration failed: ${error.message}`
      );
    }
  });

