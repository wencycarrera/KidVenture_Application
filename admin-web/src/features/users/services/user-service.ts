import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  addDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { type User } from '../data/schema'
import { toast } from 'sonner'

/**
 * Firestore User Document Structure
 */
interface FirestoreUser {
  role: 'teacher' | 'parent' | 'admin' | 'student'
  email: string
  status?: 'active' | 'inactive' | 'invited' | 'suspended'
  isApproved?: boolean
  createdAt: Timestamp | Date
  updatedAt?: Timestamp | Date
  teacherProfile?: {
    name: string
    birthday?: Timestamp
    schoolID?: string
  }
  parentProfile?: {
    parentName: string
    joinedClassID?: string
  }
  childProfile?: {
    name: string
    birthday?: Timestamp
    gender?: string
    stars?: number
  }
  studentProfile?: {
    name: string
    birthday?: Timestamp
    gender?: 'male' | 'female' | 'other'
    points?: number
    level?: number
    parentInfo?: {
      parentName: string
      parentBirthday?: Timestamp
      parentEmail: string
    }
    joinedClassID?: string
  }
}

/**
 * Transform Firestore user to User type
 */
function transformFirestoreUser(
  docId: string,
  data: FirestoreUser
): User | null {
  // Extract name based on role
  let firstName = ''
  let lastName = ''
  let username = ''
  let phoneNumber = 'N/A'
  let studentProfile = undefined

  if (data.role === 'teacher' && data.teacherProfile) {
    const nameParts = data.teacherProfile.name.split(' ')
    firstName = nameParts[0] || ''
    lastName = nameParts.slice(1).join(' ') || ''
    username = data.email.split('@')[0] || ''
  } else if (data.role === 'parent' && data.parentProfile) {
    const nameParts = data.parentProfile.parentName.split(' ')
    firstName = nameParts[0] || ''
    lastName = nameParts.slice(1).join(' ') || ''
    username = data.email.split('@')[0] || ''
  } else if (data.role === 'admin') {
    firstName = 'Admin'
    lastName = 'User'
    username = data.email.split('@')[0] || ''
  } else if (data.role === 'student' && data.studentProfile) {
    const nameParts = data.studentProfile.name.split(' ')
    firstName = nameParts[0] || ''
    lastName = nameParts.slice(1).join(' ') || ''
    username = data.email.split('@')[0] || ''
    // Preserve student profile data for detail view
    studentProfile = {
      name: data.studentProfile.name,
      birthday: data.studentProfile.birthday,
      gender: data.studentProfile.gender,
      points: data.studentProfile.points,
      level: data.studentProfile.level,
      parentInfo: data.studentProfile.parentInfo,
      joinedClassID: data.studentProfile.joinedClassID,
    }
  }

  // Convert Timestamp to Date
  const createdAt =
    data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : data.createdAt instanceof Date
        ? data.createdAt
        : new Date()

  const updatedAt =
    data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate()
      : data.updatedAt instanceof Date
        ? data.updatedAt
        : createdAt

  // Use the actual role from Firestore (no mapping needed)
  const role: 'teacher' | 'parent' | 'admin' | 'student' = data.role

  // Determine status: prefer stored value, fallback to derived
  let status: 'active' | 'inactive' | 'invited' | 'suspended' =
    data.status ?? 'active'
  if (!data.status) {
    if (data.role === 'teacher' && data.isApproved === false) {
      status = 'invited'
    } else if (data.role === 'teacher' && data.isApproved === true) {
      status = 'active'
    } else if (data.role === 'parent' || data.role === 'admin' || data.role === 'student') {
      status = 'active'
    }
  }

  return {
    id: docId,
    firstName,
    lastName,
    username,
    email: data.email,
    phoneNumber,
    status,
    role,
    createdAt,
    updatedAt,
    studentProfile,
  }
}

/**
 * Fetch all users from Firestore
 */
