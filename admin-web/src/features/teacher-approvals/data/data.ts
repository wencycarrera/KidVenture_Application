import { Timestamp } from 'firebase/firestore'
import { type Teacher, type TeacherDisplay } from './schema'

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
 * Transform Teacher data from Firestore format to display format
 */
export function transformTeacherForDisplay(teacher: Teacher): TeacherDisplay {
  return {
    ...teacher,
    createdAt: convertTimestampToDate(teacher.createdAt),
    updatedAt: teacher.updatedAt
      ? convertTimestampToDate(teacher.updatedAt)
      : undefined,
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
  }).format(date)
}

