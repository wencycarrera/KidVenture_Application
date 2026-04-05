import { Timestamp } from 'firebase/firestore'
import { type TeacherFeedback, type FeedbackDisplay } from './schema'

/**
 * Convert Firestore Timestamp to JavaScript Date
 */
export function convertTimestampToDate(
  timestamp: Timestamp | Date | undefined
): Date {
  if (!timestamp) return new Date()
  if (timestamp instanceof Date) return timestamp
  return timestamp.toDate()
}

/**
 * Transform Feedback data from Firestore format to display format
 */
export function transformFeedbackForDisplay(
  feedback: TeacherFeedback,
  teacherName?: string,
  teacherEmail?: string
): FeedbackDisplay {
  return {
    ...feedback,
    createdAt: convertTimestampToDate(feedback.createdAt),
    teacherName,
    teacherEmail,
  }
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Format date for short display
 */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Get category label
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    usability: 'Usability',
    educational: 'Educational',
    general: 'General',
  }
  return labels[category] || category
}

/**
 * Get rating stars display
 */
export function getRatingStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

