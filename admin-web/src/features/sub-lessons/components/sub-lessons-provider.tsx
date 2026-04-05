import { createContext, useContext, useState, type ReactNode } from 'react'
import { type LessonModule, type SubLesson } from '../data/schema'

type DialogType =
  | 'create-sub'
  | 'edit-sub'
  | 'delete-sub'
  | 'delete-act'
  | null

type SubLessonContextValue = {
  open: DialogType
  setOpen: (dialog: DialogType) => void
  currentSubLesson: SubLesson | null
  setCurrentSubLesson: (sub: SubLesson | null) => void
  currentActivity: LessonModule | null
  setCurrentActivity: (activity: LessonModule | null) => void
}

const SubLessonContext = createContext<SubLessonContextValue | undefined>(
  undefined
)

export function SubLessonsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<DialogType>(null)
  const [currentSubLesson, setCurrentSubLesson] = useState<SubLesson | null>(
    null
  )
  const [currentActivity, setCurrentActivity] = useState<LessonModule | null>(
    null
  )

  return (
    <SubLessonContext.Provider
      value={{
        open,
        setOpen,
        currentSubLesson,
        setCurrentSubLesson,
        currentActivity,
        setCurrentActivity,
      }}
    >
      {children}
    </SubLessonContext.Provider>
  )
}

export function useSubLessonContext() {
  const ctx = useContext(SubLessonContext)
  if (!ctx) throw new Error('useSubLessonContext must be used within provider')
  return ctx
}

