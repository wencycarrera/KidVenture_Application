import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { subLessonSchema, type SubLesson } from '../data/schema'
import { hasActivityForSubLesson } from './activity-service'

async function fetchSubLessons(): Promise<SubLesson[]> {
  const subLessonsRef = collection(db, 'sub_lessons')
  let snapshot
  try {
    snapshot = await getDocs(query(subLessonsRef, orderBy('createdAt', 'desc')))
  } catch (error) {
    console.warn('orderBy failed, fetching without sort', error)
    snapshot = await getDocs(subLessonsRef)
  }

  const items: SubLesson[] = []
  snapshot.forEach((docSnap) => {
    try {
      const parsed = subLessonSchema.parse({
        id: docSnap.id,
        ...docSnap.data(),
      })
      items.push({
        ...parsed,
        createdAt:
          parsed.createdAt instanceof Date
            ? parsed.createdAt
            : parsed.createdAt.toDate?.() ?? new Date(),
        updatedAt:
          parsed.updatedAt instanceof Date
            ? parsed.updatedAt
            : parsed.updatedAt.toDate?.() ?? new Date(),
      })
    } catch (err) {
      console.error('Error parsing sub-lesson', docSnap.id, err)
    }
  })

  // Stable sort by order then createdAt
  return items.sort((a, b) => {
    const orderDiff = (a.order || 0) - (b.order || 0)
    if (orderDiff !== 0) return orderDiff
    return (
      new Date(b.createdAt as Date).getTime() -
      new Date(a.createdAt as Date).getTime()
    )
  })
}

async function createSubLesson(
  payload: Omit<
    SubLesson,
    'id' | 'createdAt' | 'updatedAt'
  >
): Promise<void> {
  const subLessonsRef = collection(db, 'sub_lessons')
  await addDoc(subLessonsRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

async function updateSubLesson(
  id: string,
  payload: Partial<Omit<SubLesson, 'id' | 'createdAt'>>
): Promise<void> {
  const subLessonRef = doc(db, 'sub_lessons', id)
  await updateDoc(subLessonRef, {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

async function deleteSubLesson(id: string): Promise<void> {
  const hasActivities = await hasActivityForSubLesson(id)
  if (hasActivities) {
    throw new Error(
      'Cannot delete: sub-lesson still has activities. Delete them first.'
    )
  }
  const subLessonRef = doc(db, 'sub_lessons', id)
  await deleteDoc(subLessonRef)
}

export function useSubLessons() {
  return useQuery({
    queryKey: ['sub-lessons'],
    queryFn: fetchSubLessons,
    staleTime: 30 * 1000,
  })
}

export function useCreateSubLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSubLesson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-lessons'] })
      toast.success('Sub-lesson created')
    },
    onError: (err) => {
      console.error(err)
      toast.error(
        err instanceof Error ? err.message : 'Failed to create sub-lesson'
      )
    },
  })
}

export function useUpdateSubLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SubLesson> }) =>
      updateSubLesson(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-lessons'] })
      toast.success('Sub-lesson updated')
    },
    onError: (err) => {
      console.error(err)
      toast.error(
        err instanceof Error ? err.message : 'Failed to update sub-lesson'
      )
    },
  })
}

export function useDeleteSubLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSubLesson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-lessons'] })
      toast.success('Sub-lesson deleted')
    },
    onError: (err) => {
      console.error(err)
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete sub-lesson'
      )
    },
  })
}

