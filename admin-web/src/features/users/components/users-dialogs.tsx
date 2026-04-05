import { UsersActionDialog } from './users-action-dialog'
import { UsersDeleteDialog } from './users-delete-dialog'
import { UsersStudentDetailDialog } from './users-student-detail-dialog'
import { UsersCreateAdminDialog } from './users-create-admin-dialog'
import { UsersCreateTeacherDialog } from './users-create-teacher-dialog'
import { UsersCreateStudentDialog } from './users-create-student-dialog'
import { useUsers } from './users-provider'

export function UsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers()
  return (
    <>
      {currentRow && (
        <>
          <UsersActionDialog
            key={`user-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <UsersDeleteDialog
            key={`user-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <UsersStudentDetailDialog
            key={`user-student-detail-${currentRow.id}`}
            open={open === 'student-detail'}
            onOpenChange={() => {
              setOpen('student-detail')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
      <UsersCreateAdminDialog
        open={open === 'create-admin'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen('create-admin')
          }
        }}
      />
      <UsersCreateTeacherDialog
        open={open === 'create-teacher'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen('create-teacher')
          }
        }}
      />
      <UsersCreateStudentDialog
        open={open === 'create-student'}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOpen('create-student')
          }
        }}
      />
    </>
  )
}