async function fetchUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users')

    // Try to query with orderBy, but fallback to simple query if index is missing
    let querySnapshot
    try {
      const q = query(usersRef, orderBy('createdAt', 'desc'))
      querySnapshot = await getDocs(q)
    } catch (orderByError) {
      // If orderBy fails (likely missing index), fetch without ordering
      console.warn('OrderBy failed, fetching without sort:', orderByError)
      querySnapshot = await getDocs(usersRef)
    }

    const users: User[] = []

    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data() as FirestoreUser
        const transformedUser = transformFirestoreUser(doc.id, data)
        if (transformedUser) {
          users.push(transformedUser)
        }
      } catch (error) {
        console.error(`Error transforming user ${doc.id}:`, error)
      }
    })

    // Sort in memory if we couldn't use Firestore orderBy
    users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

/**
 * React Query hook to fetch all users
 */
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * Form data structure for user updates
 */
export interface UserUpdateData {
  firstName: string
  lastName: string
  username: string
  email: string
  phoneNumber: string
  role: 'teacher' | 'parent' | 'admin' | 'student'
  password?: string
}

/**
 * Transform form data to Firestore structure based on user role
 */
function transformUserToFirestore(
  currentFirestoreData: FirestoreUser,
  formData: UserUpdateData
): Partial<FirestoreUser> {
  const fullName = `${formData.firstName} ${formData.lastName}`.trim()
  const updateData: Partial<FirestoreUser> = {
    email: formData.email,
    updatedAt: serverTimestamp() as any,
  }

  // Handle role-specific profile updates
  if (formData.role === 'teacher') {
    updateData.teacherProfile = {
      name: fullName,
    }
    // Preserve birthday if it exists
    if (currentFirestoreData.teacherProfile?.birthday) {
      updateData.teacherProfile.birthday = currentFirestoreData.teacherProfile.birthday
    }
  } else if (formData.role === 'parent') {
    updateData.parentProfile = {
      parentName: fullName,
    }
    // Preserve joinedClassID if it exists
    if (currentFirestoreData.parentProfile?.joinedClassID) {
      updateData.parentProfile.joinedClassID = currentFirestoreData.parentProfile.joinedClassID
    }
    // Preserve childProfile if it exists
    if (currentFirestoreData.childProfile) {
      updateData.childProfile = currentFirestoreData.childProfile
    }
  } else if (formData.role === 'admin') {
    // Admin role - no specific profile structure needed
    // Just update email and role
  }

  // Update role if it changed
  if (formData.role !== currentFirestoreData.role) {
    updateData.role = formData.role
  }

  return updateData
}

/**
 * Update a user in Firestore
 */
async function updateUser(
  userID: string,
  formData: UserUpdateData
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userID)

    // Fetch current document to preserve existing data
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) {
      throw new Error('User not found')
    }

    const currentFirestoreData = userDoc.data() as FirestoreUser
    const firestoreData = transformUserToFirestore(currentFirestoreData, formData)

    await updateDoc(userRef, firestoreData)
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

/**
 * Toggle user status (active/inactive)
 */
async function toggleUserStatus(
  userID: string,
  nextStatus: 'active' | 'inactive'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userID)
    await updateDoc(userRef, {
      status: nextStatus,
      updatedAt: serverTimestamp() as any,
    })
  } catch (error) {
    console.error('Error toggling user status:', error)
    throw error
  }
}

/**
 * Send password reset email
 */
async function resetUserPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw error
  }
}

/**
 * Delete a user from Firestore
 */
async function deleteUser(userID: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userID)
    await deleteDoc(userRef)
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

