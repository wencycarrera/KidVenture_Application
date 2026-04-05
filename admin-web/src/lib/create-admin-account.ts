/**
 * Utility script to create an admin account
 * 
 * This script helps you create your first admin account.
 * 
 * Usage:
 * 1. Open your browser console on the sign-in page
 * 2. Import and run: createAdminAccount('your-email@example.com', 'your-password')
 * 
 * Or use this in a temporary setup page (see create-admin-setup.tsx)
 */

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

/**
 * Create an admin account
 * 
 * @param email - Admin email address
 * @param password - Admin password (must be at least 6 characters)
 * @returns Promise that resolves when admin is created
 */
export async function createAdminAccount(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Validate inputs
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Please provide a valid email address',
      }
    }

    if (!password || password.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long',
      }
    }

    // Step 1: Create Firebase Auth user
    console.log('Creating Firebase Auth user...')
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    const user = userCredential.user
    console.log('Firebase Auth user created:', user.uid)

    // Step 2: Send email verification (optional but recommended)
    try {
      await sendEmailVerification(user)
      console.log('Verification email sent')
    } catch (error) {
      console.warn('Could not send verification email:', error)
      // Continue anyway - verification is optional
    }

    // Step 3: Create Firestore document with admin role
    // IMPORTANT: Document ID must match the Firebase Auth user's UID
    console.log('Creating Firestore admin document...')
    await setDoc(doc(db, 'users', user.uid), {
      role: 'admin',
      email: email,
      createdAt: serverTimestamp(),
    })
    console.log('Admin document created in Firestore')

    return {
      success: true,
      message: `Admin account created successfully! You can now sign in with ${email}`,
      userId: user.uid,
    }
  } catch (error: any) {
    console.error('Error creating admin account:', error)

    let errorMessage = 'Failed to create admin account'

    if (error.code === 'auth/email-already-in-use') {
      errorMessage =
        'This email is already registered. If you want to make this user an admin, you need to update the Firestore document manually.'
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use at least 6 characters.'
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address format.'
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      message: errorMessage,
    }
  }
}

/**
 * Make an existing Firebase Auth user an admin
 * (Useful if you already created a user in Firebase Console)
 * 
 * @param userId - Firebase Auth user UID
 * @param email - User's email address
 * @returns Promise that resolves when admin document is created
 */
export async function makeExistingUserAdmin(
  userId: string,
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Create Firestore document with admin role
    await setDoc(
      doc(db, 'users', userId),
      {
        role: 'admin',
        email: email,
        createdAt: serverTimestamp(),
      },
      { merge: true } // Merge in case document already exists
    )

    return {
      success: true,
      message: `User ${email} is now an admin!`,
    }
  } catch (error: any) {
    console.error('Error making user admin:', error)
    return {
      success: false,
      message: error.message || 'Failed to make user admin',
    }
  }
}

