import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type TeacherDisplay } from '../data/schema'

type TeacherApprovalsDialogType = 'approve'

type TeacherApprovalsContextType = {
  open: TeacherApprovalsDialogType | null
  setOpen: (str: TeacherApprovalsDialogType | null) => void
  currentRow: TeacherDisplay | null
  setCurrentRow: React.Dispatch<React.SetStateAction<TeacherDisplay | null>>
}

const TeacherApprovalsContext =
  React.createContext<TeacherApprovalsContextType | null>(null)

export function TeacherApprovalsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<TeacherApprovalsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<TeacherDisplay | null>(null)

  return (
    <TeacherApprovalsContext.Provider
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </TeacherApprovalsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTeacherApprovals = () => {
  const context = React.useContext(TeacherApprovalsContext)

  if (!context) {
    throw new Error(
      'useTeacherApprovals has to be used within <TeacherApprovalsProvider>'
    )
  }

  return context
}

