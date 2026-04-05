import { useMemo } from 'react'
import { type SubLesson } from '../data/schema'
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
import { cn } from '@/lib/utils'
import { useSubLessonContext } from './sub-lessons-provider'
import { useClasses } from '../services/class-service'

type Props = {
  data: SubLesson[]
  isLoading: boolean
  emptyMessage?: string
}

export function SubLessonsTable({ data, isLoading, emptyMessage }: Props) {
  const { setOpen, setCurrentSubLesson, currentSubLesson, setCurrentActivity } =
    useSubLessonContext()
  const { data: classes, isLoading: classesLoading } = useClasses()

  const classNameById = useMemo(() => {
    const map: Record<string, string> = {}
    classes?.forEach((cls) => {
      const label = cls.className || cls.classCode || cls.id
      map[cls.id] = label
    })
    return map
  }, [classes])

  if (isLoading) {
    return (
      <div className='rounded-md border p-4 text-sm text-muted-foreground'>
        Loading sub-lessons...
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className='rounded-md border p-4 text-sm text-muted-foreground'>
        {emptyMessage ?? 'No sub-lessons yet. Add one to get started.'}
      </div>
    )
  }

  return (
    <div className='overflow-hidden rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Lesson</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const isSelected = currentSubLesson?.id === row.id
            return (
              <TableRow
                key={row.id}
                className={cn('cursor-pointer', isSelected && 'bg-muted/50')}
                onClick={() => {
                  setCurrentSubLesson(row)
                  setCurrentActivity(null)
                }}
              >
                <TableCell className='font-medium'>{row.title}</TableCell>
                <TableCell>{row.topicCategory}</TableCell>
                <TableCell>
                  <Badge variant='secondary'>
                    {classesLoading ? 'Loading...' : classNameById[row.classID] ?? row.classID}
                  </Badge>
                </TableCell>
                <TableCell>{row.order ?? '-'}</TableCell>
                <TableCell>
                  {row.updatedAt instanceof Date
                    ? row.updatedAt.toLocaleDateString()
                    : ''}
                </TableCell>
                <TableCell className='text-right space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentSubLesson(row)
                      setOpen('edit-sub')
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentSubLesson(row)
                      setOpen('delete-sub')
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

