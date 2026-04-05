import { z } from 'zod'
import { Timestamp } from 'firebase/firestore'

// Teacher Profile Schema
const teacherProfileSchema = z.object({
  name: z.string(),
  birthday: z.instanceof(Timestamp).optional(),
})

// Teacher User Schema (matching Firestore structure)
export const teacherSchema = z.object({
  userID: z.string(), // Document ID
  role: z.literal('teacher'),
  email: z.string().email(),
  isApproved: z.boolean(),
  createdAt: z.union([z.instanceof(Timestamp), z.date()]),
  updatedAt: z.union([z.instanceof(Timestamp), z.date()]).optional(),
  teacherProfile: teacherProfileSchema,
})

export type Teacher = z.infer<typeof teacherSchema>

// Helper type for display purposes (converted timestamps)
export type TeacherDisplay = Omit<Teacher, 'createdAt' | 'updatedAt'> & {
  createdAt: Date
  updatedAt?: Date
}

