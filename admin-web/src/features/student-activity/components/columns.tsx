import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/data-table'
import { formatDistanceToNow } from 'date-fns'
import { StudentActivityRow } from '../types'
import { formatSeconds } from '../utils/formatters'

export type ColumnClickHandlers = {
  onView: (row: StudentActivityRow) => void
}

export function getColumns(handlers: ColumnClickHandlers): ColumnDef<StudentActivityRow>[] {
  return [
    {
      accessorKey: 'studentName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Student' />
      ),
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <span className='font-medium text-foreground'>{row.original.studentName}</span>
          {row.original.classID ? (
            <span className='text-muted-foreground text-xs'>
              Class: {row.original.classID}
            </span>
          ) : null}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'averageScore',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Avg. Score' />
      ),
      cell: ({ row }) => {
        const score = row.original.averageScore || 0
        const intent =
          score >= 85 ? 'success' : score >= 70 ? 'secondary' : 'destructive'
        return (
          <Badge variant='outline' className='justify-center px-2 py-1'>
            <span className='font-semibold'>{score.toFixed(1)}%</span>
            <span className='text-muted-foreground ms-1 text-[11px]'>
              {intent === 'success'
                ? 'Great'
                : intent === 'secondary'
                  ? 'On track'
                  : 'Needs help'}
            </span>
          </Badge>
        )
      },
      enableSorting: true,
      meta: { className: 'w-[140px]' },
    },
    {
      accessorKey: 'completionRate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Completion' />
      ),
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <div className='h-2 w-16 overflow-hidden rounded-full bg-muted'>
            <div
              className='h-full rounded-full bg-primary'
              style={{ width: `${Math.min(row.original.completionRate, 100)}%` }}
            />
          </div>
          <span className='text-sm font-medium'>
            {row.original.completionRate.toFixed(0)}%
          </span>
        </div>
      ),
      enableSorting: true,
      meta: { className: 'w-[140px]' },
    },
    {
      accessorKey: 'totalTimeSpent',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Total Time' />
      ),
      cell: ({ row }) => (
        <span className='text-sm text-muted-foreground'>
          {formatSeconds(row.original.totalTimeSpent)}
        </span>
      ),
      meta: { className: 'w-[120px]' },
    },
    {
      accessorKey: 'activityCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Activities' />
      ),
      cell: ({ row }) => (
        <span className='text-sm font-medium'>{row.original.activityCount}</span>
      ),
      meta: { className: 'w-[100px]' },
    },
    {
      accessorKey: 'lastActivity',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Last Active' />
      ),
      cell: ({ row }) => {
        const last = row.original.lastActivity
        return (
          <span className='text-sm text-muted-foreground'>
            {last ? formatDistanceToNow(last, { addSuffix: true }) : '—'}
          </span>
        )
      },
      meta: { className: 'w-[140px]' },
    },
    {
      id: 'actions',
      header: () => <span className='text-xs uppercase tracking-wide'>Actions</span>,
      cell: ({ row }) => (
        <Button size='sm' variant='outline' onClick={() => handlers.onView(row.original)}>
          View
        </Button>
      ),
      meta: { className: 'w-[90px]' },
    },
  ]
}





