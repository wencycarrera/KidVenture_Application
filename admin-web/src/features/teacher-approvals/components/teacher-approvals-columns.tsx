import { type ColumnDef, type Row } from '@tanstack/react-table'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { formatDate } from '../data/data'
import { type TeacherDisplay } from '../data/schema'
import { ApproveTeacherAction } from './approve-teacher-action'

export const teacherApprovalsColumns: ColumnDef<TeacherDisplay>[] = [
  {
    accessorKey: 'teacherProfile.name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const name = row.original.teacherProfile.name
      return <LongText className='max-w-36'>{name}</LongText>
    },
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='w-fit ps-2 text-nowrap'>{row.getValue('email')}</div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Registration Date' />
    ),
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date
      return <div>{formatDate(date)}</div>
    },
    sortingFn: 'datetime',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ApproveTeacherAction row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
]

