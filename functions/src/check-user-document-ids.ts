import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Cloud Function to check if user document IDs match Firebase Auth UIDs
 * 
 * This helps diagnose migration issues by showing which documents
 * have IDs that don't match their Firebase Auth UIDs
 */
export const checkUserDocumentIds = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
  })
  .region('us-central1')
  .https.onCall(async (data, context) => {
    // Only allow authenticated users
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be authenticated to check user document IDs'
      );
    }

    const db = admin.firestore();
    const auth = admin.auth();
    
    const results: Array<{
      docId: string;
      email: string;
      role: string;
      firebaseAuthUID?: string;
      matches: boolean;
      needsMigration: boolean;
      error?: string;
    }> = [];

    try {
      // Get all user documents
      const usersSnapshot = await db.collection('users').get();
      
      console.log(`Checking ${usersSnapshot.size} user documents...`);

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const docId = userDoc.id;
        const email = userData.email;
        const role = userData.role || 'unknown';

        if (!email) {
          results.push({
            docId,
            email: '',
            role,
            matches: false,
            needsMigration: false,
            error: 'No email found',
          });
          continue;
        }

        // Try to find Firebase Auth user by email
        let firebaseAuthUID: string | undefined;
        let matches = false;
        let needsMigration = false;
        let error: string | undefined;

        try {
          const firebaseAuthUser = await auth.getUserByEmail(email);
          firebaseAuthUID = firebaseAuthUser.uid;
          matches = docId === firebaseAuthUID;
          needsMigration = !matches;
        } catch (authError: any) {
          if (authError.code === 'auth/user-not-found') {
            error = 'Firebase Auth user not found';
            needsMigration = false; // Can't migrate if Auth user doesn't exist
          } else {
            error = authError.message;
          }
        }

        results.push({
          docId,
          email,
          role,
          firebaseAuthUID,
          matches,
          needsMigration,
          error,
        });

        console.log(
          `User ${email}: Doc ID=${docId}, Auth UID=${firebaseAuthUID || 'N/A'}, ` +
          `Matches=${matches}, NeedsMigration=${needsMigration}`
        );
      }

      return {
        success: true,
        users: results,
        summary: {
          total: results.length,
          matches: results.filter((r) => r.matches).length,
          needsMigration: results.filter((r) => r.needsMigration).length,
          noAuthUser: results.filter((r) => r.error === 'Firebase Auth user not found').length,
        },
      };
    } catch (error: any) {
      console.error('Error checking user document IDs:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to check user document IDs: ${error.message}`
      );
    }
  });

