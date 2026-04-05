import { z } from 'zod'
import { Timestamp } from 'firebase/firestore'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('teacher'),
  z.literal('parent'),
  z.literal('admin'),
  z.literal('student'),
])

// Student profile schema matching mobile app structure
const studentProfileSchema = z.object({
  name: z.string(),
  birthday: z.any().optional(), // Timestamp from Firestore
  gender: z.enum(['male', 'female', 'other']).optional(),
  points: z.number().optional(),
  level: z.number().optional(),
  parentInfo: z.object({
    parentName: z.string(),
    parentBirthday: z.any().optional(), // Timestamp from Firestore
    parentEmail: z.string(),
  }).optional(),
  joinedClassID: z.string().optional(),
}).optional()

const userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  status: userStatusSchema,
  role: userRoleSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  studentProfile: studentProfileSchema,
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
