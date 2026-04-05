/**
 * Client-side utility to migrate user documents
 * 
 * WARNING: This is a temporary utility. The recommended approach is to use
 * the Cloud Function `migrateUserDocuments` which has Admin SDK access.
 * 
 * This client-side version has limitations:
 * - Cannot query Firebase Auth users directly
 * - Requires manual matching of emails to UIDs
 * - Less secure than Cloud Function approach
 * 
 * Usage: Import and call from browser console or admin panel
 */

import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, query, where, getDoc } from 'firebase/firestore'
import { db } from './firebase'

interface MigrationResult {
  success: boolean
  migrated: number
  failed: number
  errors: string[]
}

/**
 * Migrate a single user document
 * 
 * @param oldDocId - Current document ID
 * @param newDocId - Firebase Auth UID (new document ID)
 * @returns Success status
 */
async function migrateSingleUser(
  oldDocId: string,
  newDocId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if new document already exists
    const newDocRef = doc(db, 'users', newDocId)
    const newDocSnap = await getDoc(newDocRef)
    
    if (newDocSnap.exists()) {
      return {
        success: false,
        error: `Document with ID ${newDocId} already exists`,
      }
    }

    // Get old document
    const oldDocRef = doc(db, 'users', oldDocId)
    const oldDocSnap = await getDoc(oldDocRef)
    
    if (!oldDocSnap.exists()) {
      return {
        success: false,
        error: `Document with ID ${oldDocId} does not exist`,
      }
    }

    const userData = oldDocSnap.data()
    const batch = writeBatch(db)

    // Create new document with Firebase Auth UID as ID
    batch.set(newDocRef, {
      ...userData,
      migratedFrom: oldDocId,
      migratedAt: new Date(),
    })

    // Delete old document
    batch.delete(oldDocRef)

    // Update references in classrooms
    const classroomsQuery = query(
      collection(db, 'classrooms'),
      where('teacherID', '==', oldDocId)
    )
    const classroomsSnapshot = await getDocs(classroomsQuery)
    classroomsSnapshot.forEach((classroomDoc) => {
      batch.update(classroomDoc.ref, { teacherID: newDocId })
    })

    // Update references in teacher_feedback
    const feedbackQuery = query(
      collection(db, 'teacher_feedback'),
      where('teacherID', '==', oldDocId)
    )
    const feedbackSnapshot = await getDocs(feedbackQuery)
    feedbackSnapshot.forEach((feedbackDoc) => {
      batch.update(feedbackDoc.ref, { teacherID: newDocId })
    })

    // Update references in notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientID', '==', oldDocId)
    )
    const notificationsSnapshot = await getDocs(notificationsQuery)
    notificationsSnapshot.forEach((notificationDoc) => {
      batch.update(notificationDoc.ref, { recipientID: newDocId })
    })

    // Commit all changes
    await batch.commit()

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Migrate user documents using Cloud Function (RECOMMENDED)
 * 
 * This is the preferred method as it uses Firebase Admin SDK
 * to match emails to Firebase Auth UIDs automatically.
 */
export async function migrateUsersViaCloudFunction(): Promise<MigrationResult> {
  try {
    // Import Firebase Functions SDK
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    const functions = getFunctions()
    const migrateUserDocuments = httpsCallable(functions, 'migrateUserDocuments')

    const result = await migrateUserDocuments()
    const data = result.data as any

    return {
      success: data.success || false,
      migrated: data.migrated || 0,
      failed: data.failed || 0,
      errors: data.errors || [],
    }
  } catch (error: any) {
    console.error('Migration error:', error)
    return {
      success: false,
      migrated: 0,
      failed: 0,
      errors: [error.message || 'Unknown error'],
    }
  }
}

/**
 * Manual migration - requires you to provide the mapping of old IDs to new UIDs
 * 
 * @param mappings - Array of { oldDocId, newDocId } mappings
 */
export async function migrateUsersManually(
  mappings: Array<{ oldDocId: string; newDocId: string }>
): Promise<MigrationResult> {
  let migrated = 0
  let failed = 0
  const errors: string[] = []

  for (const mapping of mappings) {
    const result = await migrateSingleUser(mapping.oldDocId, mapping.newDocId)
    
    if (result.success) {
      migrated++
      console.log(`✓ Migrated ${mapping.oldDocId} -> ${mapping.newDocId}`)
    } else {
      failed++
      errors.push(`${mapping.oldDocId}: ${result.error}`)
      console.error(`✗ Failed to migrate ${mapping.oldDocId}:`, result.error)
    }
  }

  return {
    success: failed === 0,
    migrated,
    failed,
    errors,
  }
}

/**
 * Get all user documents that need migration
 * 
 * This helps you identify which documents need to be migrated
 */
export async function getUsersNeedingMigration(): Promise<
  Array<{ docId: string; email: string; role: string; needsMigration?: boolean; firebaseAuthUID?: string }>
> {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const users: Array<{ docId: string; email: string; role: string; needsMigration?: boolean; firebaseAuthUID?: string }> = []

    usersSnapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        docId: doc.id,
        email: data.email || '',
        role: data.role || '',
      })
    })

    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

/**
 * Check if document IDs match Firebase Auth UIDs
 * This requires calling a Cloud Function since we can't query Firebase Auth from client
 */
export async function checkUserDocumentIds(): Promise<{
  users: Array<{
    docId: string
    email: string
    role: string
    firebaseAuthUID?: string
    matches: boolean
    needsMigration: boolean
    error?: string
  }>
  summary?: {
    total: number
    matches: number
    needsMigration: number
    noAuthUser: number
  }
}> {
  try {
    // Import Firebase Functions SDK
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    const functions = getFunctions()
    const checkUserIds = httpsCallable(functions, 'checkUserDocumentIds')

    const result = await checkUserIds()
    const data = result.data as any
    
    console.log('Check IDs result:', data)
    
    return {
      users: data.users || [],
      summary: data.summary,
    }
  } catch (error: any) {
    console.error('Error checking user IDs:', error)
    // Fallback: return users without Firebase Auth UID check
    const users = await getUsersNeedingMigration()
    return {
      users: users.map((u) => ({
        ...u,
        matches: false,
        needsMigration: true,
        error: 'Could not check Firebase Auth UID',
      })),
    }
  }
}

