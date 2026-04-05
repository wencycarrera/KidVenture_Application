import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUsers } from './users-provider'

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers()

  const handleOpen = (dialog: Parameters<typeof setOpen>[0]) => {
    setOpen(dialog)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size='sm' className='h-8 gap-1'>
          <UserPlus className='h-3.5 w-3.5' />
          <span className='sr-only sm:not-sr-only sm:whitespace-nowrap'>
            Add User
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' sideOffset={6}>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            handleOpen('create-admin')
          }}
        >
          Add Admin
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            handleOpen('create-teacher')
          }}
        >
          Add Teacher
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            handleOpen('create-student')
          }}
        >
          Add Student
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
