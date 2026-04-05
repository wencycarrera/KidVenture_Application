import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type Classroom = {
  id: string
  className?: string
  classCode?: string
}

async function fetchClasses(): Promise<Classroom[]> {
  const classesRef = collection(db, 'classrooms')
  const snapshot = await getDocs(classesRef)

  const classes: Classroom[] = []
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as Partial<Classroom>
    classes.push({
      id: docSnap.id,
      className: data.className,
      classCode: data.classCode,
    })
  })

  return classes
}

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
    staleTime: 5 * 60 * 1000,
  })
}

