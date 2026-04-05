import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Trash2, UserPen, Eye, RotateCw, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type User } from '../data/schema'
import { useUsers } from './users-provider'
import {
  useResetUserPassword,
  useToggleUserStatus,
} from '../services/user-service'

type DataTableRowActionsProps = {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const [confirm, setConfirm] = useState<'reset' | 'status' | null>(null)
  const { setOpen, setCurrentRow } = useUsers()
  const isStudent = row.original.role === 'student'
  const resetPassword = useResetUserPassword()
  const toggleStatus = useToggleUserStatus()

  const handleResetPassword = () => {
    setConfirm('reset')
  }

  const handleToggleStatus = () => {
    setConfirm('status')
  }
  
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          {isStudent && (
            <>
              <DropdownMenuItem
                onClick={() => {
                  setCurrentRow(row.original)
                  setOpen('student-detail')
                }}
              >
                View Details
                <DropdownMenuShortcut>
                  <Eye size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={handleResetPassword}
            disabled={resetPassword.isPending}
          >
            Reset password
            <DropdownMenuShortcut>
              <RotateCw size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleToggleStatus}
            disabled={toggleStatus.isPending}
          >
            {row.original.status === 'inactive' ? 'Activate' : 'Deactivate'}
            <DropdownMenuShortcut>
              <Power size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('edit')
            }}
          >
            Edit
            <DropdownMenuShortcut>
              <UserPen size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('delete')
            }}
            className='text-red-500!'
          >
            Delete
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirm === 'reset'}
        onOpenChange={(open) => setConfirm(open ? 'reset' : null)}
        handleConfirm={() => {
          resetPassword.mutate(row.original.email, {
            onSuccess: () => setConfirm(null),
          })
        }}
        isLoading={resetPassword.isPending}
        title='Send reset email'
        desc={
          <>Send a password reset email to <strong>{row.original.email}</strong>?</>
        }
        confirmText={resetPassword.isPending ? 'Sending...' : 'Send email'}
      />

      <ConfirmDialog
        open={confirm === 'status'}
        onOpenChange={(open) => setConfirm(open ? 'status' : null)}
        handleConfirm={() => {
          const nextStatus =
            row.original.status === 'inactive' ? 'active' : 'inactive'
          toggleStatus.mutate(
            { userID: row.original.id, nextStatus },
            {
              onSuccess: () => setConfirm(null),
            }
          )
        }}
        isLoading={toggleStatus.isPending}
        title={
          row.original.status === 'inactive' ? 'Activate account' : 'Deactivate account'
        }
        desc={
          <>
            {row.original.status === 'inactive'
              ? 'Activate this account and allow sign-in?'
              : 'Deactivate this account and prevent sign-in?'}
          </>
        }
        confirmText={toggleStatus.isPending ? 'Updating...' : 'Confirm'}
      />
    </>
  )
}
