import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { type Teacher, teacherSchema } from '../data/schema'
import { transformTeacherForDisplay, type TeacherDisplay } from '../data/data'
import { toast } from 'sonner'

/**
 * Fetch all pending teachers from Firestore
 * Pending = teachers where isApproved is false or undefined
 */
async function fetchPendingTeachers(): Promise<TeacherDisplay[]> {
  try {
    const usersRef = collection(db, 'users')
    
    // Fetch all teachers (we'll filter in memory to handle undefined isApproved)
    let querySnapshot
    try {
      // Try with orderBy first
      const q = query(
        usersRef,
        where('role', '==', 'teacher'),
        orderBy('createdAt', 'desc')
      )
      querySnapshot = await getDocs(q)
    } catch (orderByError: unknown) {
      // If orderBy fails (likely missing index), fetch without ordering
      // Suppress the expected index error - it's handled gracefully below
      if (orderByError instanceof Error && orderByError.message.includes('index')) {
        // This is expected - we'll sort in memory instead
        console.debug('Firestore index not found, sorting in memory instead')
      } else {
        console.warn('OrderBy failed, fetching without sort:', orderByError)
      }
      const q = query(usersRef, where('role', '==', 'teacher'))
      querySnapshot = await getDocs(q)
    }

    const teachers: TeacherDisplay[] = []

    querySnapshot.forEach((docSnapshot) => {
      try {
        const docData = docSnapshot.data()
        
        // Handle case where isApproved might be undefined (treat undefined as false = pending)
        // Only include teachers that are NOT approved (isApproved !== true)
        const isApproved = docData.isApproved === true
        
        if (docData.role === 'teacher' && !isApproved && docData.teacherProfile) {
          const data = {
            userID: docSnapshot.id,
            role: 'teacher' as const,
            email: docData.email || '',
            isApproved: false, // Explicitly set to false for pending teachers
            createdAt: docData.createdAt || new Date(),
            updatedAt: docData.updatedAt,
            teacherProfile: docData.teacherProfile,
          }
          
          const teacher = teacherSchema.parse(data)
          teachers.push(transformTeacherForDisplay(teacher))
        }
      } catch (error) {
        console.error(`Error parsing teacher ${docSnapshot.id}:`, error)
        console.error('Document data:', docSnapshot.data())
      }
    })

    // Sort in memory if we couldn't use Firestore orderBy
    teachers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    console.log(`Found ${teachers.length} pending teachers`)
    return teachers
  } catch (error) {
    console.error('Error fetching pending teachers:', error)
    throw error
  }
}

/**
 * Send teacher approval notification (in-app and email)
 * This creates a notification in Firestore and triggers email sending
 */
async function sendTeacherApprovalNotification(
  teacherID: string,
  teacherEmail: string,
  teacherName?: string
): Promise<void> {
  try {
    // Create in-app notification
    const notificationsRef = collection(db, 'notifications')
    await addDoc(notificationsRef, {
      recipientID: teacherID,
      title: 'Account Approved!',
      message: 'Your KidVenture teacher account has been approved. You can now create classes and lessons!',
      type: 'teacher_approved',
      isRead: false,
      createdAt: Timestamp.now(),
      data: {},
    })

    // Email notification is handled by Firebase Function or email service
    // The notification document can trigger a Cloud Function to send the email
    // For now, we'll just create the in-app notification
    console.log(`Approval notification created for teacher ${teacherID}`)
  } catch (error) {
    console.error('Error sending teacher approval notification:', error)
    // Don't throw - notification failures shouldn't block approval
  }
}

/**
 * Approve a teacher by updating their isApproved status
 * Also sends approval notification
 */
async function approveTeacher(userID: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userID)
    
    // Get teacher data before updating
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) {
      throw new Error('Teacher not found')
    }
    
    const userData = userSnap.data()
    const teacherEmail = userData.email || ''
    const teacherName = userData.teacherProfile?.name || userData.name || undefined

    // Update approval status
    await updateDoc(userRef, {
      isApproved: true,
      updatedAt: serverTimestamp(),
    })

    // Send approval notification (fire and forget - don't block on errors)
    sendTeacherApprovalNotification(userID, teacherEmail, teacherName).catch((error) => {
      console.error('Error sending approval notification (non-blocking):', error)
    })
  } catch (error) {
    console.error('Error approving teacher:', error)
    throw error
  }
}

/**
 * React Query hook to fetch pending teachers
 */
export function usePendingTeachers() {
  return useQuery({
    queryKey: ['pendingTeachers'],
    queryFn: fetchPendingTeachers,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * React Query hook to approve a teacher
 */
export function useApproveTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveTeacher,
    onSuccess: () => {
      // Invalidate and refetch pending teachers
      queryClient.invalidateQueries({ queryKey: ['pendingTeachers'] })
      toast.success('Teacher approved successfully!')
    },
    onError: (error) => {
      console.error('Error approving teacher:', error)
      toast.error('Failed to approve teacher. Please try again.')
    },
  })
}

