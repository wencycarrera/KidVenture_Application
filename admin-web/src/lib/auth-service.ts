import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  type AuthError,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

/**
 * Custom error class for auth service errors
 */
export class AuthServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'AuthServiceError'
  }
}

/**
 * Get user-friendly error message from Firebase auth error
 */
function getAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.'
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.'
    case 'auth/invalid-email':
      return 'Invalid email address format.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.'
    case 'auth/invalid-credential':
      return 'Invalid email or password.'
    default:
      return 'Failed to login. Please check your credentials and try again.'
  }
}

/**
 * Admin user data from Firestore
 */
export interface AdminUserData {
  email: string
  role: 'admin'
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Verify if a user has admin role in Firestore
 */
async function verifyAdminRole(userId: string): Promise<AdminUserData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (!userDoc.exists()) {
      return null
    }

    const userData = userDoc.data()
    
    // Check if user has admin role
    if (userData.role !== 'admin') {
      return null
    }

    return {
      email: userData.email || '',
      role: 'admin',
      createdAt: userData.createdAt?.toDate(),
      updatedAt: userData.updatedAt?.toDate(),
    }
  } catch (error) {
    console.error('Error verifying admin role:', error)
    throw new AuthServiceError(
      'Failed to verify admin role. Please try again.',
      undefined,
      error
    )
  }
}

/**
 * Login admin with email and password
 * Verifies that the user has admin role in Firestore
 */
export async function loginAdmin(
  email: string,
  password: string
): Promise<{
  user: FirebaseUser
  idToken: string
  adminData: AdminUserData
}> {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )

    const user = userCredential.user

    // Verify admin role in Firestore
    const adminData = await verifyAdminRole(user.uid)

    if (!adminData) {
      // Sign out the user if they're not an admin
      await signOut(auth)
      throw new AuthServiceError(
        'Access denied. This account does not have admin privileges.',
        'auth/insufficient-permission'
      )
    }

    // Get ID token
    const idToken = await user.getIdToken()

    return {
      user,
      idToken,
      adminData,
    }
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error
    }

    if (error instanceof Error && 'code' in error) {
      throw new AuthServiceError(
        getAuthErrorMessage(error as AuthError),
        (error as AuthError).code,
        error
      )
    }

    throw new AuthServiceError(
      'Failed to login. Please check your credentials and try again.',
      undefined,
      error
    )
  }
}

/**
 * Logout current admin user
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error) {
    throw new AuthServiceError(
      'Failed to logout. Please try again.',
      undefined,
      error
    )
  }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser
}

/**
 * Get current user's ID token
 */
export async function getCurrentUserToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) {
    return null
  }
  try {
    return await user.getIdToken()
  } catch (error) {
    console.error('Error getting ID token:', error)
    return null
  }
}

/**
 * Listen to authentication state changes
 */
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback)
}

/**
 * Get admin user data from Firestore for current user
 */
export async function getCurrentAdminData(): Promise<AdminUserData | null> {
  const user = auth.currentUser
  if (!user) {
    return null
  }

  try {
    return await verifyAdminRole(user.uid)
  } catch (error) {
    console.error('Error getting admin data:', error)
    return null
  }
}