/**
 * React Query hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userID,
      formData,
    }: {
      userID: string
      formData: UserUpdateData
    }) => updateUser(userID, formData),
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated successfully!')
    },
    onError: (error) => {
      console.error('Error updating user:', error)
      toast.error('Failed to update user. Please try again.')
    },
  })
}

/**
 * React Query hook to toggle user status
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userID,
      nextStatus,
    }: {
      userID: string
      nextStatus: 'active' | 'inactive'
    }) => toggleUserStatus(userID, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User status updated.')
    },
    onError: (error) => {
      console.error('Error updating user status:', error)
      toast.error('Failed to update status. Please try again.')
    },
  })
}

/**
 * React Query hook to send password reset email
 */
export function useResetUserPassword() {
  return useMutation({
    mutationFn: (email: string) => resetUserPassword(email),
    onSuccess: () => {
      toast.success('Password reset email sent.')
    },
    onError: (error) => {
      console.error('Error sending reset email:', error)
      toast.error('Failed to send reset email. Please try again.')
    },
  })
}

/**
 * React Query hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted successfully!')
    },
    onError: (error) => {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user. Please try again.')
    },
  })
}

/**
 * Form data structure for admin creation
 */
export interface AdminCreateData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface TeacherCreateData {
  email: string
  fullName: string
  birthday?: string
  password: string
}

export interface StudentCreateData {
  studentName: string
  studentBirthday?: string
  gender?: 'male' | 'female' | 'other'
  parentName: string
  parentEmail: string
  password: string
}

function toTimestamp(dateString?: string) {
  if (!dateString) return undefined
  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) return undefined
  return Timestamp.fromDate(parsed)
}

async function checkEmailExists(email: string) {
  const usersRef = collection(db, 'users')
  const existingUsersSnapshot = await getDocs(query(usersRef))
  return existingUsersSnapshot.docs.some((docItem) => docItem.data().email === email)
}

/**
 * Create an admin user in Firestore
 */
async function createAdmin(formData: AdminCreateData): Promise<void> {
  try {
    const emailExists = await checkEmailExists(formData.email)
    if (emailExists) {
      throw new Error('A user with this email already exists')
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    )

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      role: 'admin',
      email: formData.email,
      status: 'active',
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to create admin user')
  }
}

/**
 * React Query hook to create an admin user
 */
export function useCreateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Admin user created successfully!')
    },
    onError: (error) => {
      console.error('Error creating admin:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create admin user. Please try again.'
      )
    },
  })
}

/**
 * Create a teacher user in Firestore (auto-approved)
 */
async function createTeacher(formData: TeacherCreateData): Promise<void> {
  try {
    const emailExists = await checkEmailExists(formData.email)
    if (emailExists) {
      throw new Error('A user with this email already exists')
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    )

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      role: 'teacher',
      email: formData.email,
      isApproved: true,
      status: 'active',
      createdAt: serverTimestamp(),
      teacherProfile: {
        name: formData.fullName.trim(),
        birthday: toTimestamp(formData.birthday),
      },
    })
  } catch (error) {
    console.error('Error creating teacher:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to create teacher user')
  }
}

export function useCreateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Teacher created successfully!')
    },
    onError: (error) => {
      console.error('Error creating teacher:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create teacher. Please try again.'
      )
    },
  })
}

/**
 * Create a student user in Firestore
 */
async function createStudent(formData: StudentCreateData): Promise<void> {
  try {
    const emailExists = await checkEmailExists(formData.parentEmail)
    if (emailExists) {
      throw new Error('A user with this parent email already exists')
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.parentEmail,
      formData.password
    )

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      role: 'student',
      email: formData.parentEmail,
      status: 'active',
      createdAt: serverTimestamp(),
      studentProfile: {
        name: formData.studentName.trim(),
        birthday: toTimestamp(formData.studentBirthday),
        gender: formData.gender,
        parentInfo: {
          parentName: formData.parentName.trim(),
          parentEmail: formData.parentEmail,
        },
      },
    })
  } catch (error) {
    console.error('Error creating student:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to create student user')
  }
}

export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Student created successfully!')
    },
    onError: (error) => {
      console.error('Error creating student:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create student. Please try again.'
      )
    },
  })
}

