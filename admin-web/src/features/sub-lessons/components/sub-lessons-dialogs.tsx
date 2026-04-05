import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSubLessonContext } from './sub-lessons-provider'
import {
  fixedCurriculum,
  subLessonSchema,
  type SubLesson,
} from '../data/schema'
import {
  useCreateSubLesson,
  useDeleteSubLesson,
  useUpdateSubLesson,
} from '../services/sub-lesson-service'
import {
  useDeleteActivity,
} from '../services/activity-service'

type SubLessonFormValues = Omit<SubLesson, 'id' | 'createdAt' | 'updatedAt'>

function SubLessonForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: Partial<SubLessonFormValues>
  onSubmit: (values: SubLessonFormValues) => void
  submitting: boolean
}) {
  const form = useForm<SubLessonFormValues>({
    resolver: zodResolver(
      subLessonSchema.omit({ id: true, createdAt: true, updatedAt: true })
    ),
    defaultValues: {
      classID: '',
      topicCategory: fixedCurriculum[0].id,
      title: '',
      content: '',
      order: 1,
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (defaultValues) form.reset(defaultValues)
  }, [defaultValues, form])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
      <div className='grid gap-3'>
        <Label>Class ID</Label>
        <Input
          {...form.register('classID', { required: true })}
          placeholder='class_abc123'
        />
      </div>
      <div className='grid gap-3'>
        <Label>Lesson</Label>
        <Select
          value={form.watch('topicCategory')}
          onValueChange={(val) => form.setValue('topicCategory', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder='Choose lesson' />
          </SelectTrigger>
          <SelectContent>
            {fixedCurriculum.map((lesson) => (
              <SelectItem key={lesson.id} value={lesson.id}>
                {lesson.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='grid gap-3'>
        <Label>Title</Label>
        <Input {...form.register('title', { required: true })} />
      </div>
      <div className='grid gap-3'>
        <Label>Content</Label>
        <Textarea
          rows={4}
          {...form.register('content', { required: true })}
          placeholder='Kids can read / listen text'
        />
      </div>
      <div className='grid gap-3'>
        <Label>Order</Label>
        <Input
          type='number'
          {...form.register('order', { valueAsNumber: true })}
          min={1}
        />
      </div>
      <Button type='submit' disabled={submitting} className='w-full'>
        {submitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}

export function SubLessonsDialogs() {
  const {
    open,
    setOpen,
    currentSubLesson,
    setCurrentSubLesson,
    currentActivity,
    setCurrentActivity,
  } = useSubLessonContext()

  const createSub = useCreateSubLesson()
  const updateSub = useUpdateSubLesson()
  const deleteSub = useDeleteSubLesson()

  const deleteAct = useDeleteActivity(currentSubLesson?.id)

  return (
    <>
    
      <Dialog open={open === 'edit-sub'} onOpenChange={() => setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-Lesson</DialogTitle>
          </DialogHeader>
          <SubLessonForm
            defaultValues={currentSubLesson ?? undefined}
            submitting={updateSub.isPending}
            onSubmit={(values) => {
              if (!currentSubLesson) return
              updateSub.mutate(
                { id: currentSubLesson.id, payload: values },
                { onSuccess: () => setOpen(null) }
              )
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={open === 'delete-sub'} onOpenChange={() => setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sub-Lesson</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>
            {currentSubLesson?.title}
          </p>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                if (!currentSubLesson) return
                deleteSub.mutate(currentSubLesson.id, {
                  onSuccess: () => {
                    setCurrentSubLesson(null)
                    setOpen(null)
                  },
                })
              }}
              disabled={deleteSub.isPending}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open === 'delete-act'} onOpenChange={() => setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>
            {currentActivity?.title}
          </p>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                if (!currentActivity) return
                deleteAct.mutate(currentActivity.id, {
                  onSuccess: () => {
                    setCurrentActivity(null)
                    setOpen(null)
                  },
                })
              }}
              disabled={deleteAct.isPending}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

