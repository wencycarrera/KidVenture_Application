import { useQuery } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type DashboardSummary = {
  totalUsers: number
  students: number
  teachers: number
  parents: number
  admins: number
  pendingTeachers: number
}

export type ModuleStat = { name: string; completion: number; averageScore: number }
export type WeeklyActivityPoint = {
  name: string
  lessonStarts: number
  lessonCompletions: number
}

export type ModuleCompletionBar = { name: string; value: number }

export type ActivityItem = {
  name: string
  email: string
  action: string
  detail: string
}

export type DashboardData = {
  summary: DashboardSummary
  moduleStats: ModuleStat[]
  weeklyActivity: WeeklyActivityPoint[]
  topLessons: { name: string; value: number }[]
  completionBars: ModuleCompletionBar[]
  strugglingStudents: number
  recentActivity: ActivityItem[]
}

type FirestoreUser = {
  role?: 'teacher' | 'parent' | 'admin' | 'student'
  email?: string
  createdAt?: Timestamp | Date
  isApproved?: boolean
  teacherProfile?: { name?: string }
  parentProfile?: { parentName?: string }
  studentProfile?: { name?: string }
}

function toDateSafe(value?: Timestamp | Date) {
  if (!value) return new Date(0)
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return new Date(0)
}

async function fetchDashboardData(): Promise<DashboardData> {
  const usersRef = collection(db, 'users')

  let usersSnapshot
  try {
    usersSnapshot = await getDocs(query(usersRef, orderBy('createdAt', 'desc')))
  } catch (err) {
    usersSnapshot = await getDocs(usersRef)
  }

  let totalUsers = 0
  let students = 0
  let teachers = 0
  let parents = 0
  let admins = 0
  let pendingTeachers = 0

  const recentActivity: ActivityItem[] = []

  usersSnapshot.forEach((docSnap) => {
    const data = docSnap.data() as FirestoreUser
    totalUsers += 1

    if (data.role === 'student') students += 1
    if (data.role === 'teacher') {
      teachers += 1
      if (data.isApproved !== true) pendingTeachers += 1
    }
    if (data.role === 'parent') parents += 1
    if (data.role === 'admin') admins += 1

    const createdAt = toDateSafe(data.createdAt)
    recentActivity.push({
      name:
        data.teacherProfile?.name ||
        data.parentProfile?.parentName ||
        data.studentProfile?.name ||
        'User',
      email: data.email || 'unknown',
      action:
        data.role === 'teacher'
          ? data.isApproved === true
            ? 'Teacher approved'
            : 'Teacher pending'
          : data.role === 'parent'
            ? 'Parent verified'
            : data.role === 'student'
              ? 'Student joined'
              : 'User joined',
      detail: createdAt.getFullYear() > 1970 ? createdAt.toDateString() : 'New user',
      // keep timestamp for sorting
      _createdAt: createdAt.getTime(),
    } as ActivityItem & { _createdAt: number })
  })

  recentActivity.sort((a, b) => (b as any)._createdAt - (a as any)._createdAt)

  const topRecent = recentActivity.slice(0, 5).map((item) => {
    const { _createdAt, ...rest } = item as any
    return rest as ActivityItem
  })

  // === Aggregated progress across all classes ===
  const classroomsSnap = await getDocs(collection(db, 'classrooms'))
  const classroomDocs = classroomsSnap.docs

  // Build maps for modules and progress per class
  const moduleMap = new Map<
    string,
    { title: string; classID: string }
  >()
  const moduleCompletionCounts = new Map<
    string,
    { completed: number; attempts: number; scores: number[]; classID: string }
  >()

  let totalStudentsAcrossClasses = 0
  let strugglingStudents = 0
  let totalModulesAcrossClasses = 0
  let totalCompletedAcrossClasses = 0
  let totalScoresAcrossModules = 0
  let completedProgressCount = 0

  for (const classDoc of classroomDocs) {
    const classID = classDoc.id
    const classData = classDoc.data() as { studentIDs?: string[] }
    const studentIDs = classData.studentIDs || []
    const studentCount = studentIDs.length
    if (studentCount === 0) {
      continue
    }
    totalStudentsAcrossClasses += studentCount

    // Fetch modules for this class
    const lessonsSnap = await getDocs(
      query(collection(db, 'lesson_modules'), where('classID', '==', classID))
    )
    const modules = lessonsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
    modules.forEach((m) => {
      moduleMap.set(m.id, { title: m.title || 'Module', classID })
    })
    const totalModulesForClass = modules.length
    totalModulesAcrossClasses += totalModulesForClass

    // Fetch progress for this class
    const progressSnap = await getDocs(
      query(collection(db, 'student_progress'), where('classID', '==', classID))
    )
    const progress = progressSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))

    // Track completion and scores per module
    progress.forEach((p) => {
      const entry = moduleCompletionCounts.get(p.moduleID) || {
        completed: 0,
        attempts: 0,
        scores: [],
        classID,
      }
      entry.attempts += 1
      if (p.status === 'completed') {
        entry.completed += 1
        totalCompletedAcrossClasses += 1
        if (typeof p.score === 'number') {
          entry.scores.push(p.score)
          totalScoresAcrossModules += p.score
          completedProgressCount += 1
        }
      }
      moduleCompletionCounts.set(p.moduleID, entry)
    })

    // Struggling students (completion rate < 50%)
    if (totalModulesForClass > 0) {
      studentIDs.forEach((studentID) => {
        const studentProgress = progress.filter((p) => p.studentID === studentID)
        const completedByStudent = studentProgress.filter((p) => p.status === 'completed').length
        const completionRate =
          totalModulesForClass > 0 ? (completedByStudent / totalModulesForClass) * 100 : 0
        if (completionRate < 50 && totalModulesForClass > 0) {
          strugglingStudents += 1
        }
      })
    }
  }

  // Build module stats
  const moduleStats: ModuleStat[] = Array.from(moduleCompletionCounts.entries()).map(
    ([moduleID, counts]) => {
      const title = moduleMap.get(moduleID)?.title || 'Module'
      const completionPercent =
        totalStudentsAcrossClasses > 0
          ? Math.round((counts.completed / totalStudentsAcrossClasses) * 100)
          : 0
      const avgScore =
        counts.scores.length > 0
          ? Math.round(
              counts.scores.reduce((sum, s) => sum + s, 0) / counts.scores.length
            )
          : 0
      return {
        name: title,
        completion: completionPercent,
        averageScore: avgScore,
      }
    }
  )

  const completionBars: ModuleCompletionBar[] = moduleStats
    .slice()
    .sort((a, b) => b.completion - a.completion)
    .slice(0, 6)
    .map((m) => ({ name: m.name, value: m.completion }))

  const topLessons = moduleStats
    .slice()
    .sort((a, b) => b.completion - a.completion)
    .slice(0, 4)
    .map((m) => ({ name: m.name, value: m.completion }))

  const weeklyActivity: WeeklyActivityPoint[] = [
    { name: 'Mon', lessonStarts: 0, lessonCompletions: 0 },
    { name: 'Tue', lessonStarts: 0, lessonCompletions: 0 },
    { name: 'Wed', lessonStarts: 0, lessonCompletions: 0 },
    { name: 'Thu', lessonStarts: 0, lessonCompletions: 0 },
    { name: 'Fri', lessonStarts: 0, lessonCompletions: 0 },
    { name: 'Sat', lessonStarts: 0, lessonCompletions: 0 },
    { name: 'Sun', lessonStarts: 0, lessonCompletions: 0 },
  ]

  return {
    summary: { totalUsers, students, teachers, parents, admins, pendingTeachers },
    moduleStats,
    weeklyActivity,
    topLessons,
    completionBars,
    strugglingStudents,
    recentActivity: topRecent,
  }
}

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    staleTime: 30 * 1000,
  })
}

