import { useQuery } from '@tanstack/react-query'
import {
  collection,
  query,
  getDocs,
  orderBy,
  Timestamp,
  doc,
  getDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  type TeacherFeedback,
  type FeedbackDisplay,
  type FeedbackStats,
  type FeedbackCategory,
} from '../data/schema'
import {
  transformFeedbackForDisplay,
  convertTimestampToDate,
} from '../data/data'
import { toast } from 'sonner'

/**
 * Fetch all feedbacks from Firestore
 * Enriches feedback with teacher information
 */
async function fetchAllFeedbacks(): Promise<FeedbackDisplay[]> {
  try {
    const feedbackRef = collection(db, 'teacher_feedback')
    const usersRef = collection(db, 'users')

    // Try to query with orderBy, but fallback to simple query if index is missing
    let querySnapshot
    try {
      const q = query(feedbackRef, orderBy('createdAt', 'desc'))
      querySnapshot = await getDocs(q)
    } catch (orderByError: unknown) {
      // If orderBy fails (likely missing index), fetch without ordering
      if (orderByError instanceof Error && orderByError.message.includes('index')) {
        console.debug('Firestore index not found, sorting in memory instead')
      } else {
        console.warn('OrderBy failed, fetching without sort:', orderByError)
      }
      querySnapshot = await getDocs(feedbackRef)
    }

    const feedbacks: FeedbackDisplay[] = []
    const teacherCache = new Map<string, { name?: string; email?: string }>()

    // First, collect all unique teacher IDs
    const teacherIDs = new Set<string>()
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.teacherID) {
        teacherIDs.add(data.teacherID)
      }
    })

    console.log(
      `Found ${querySnapshot.docs.length} feedbacks with ${teacherIDs.size} unique teacher IDs:`,
      Array.from(teacherIDs)
    )

    // Fetch all teachers in batch
    // The teacherID in feedback is the Firebase Auth UID, but the document ID might be different
    // So we need to query all teachers and match by document ID OR find a uid field
    const teacherPromises = Array.from(teacherIDs).map(async (teacherID) => {
      try {
        // First, try direct document lookup (in case document ID matches)
        const teacherDocRef = doc(usersRef, teacherID)
        const teacherDoc = await getDoc(teacherDocRef)
        
        if (teacherDoc.exists()) {
          const teacherData = teacherDoc.data()
          const teacherName =
            teacherData.teacherProfile?.name ||
            teacherData.name ||
            teacherData.email?.split('@')[0] ||
            'Unknown Teacher'
          
          const teacherInfo = {
            name: teacherName,
            email: teacherData.email || '',
          }
          
          teacherCache.set(teacherID, teacherInfo)
          return { teacherID, teacherInfo }
        }
        
        // If direct lookup fails, the document ID doesn't match the Firebase Auth UID
        // This can happen if documents were created with different IDs
        // We need to query all teachers and check their document structure
        console.log(
          `Teacher document not found for ID: ${teacherID} (Firebase Auth UID), querying all teachers...`
        )
        
        const allUsersQuery = query(usersRef, where('role', '==', 'teacher'))
        const allUsersSnapshot = await getDocs(allUsersQuery)
        
        console.log(
          `Found ${allUsersSnapshot.size} teachers. Checking for matches...`
        )
        
        let foundMatch = false
        allUsersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data()
          
          // Log the structure for debugging
          console.log(`Checking teacher doc ${userDoc.id}:`, {
            docId: userDoc.id,
            teacherID,
            hasTeacherProfile: !!userData.teacherProfile,
            email: userData.email,
            allFields: Object.keys(userData),
            fullData: userData, // Show full document structure
          })
          
          // Check if there's a uid field that matches
          if (userData.uid === teacherID || userData.userID === teacherID) {
            foundMatch = true
            const teacherName =
              userData.teacherProfile?.name ||
              userData.name ||
              userData.email?.split('@')[0] ||
              'Unknown Teacher'
            
            const teacherInfo = {
              name: teacherName,
              email: userData.email || '',
            }
            teacherCache.set(teacherID, teacherInfo)
            console.log(`✓ Found match by uid/userID field!`, teacherInfo)
            return
          }
          
          // Match by document ID (should be the Firebase Auth UID)
          if (userDoc.id === teacherID) {
            foundMatch = true
            const teacherName =
              userData.teacherProfile?.name ||
              userData.name ||
              userData.email?.split('@')[0] ||
              'Unknown Teacher'
            
            const teacherInfo = {
              name: teacherName,
              email: userData.email || '',
            }
            teacherCache.set(teacherID, teacherInfo)
            console.log(`✓ Found match by document ID!`, teacherInfo)
            return
          }
        })
        
        if (!foundMatch) {
          console.warn(
            `No teacher found matching Firebase Auth UID: ${teacherID}`,
            `\nThis teacherID doesn't match any current user document.`,
            `\nThe teacher account may have been deleted or the feedback was created with an incorrect teacherID.`
          )
          
          // This teacherID doesn't exist in current users - likely deleted account
          const teacherInfo = {
            name: `Unknown Teacher (Deleted Account)`,
            email: '',
          }
          teacherCache.set(teacherID, teacherInfo)
          return { teacherID, teacherInfo }
        }
      } catch (error) {
        console.error(`Error fetching teacher ${teacherID}:`, error)
        const teacherInfo = {
          name: 'Unknown Teacher',
          email: '',
        }
        teacherCache.set(teacherID, teacherInfo)
        return { teacherID, teacherInfo }
      }
    })

    // Wait for all teacher fetches to complete
    await Promise.all(teacherPromises)

    // Process feedbacks and enrich with teacher info
    for (const docSnapshot of querySnapshot.docs) {
      try {
        const data = docSnapshot.data()
        const feedback: TeacherFeedback = {
          id: docSnapshot.id,
          teacherID: data.teacherID,
          rating: data.rating,
          feedbackText: data.feedbackText,
          category: data.category,
          createdAt: data.createdAt as Timestamp,
        }

        // Get teacher info from cache
        const teacherInfo =
          teacherCache.get(feedback.teacherID) || {
            name: 'Unknown Teacher',
            email: '',
          }

        const displayFeedback = transformFeedbackForDisplay(
          feedback,
          teacherInfo.name,
          teacherInfo.email
        )
        feedbacks.push(displayFeedback)
      } catch (error) {
        console.error(`Error transforming feedback ${docSnapshot.id}:`, error)
      }
    }

    // Sort in memory if we couldn't use Firestore orderBy
    if (querySnapshot.docs.length > 0) {
      feedbacks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }

    return feedbacks
  } catch (error) {
    console.error('Error fetching feedbacks:', error)
    throw new Error('Failed to fetch feedbacks. Please try again.')
  }
}

