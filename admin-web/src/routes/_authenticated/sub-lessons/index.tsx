import { createFileRoute } from '@tanstack/react-router'
import { SubLessonsFeature } from '@/features/sub-lessons'

export const Route = createFileRoute('/_authenticated/sub-lessons/')({
  component: SubLessonsFeature,
})
