import { createFileRoute } from '@tanstack/react-router'
import { TeacherApprovals } from '@/features/teacher-approvals'

export const Route = createFileRoute('/_authenticated/teacher-approvals/')({
  component: TeacherApprovals,
})

