import { z } from 'zod'
import { Timestamp } from 'firebase/firestore'

export const activityTypes = [
  'drag_drop',
  'ordering',
  'quiz',
  'number_line',
  'place_value',
  'comparison',
  'visual_counting',
  'sequential_counting',
  'ordinal_position',
  'matching',
  'word_problem',
  'demonstration',
] as const

export const subLessonSchema = z.object({
  id: z.string(),
  classID: z.string(),
  topicCategory: z.string(), // e.g., lesson_01
  title: z.string(),
  content: z.string(),
  order: z.number().optional().default(1),
  createdAt: z.union([z.instanceof(Timestamp), z.date()]),
  updatedAt: z.union([z.instanceof(Timestamp), z.date()]),
})

export type SubLesson = z.infer<typeof subLessonSchema>

export const lessonModuleSchema = z.object({
  id: z.string(),
  classID: z.string(),
  topicCategory: z.string(),
  title: z.string(),
  sequenceOrder: z.number().optional().default(1),
  subLessonID: z.string().optional(),
  subLessonOrder: z.number().optional(),
  activityType: z.enum(activityTypes),
  data: z.any().optional(),
  createdAt: z.union([z.instanceof(Timestamp), z.date()]),
})

export type LessonModule = z.infer<typeof lessonModuleSchema>

export const fixedCurriculum = [
  { id: 'lesson_01', title: 'Lesson 1: Numbers 0–20' },
  { id: 'lesson_02', title: 'Lesson 2: Numbers 21–100' },
  { id: 'lesson_03', title: 'Lesson 3: Comparing Numbers' },
  { id: 'lesson_04', title: 'Lesson 4: Place Value' },
  { id: 'lesson_05', title: 'Lesson 5: Ordinal & Money' },
  { id: 'lesson_06', title: 'Lesson 6: Addition (Up to 20)' },
  { id: 'lesson_07', title: 'Lesson 7: Subtraction (Up to 20)' },
  { id: 'lesson_08', title: 'Lesson 8: Word Problems' },
  { id: 'lesson_09', title: 'Lesson 9: Shapes & Patterns' },
  { id: 'lesson_10', title: 'Lesson 10: Measurement' },
] as const

export type FixedLessonId = (typeof fixedCurriculum)[number]['id']

