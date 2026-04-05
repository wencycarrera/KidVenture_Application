import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { StudentActivityRow } from '../types'
import { formatSeconds } from '../utils/formatters'

type Props = {
  student?: StudentActivityRow | null
  classNameById?: Record<string, string>
  moduleTitleById?: Record<string, string>
  showLoadingLabels?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActivityDetailDialog({
  student,
  classNameById = {},
  moduleTitleById = {},
  showLoadingLabels = false,
  open,
  onOpenChange,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Student activity</DialogTitle>
          <p className='text-muted-foreground text-sm'>
            {student?.studentName ?? 'Select a student to view details'}
          </p>
        </DialogHeader>

        {student ? (
          <div className='space-y-4'>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              <Metric
                label='Class'
                value={
                  showLoadingLabels
                    ? 'Loading...'
                    : classNameById[student.classID ?? ''] ?? student.classID ?? '—'
                }
              />
              <Metric
                label='Avg. Score'
                value={`${student.averageScore.toFixed(1)}%`}
              />
              <Metric
                label='Completion'
                value={`${student.completionRate.toFixed(0)}% (${student.completedModules}/${student.totalModules || student.completedModules})`}
              />
              <Metric
                label='Activities'
                value={`${student.activityCount}`}
              />
              <Metric
                label='Total time'
                value={formatSeconds(student.totalTimeSpent)}
              />
              <Metric
                label='Last active'
                value={
                  student.lastActivity
                    ? student.lastActivity.toLocaleString()
                    : '—'
                }
              />
            </div>

            <Separator />
            <h4 className='text-sm font-semibold text-foreground'>
              Recent module attempts
            </h4>
            <ScrollArea className='h-64'>
              <div className='space-y-3 pe-2'>
                {student.progress
                  .slice()
                  .sort((a, b) => {
                    const aTime = a.lastAttemptAt?.getTime() ?? 0
                    const bTime = b.lastAttemptAt?.getTime() ?? 0
                    return bTime - aTime
                  })
                  .slice(0, 12)
                  .map((item) => (
                    <div
                      key={`${item.moduleID}-${item.lastAttemptAt?.toISOString() ?? ''}`}
                      className='rounded-md border p-3'
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div>
                          <p className='font-semibold'>
                            {moduleTitleById[item.moduleID] || item.lessonTitle || item.moduleID}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            {item.topicCategory || '—'}
                          </p>
                        </div>
                        <Badge variant='secondary'>
                          {item.score.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
                        <span>Status: {item.status}</span>
                        <span>Attempts: {item.attempts}</span>
                        <span>Time: {formatSeconds(item.timeSpent)}</span>
                        <span>Stars: {item.starsEarned}</span>
                        <span>
                          Last:{' '}
                          {item.lastAttemptAt
                            ? item.lastAttemptAt.toLocaleString()
                            : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <p className='text-muted-foreground text-sm'>No student selected.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-lg border bg-muted/40 px-3 py-2'>
      <p className='text-muted-foreground text-xs uppercase tracking-wide'>
        {label}
      </p>
      <p className='text-foreground text-sm font-semibold'>{value}</p>
    </div>
  )
}


