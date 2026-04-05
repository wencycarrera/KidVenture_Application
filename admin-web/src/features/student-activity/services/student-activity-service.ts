import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  ActivityFilters,
  FirestoreProgress,
  StudentActivityRow,
  StudentProgressCompact,
} from '../types'

type FirestoreUser = {
  role?: 'teacher' | 'parent' | 'admin' | 'student'
  email?: string
  studentProfile?: {
    name?: string
    joinedClassID?: string
  }
}

function toDate(value?: any): Date | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value
  if (value.toDate) return value.toDate()
  return undefined
}

function calculateStars(score: number | undefined): number {
  if (score === undefined || score === null) return 0
  if (score <= 0) return 0
  if (score >= 80) return 3
  if (score >= 50) return 2
  return 1
}

async function fetchStudentActivity(filters: ActivityFilters): Promise<StudentActivityRow[]> {
  // Fetch users first to map student IDs to names/classes
  const usersRef = collection(db, 'users')
  const usersSnap = await getDocs(usersRef)
  const studentInfo = new Map<
    string,
    { name: string; classID?: string; email?: string }
  >()

  usersSnap.forEach((docSnap) => {
    const data = docSnap.data() as FirestoreUser
    if (data.role === 'student') {
      const name =
        data.studentProfile?.name ||
        data.email?.split('@')[0] ||
        'Student'
      studentInfo.set(docSnap.id, {
        name,
        classID: data.studentProfile?.joinedClassID,
        email: data.email,
      })
    }
  })

  // Fetch student progress records
  const progressRef = collection(db, 'student_progress')
  let progressSnap
  try {
    progressSnap = await getDocs(query(progressRef, orderBy('lastAttemptAt', 'desc')))
  } catch {
    progressSnap = await getDocs(progressRef)
  }

  const byStudent = new Map<string, StudentActivityRow>()

  progressSnap.forEach((docSnap) => {
    const raw = docSnap.data() as FirestoreProgress
    const studentID = raw.studentID
    if (!studentID) return

    const student = studentInfo.get(studentID)
    const lastAttempt = toDate(raw.lastAttemptAt)
    const completedAt = toDate(raw.completedAt)

    // Date filtering (client-side)
    if (filters.from && lastAttempt && lastAttempt < filters.from) return
    if (filters.to && lastAttempt && lastAttempt > filters.to) return

    const existing =
      byStudent.get(studentID) ||
      ({
        studentID,
        studentName: student?.name ?? 'Unknown student',
        classID: student?.classID,
        averageScore: 0,
        completionRate: 0,
        totalTimeSpent: 0,
        attempts: 0,
        starsEarned: 0,
        completedModules: 0,
        totalModules: 0,
        activityCount: 0,
        progress: [],
      } satisfies StudentActivityRow)

    const score = raw.bestScore ?? raw.score ?? 0
    const stars = raw.starsEarned ?? calculateStars(score)
    const attempts = raw.attempts ?? 1
    const timeSpent = raw.timeSpent ?? 0
    const status = raw.status ?? 'in_progress'

    const progressItem: StudentProgressCompact = {
      moduleID: raw.moduleID || 'unknown',
      lessonTitle: raw.lessonTitle,
      topicCategory: raw.topicCategory,
      activityType: raw.activityType,
      score,
      status,
      attempts,
      timeSpent,
      starsEarned: stars,
      lastAttemptAt: lastAttempt,
      completedAt,
    }

    existing.progress.push(progressItem)
    existing.activityCount += 1
    existing.totalTimeSpent += timeSpent
    existing.attempts += attempts
    existing.starsEarned += stars

    if (status === 'completed') {
      existing.completedModules += 1
    }

    // Track unique modules to estimate completion rate
    const uniqueModules = new Set(
      existing.progress.map((p) => p.moduleID)
    )
    existing.totalModules = uniqueModules.size

    existing.averageScore =
      existing.progress.reduce((sum, p) => sum + (p.score ?? 0), 0) /
      (existing.progress.length || 1)

    if (existing.totalModules > 0) {
      existing.completionRate = Math.min(
        100,
        (existing.completedModules / existing.totalModules) * 100
      )
    }

    if (lastAttempt) {
      if (!existing.lastActivity || existing.lastActivity < lastAttempt) {
        existing.lastActivity = lastAttempt
      }
    }

    byStudent.set(studentID, existing)
  })

  let rows = Array.from(byStudent.values())

  // Filter by class if provided
  if (filters.classId) {
    rows = rows.filter((row) => row.classID === filters.classId)
  }

  // Text search by student name or email
  if (filters.search) {
    const term = filters.search.toLowerCase()
    rows = rows.filter((row) => {
      const info = studentInfo.get(row.studentID)
      return (
        row.studentName.toLowerCase().includes(term) ||
        (info?.email?.toLowerCase().includes(term) ?? false)
      )
    })
  }

  // Sort by last activity desc
  rows.sort((a, b) => {
    const aTime = a.lastActivity?.getTime() ?? 0
    const bTime = b.lastActivity?.getTime() ?? 0
    return bTime - aTime
  })

  return rows
}

export function useStudentActivity(filters: ActivityFilters) {
  return useQuery({
    queryKey: [
      'student-activity',
      {
        classId: filters.classId ?? '',
        from: filters.from?.toISOString() ?? '',
        to: filters.to?.toISOString() ?? '',
        search: filters.search ?? '',
      },
    ],
    queryFn: () => fetchStudentActivity(filters),
    staleTime: 30 * 1000,
  })
}





