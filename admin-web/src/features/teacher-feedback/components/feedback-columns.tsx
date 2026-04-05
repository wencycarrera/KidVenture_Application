import { type ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { Badge } from '@/components/ui/badge'
import { Eye } from 'lucide-react'
import { type FeedbackDisplay } from '../data/schema'
import { formatDate, getCategoryLabel, getRatingStars } from '../data/data'

type FeedbackColumnsProps = {
  onViewDetail: (feedback: FeedbackDisplay) => void
}

export function createFeedbackColumns({
  onViewDetail,
}: FeedbackColumnsProps): ColumnDef<FeedbackDisplay>[] {
  return [
    {
      accessorKey: 'teacherName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Teacher' />
      ),
      cell: ({ row }) => {
        const name = row.original.teacherName || 'Unknown Teacher'
        const isUnknown = name.includes('Unknown Teacher') || !row.original.teacherEmail
        return (
          <div className='flex flex-col'>
            <LongText className='max-w-36'>{name}</LongText>
            {isUnknown && (
              <span className='text-xs text-muted-foreground'>
                (Teacher account may have been deleted)
              </span>
            )}
          </div>
        )
      },
      meta: { className: 'w-36' },
    },
    {
      accessorKey: 'rating',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Rating' />
      ),
      cell: ({ row }) => {
        const rating = row.getValue('rating') as number
        return (
          <div className='flex items-center gap-2'>
            <span className='text-yellow-500'>{getRatingStars(rating)}</span>
            <span className='text-sm text-muted-foreground'>({rating})</span>
          </div>
        )
      },
      sortingFn: 'basic',
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Category' />
      ),
      cell: ({ row }) => {
        const category = row.getValue('category') as string
        const variant =
          category === 'usability'
            ? 'default'
            : category === 'educational'
              ? 'secondary'
              : 'outline'
        return (
          <Badge variant={variant}>{getCategoryLabel(category)}</Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'feedbackText',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Feedback' />
      ),
      cell: ({ row }) => {
        const text = row.getValue('feedbackText') as string
        return <LongText className='max-w-64'>{text}</LongText>
      },
      meta: { className: 'w-64' },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Date' />
      ),
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as Date
        return <div className='text-sm'>{formatDate(date)}</div>
      },
      sortingFn: 'datetime',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onViewDetail(row.original)}
        >
          <Eye className='h-4 w-4' />
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]
}

