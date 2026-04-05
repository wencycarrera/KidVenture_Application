import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { type FeedbackDisplay } from '../data/schema'
import { formatDate, getCategoryLabel, getRatingStars } from '../data/data'

type FeedbackDetailDialogProps = {
  feedback: FeedbackDisplay | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDetailDialog({
  feedback,
  open,
  onOpenChange,
}: FeedbackDetailDialogProps) {
  if (!feedback) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Feedback Details</DialogTitle>
          <DialogDescription>View complete feedback information</DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Teacher</p>
              <p className='text-sm font-semibold'>
                {feedback.teacherName || 'Unknown Teacher'}
              </p>
              {feedback.teacherEmail && (
                <p className='text-xs text-muted-foreground'>
                  {feedback.teacherEmail}
                </p>
              )}
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Date</p>
              <p className='text-sm'>{formatDate(feedback.createdAt)}</p>
            </div>
          </div>
          <Separator />
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Rating</p>
              <div className='flex items-center gap-2 mt-1'>
                <span className='text-yellow-500 text-lg'>
                  {getRatingStars(feedback.rating)}
                </span>
                <span className='text-sm text-muted-foreground'>
                  ({feedback.rating} out of 5)
                </span>
              </div>
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Category</p>
              <Badge className='mt-1' variant='secondary'>
                {getCategoryLabel(feedback.category)}
              </Badge>
            </div>
          </div>
          <Separator />
          <div>
            <p className='text-sm font-medium text-muted-foreground mb-2'>
              Feedback Text
            </p>
            <div className='rounded-md border p-4 bg-muted/50'>
              <p className='text-sm whitespace-pre-wrap'>{feedback.feedbackText}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

