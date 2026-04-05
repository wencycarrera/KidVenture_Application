import { type LessonModule } from '../data/schema'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSubLessonContext } from './sub-lessons-provider'

type Props = {
  data: LessonModule[]
  isLoading: boolean
}

export function ActivitiesTable({ data, isLoading }: Props) {
  const { setOpen, setCurrentActivity } = useSubLessonContext()

  if (isLoading) {
    return (
      <div className='rounded-md border p-4 text-sm text-muted-foreground'>
        Loading activities...
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className='rounded-md border p-4 text-sm text-muted-foreground'>
        No activities yet for this sub-lesson.
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Sequence</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className='font-medium'>{row.title}</TableCell>
              <TableCell>
                <Badge variant='outline'>{row.activityType}</Badge>
              </TableCell>
              <TableCell>{row.subLessonOrder ?? '-'}</TableCell>
              <TableCell>{row.sequenceOrder ?? '-'}</TableCell>
              <TableCell>
                {row.createdAt instanceof Date
                  ? row.createdAt.toLocaleDateString()
                  : ''}
              </TableCell>
              <TableCell className='text-right space-x-2'>
                <Button
                  size='sm'
                  variant='destructive'
                  onClick={() => {
                    setCurrentActivity(row)
                    setOpen('delete-act')
                  }}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

