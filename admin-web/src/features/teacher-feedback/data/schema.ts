import { z } from 'zod'
import { Timestamp } from 'firebase/firestore'

/**
 * Feedback Category Schema
 */
export const feedbackCategorySchema = z.enum(['usability', 'educational', 'general'])

export type FeedbackCategory = z.infer<typeof feedbackCategorySchema>

/**
 * Teacher Feedback Schema (matching Firestore structure)
 */
export const teacherFeedbackSchema = z.object({
  id: z.string(),
  teacherID: z.string(),
  rating: z.number().min(1).max(5),
  feedbackText: z.string(),
  category: feedbackCategorySchema,
  createdAt: z.union([z.instanceof(Timestamp), z.date()]),
})

export type TeacherFeedback = z.infer<typeof teacherFeedbackSchema>

/**
 * Feedback Display Type (enriched with teacher information)
 */
export type FeedbackDisplay = Omit<TeacherFeedback, 'createdAt'> & {
  createdAt: Date
  teacherName?: string
  teacherEmail?: string
}

/**
 * Feedback Statistics for Dashboard
 */
export type FeedbackStats = {
  total: number
  averageRating: number
  ratingDistribution: {
    rating: number
    count: number
  }[]
  categoryBreakdown: {
    category: FeedbackCategory
    count: number
  }[]
  recentFeedbacks: FeedbackDisplay[]
  trends: {
    period: string
    count: number
  }[]
}

