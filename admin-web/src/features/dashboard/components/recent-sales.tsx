import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type ActivityItem } from '../services/dashboard-service'

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className='text-muted-foreground text-sm'>
        No recent activity yet.
      </div>
    )
  }
  return (
    <div className='space-y-6'>
      {items.map((item) => {
        const initials =
          item.name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2) || 'NV'
        return (
          <div key={`${item.email}-${item.action}`} className='flex items-center gap-4'>
            <Avatar className='h-9 w-9'>
              <AvatarImage src='/avatars/01.png' alt={item.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className='flex flex-1 flex-wrap items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-sm leading-none font-medium'>{item.name}</p>
                <p className='text-muted-foreground text-sm'>{item.email}</p>
                <p className='text-muted-foreground text-xs'>{item.detail}</p>
              </div>
              <div className='text-right text-sm font-medium text-primary'>
                {item.action}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
