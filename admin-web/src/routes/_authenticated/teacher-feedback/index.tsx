import { createFileRoute } from '@tanstack/react-router'
import { TeacherFeedback } from '@/features/teacher-feedback'

export const Route = createFileRoute('/_authenticated/teacher-feedback/')({
  component: TeacherFeedback,
})

