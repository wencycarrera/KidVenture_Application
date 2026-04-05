import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { lessonModuleSchema, type LessonModule } from '../data/schema'

async function fetchActivities(subLessonID: string): Promise<LessonModule[]> {
  const modulesRef = collection(db, 'lesson_modules')
  let snapshot
  try {
    snapshot = await getDocs(
      query(
        modulesRef,
        where('subLessonID', '==', subLessonID),
        orderBy('subLessonOrder', 'asc')
      )
    )
  } catch (error) {
    console.warn('orderBy failed, fetching without sort', error)
    snapshot = await getDocs(
      query(modulesRef, where('subLessonID', '==', subLessonID))
    )
  }

  const items: LessonModule[] = []
  snapshot.forEach((docSnap) => {
    try {
      const parsed = lessonModuleSchema.parse({
        id: docSnap.id,
        ...docSnap.data(),
      })
      items.push({
        ...parsed,
        createdAt:
          parsed.createdAt instanceof Date
            ? parsed.createdAt
            : parsed.createdAt.toDate?.() ?? new Date(),
      })
    } catch (err) {
      console.error('Error parsing lesson module', docSnap.id, err)
    }
  })

  return items.sort((a, b) => {
    const subOrder = (a.subLessonOrder || 0) - (b.subLessonOrder || 0)
    if (subOrder !== 0) return subOrder
    return (a.sequenceOrder || 0) - (b.sequenceOrder || 0)
  })
}

async function createActivity(
  payload: Omit<LessonModule, 'id' | 'createdAt'>
): Promise<void> {
  const modulesRef = collection(db, 'lesson_modules')
  await addDoc(modulesRef, {
    ...payload,
    createdAt: serverTimestamp(),
  })
}

async function updateActivity(
  id: string,
  payload: Partial<Omit<LessonModule, 'id' | 'createdAt'>>
): Promise<void> {
  const moduleRef = doc(db, 'lesson_modules', id)
  await updateDoc(moduleRef, {
    ...payload,
  })
}

async function deleteActivity(id: string): Promise<void> {
  const moduleRef = doc(db, 'lesson_modules', id)
  await deleteDoc(moduleRef)
}

export function useActivities(subLessonID?: string) {
  return useQuery({
    enabled: Boolean(subLessonID),
    queryKey: ['activities', subLessonID],
    queryFn: () => fetchActivities(subLessonID || ''),
  })
}

export function useCreateActivity(subLessonID?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      if (subLessonID) {
        qc.invalidateQueries({ queryKey: ['activities', subLessonID] })
      }
      toast.success('Activity created')
    },
    onError: (err) => {
      console.error(err)
      toast.error(
        err instanceof Error ? err.message : 'Failed to create activity'
      )
    },
  })
}

export function useUpdateActivity(subLessonID?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<LessonModule>
    }) => updateActivity(id, payload),
    onSuccess: () => {
      if (subLessonID) {
        qc.invalidateQueries({ queryKey: ['activities', subLessonID] })
      }
      toast.success('Activity updated')
    },
    onError: (err) => {
      console.error(err)
      toast.error(
        err instanceof Error ? err.message : 'Failed to update activity'
      )
    },
  })
}

export function useDeleteActivity(subLessonID?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      if (subLessonID) {
        qc.invalidateQueries({ queryKey: ['activities', subLessonID] })
      }
      toast.success('Activity deleted')
    },
    onError: (err) => {
      console.error(err)
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete activity'
      )
    },
  })
}

export async function hasActivityForSubLesson(subLessonID: string) {
  const modulesRef = collection(db, 'lesson_modules')
  const snapshot = await getDocs(
    query(modulesRef, where('subLessonID', '==', subLessonID))
  )
  return !snapshot.empty
}