/**
 * Calculate feedback statistics for dashboard
 */
function calculateFeedbackStats(feedbacks: FeedbackDisplay[]): FeedbackStats {
  const total = feedbacks.length

  // Average rating
  const averageRating =
    total > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / total
      : 0

  // Rating distribution
  const ratingCounts = new Map<number, number>()
  for (let i = 1; i <= 5; i++) {
    ratingCounts.set(i, 0)
  }
  feedbacks.forEach((f) => {
    ratingCounts.set(f.rating, (ratingCounts.get(f.rating) || 0) + 1)
  })
  const ratingDistribution = Array.from(ratingCounts.entries()).map(
    ([rating, count]) => ({ rating, count })
  )

  // Category breakdown
  const categoryCounts = new Map<FeedbackCategory, number>()
  feedbacks.forEach((f) => {
    categoryCounts.set(f.category, (categoryCounts.get(f.category) || 0) + 1)
  })
  const categoryBreakdown = Array.from(categoryCounts.entries()).map(
    ([category, count]) => ({ category, count })
  )

  // Recent feedbacks (last 10)
  const recentFeedbacks = feedbacks.slice(0, 10)

  // Trends (group by month)
  const trendsMap = new Map<string, number>()
  feedbacks.forEach((f) => {
    const monthKey = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
    }).format(f.createdAt)
    trendsMap.set(monthKey, (trendsMap.get(monthKey) || 0) + 1)
  })
  const trends = Array.from(trendsMap.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period))

  return {
    total,
    averageRating,
    ratingDistribution,
    categoryBreakdown,
    recentFeedbacks,
    trends,
  }
}

/**
 * React Query hook to fetch all feedbacks
 */
export function useFeedbacks() {
  return useQuery({
    queryKey: ['feedbacks'],
    queryFn: fetchAllFeedbacks,
    staleTime: 30000, // 30 seconds
    retry: 2,
  })
}

/**
 * React Query hook to fetch feedback statistics
 */
export function useFeedbackStats() {
  return useQuery({
    queryKey: ['feedback-stats'],
    queryFn: async () => {
      const feedbacks = await fetchAllFeedbacks()
      return calculateFeedbackStats(feedbacks)
    },
    staleTime: 60000, // 1 minute
    retry: 2,
  })
}

