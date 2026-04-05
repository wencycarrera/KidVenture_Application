import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTeacherApprovals } from './teacher-approvals-provider'
import { useApproveTeacher } from '../services/teacher-service'

export function ApproveTeacherDialog() {
  const { open, setOpen, currentRow } = useTeacherApprovals()
  const approveTeacher = useApproveTeacher()

  const handleApprove = () => {
    if (currentRow) {
      approveTeacher.mutate(currentRow.userID, {
        onSuccess: () => {
          setOpen(null)
        },
      })
    }
  }

  return (
    <AlertDialog open={open === 'approve'} onOpenChange={(isOpen) => setOpen(isOpen ? 'approve' : null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve Teacher</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to approve{' '}
            <strong>{currentRow?.teacherProfile.name}</strong> (
            {currentRow?.email})? This will grant them access to the teacher
            dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={approveTeacher.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleApprove}
            disabled={approveTeacher.isPending}
          >
            {approveTeacher.isPending ? 'Approving...' : 'Approve'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

