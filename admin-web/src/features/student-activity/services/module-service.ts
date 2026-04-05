import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type ModuleInfo = {
  id: string
  title?: string
  topicCategory?: string
}

async function fetchModules(): Promise<ModuleInfo[]> {
  const modulesRef = collection(db, 'lesson_modules')
  const snapshot = await getDocs(modulesRef)

  const modules: ModuleInfo[] = []
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as Partial<ModuleInfo>
    modules.push({
      id: docSnap.id,
      title: data.title,
      topicCategory: data.topicCategory,
    })
  })

  return modules
}

export function useModules() {
  return useQuery({
    queryKey: ['modules'],
    queryFn: fetchModules,
    staleTime: 5 * 60 * 1000,
  })
}

