import { createFileRoute } from '@tanstack/react-router'
import { StudentActivityFeature } from '@/features/student-activity'

export const Route = createFileRoute('/_authenticated/reports/student-activity')({
  component: StudentActivityFeature,
})

