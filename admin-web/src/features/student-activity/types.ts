import { Timestamp } from 'firebase/firestore'

export type StudentProgressCompact = {
  moduleID: string
  lessonTitle?: string
  topicCategory?: string
  activityType?: string
  score: number
  status: string
  attempts: number
  timeSpent: number
  starsEarned: number
  lastAttemptAt?: Date
  completedAt?: Date | null
}

export type StudentActivityRow = {
  studentID: string
  studentName: string
  classID?: string
  averageScore: number
  completionRate: number
  totalTimeSpent: number
  attempts: number
  starsEarned: number
  completedModules: number
  totalModules: number
  activityCount: number
  lastActivity?: Date
  progress: StudentProgressCompact[]
}

export type ActivityFilters = {
  classId?: string
  from?: Date
  to?: Date
  search?: string
}

export type FirestoreProgress = {
  studentID?: string
  moduleID?: string
  classID?: string
  score?: number
  bestScore?: number
  attempts?: number
  timeSpent?: number
  starsEarned?: number
  status?: string
  lastAttemptAt?: Timestamp | Date | null
  completedAt?: Timestamp | Date | null
  lessonTitle?: string
  topicCategory?: string
  activityType?: string
}





