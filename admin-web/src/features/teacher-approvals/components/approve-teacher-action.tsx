import { type Row } from '@tanstack/react-table'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type TeacherDisplay } from '../data/schema'
import { useTeacherApprovals } from './teacher-approvals-provider'

type ApproveTeacherActionProps = {
  row: Row<TeacherDisplay>
}

export function ApproveTeacherAction({ row }: ApproveTeacherActionProps) {
  const { setOpen, setCurrentRow } = useTeacherApprovals()

  return (
    <Button
      variant='default'
      size='sm'
      onClick={() => {
        setCurrentRow(row.original)
        setOpen('approve')
      }}
      className='space-x-1'
    >
      <span>Approve</span>
      <CheckCircle2 size={16} />
    </Button>
  )
}

