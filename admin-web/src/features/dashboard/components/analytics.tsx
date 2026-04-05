import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  type ModuleCompletionBar,
  type ModuleStat,
  type WeeklyActivityPoint,
} from '../services/dashboard-service'
import { AnalyticsChart } from './analytics-chart'

type Props = {
  weeklyActivity: WeeklyActivityPoint[]
  moduleStats: ModuleStat[]
  topLessons: { name: string; value: number }[]
  completionBars: ModuleCompletionBar[]
  strugglingStudents: number
}

export function Analytics({
  weeklyActivity,
  moduleStats,
  topLessons,
  completionBars,
  strugglingStudents,
}: Props) {
  const avgCompletion =
    moduleStats.length > 0
      ? Math.round(
          moduleStats.reduce((sum, m) => sum + (m.completion || 0), 0) /
            moduleStats.length
        )
      : 0
  const avgScore =
    moduleStats.length > 0
      ? Math.round(
          moduleStats.reduce((sum, m) => sum + (m.averageScore || 0), 0) /
            moduleStats.length
        )
      : 0

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Engagement Overview</CardTitle>
          <CardDescription>Weekly lessons started vs completed</CardDescription>
        </CardHeader>
        <CardContent className='px-6'>
          <AnalyticsChart data={weeklyActivity} />
        </CardContent>
      </Card>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg. Completion Rate
            </CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='text-muted-foreground h-4 w-4'
            >
              <path d='M3 3v18h18' />
              <path d='M7 15l4-4 4 4 4-6' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{avgCompletion}%</div>
            <p className='text-muted-foreground text-xs'>vs all modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg. Score
            </CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='text-muted-foreground h-4 w-4'
            >
              <circle cx='12' cy='7' r='4' />
              <path d='M6 21v-2a6 6 0 0 1 12 0v2' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{avgScore}</div>
            <p className='text-muted-foreground text-xs'>avg across modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Classes</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='text-muted-foreground h-4 w-4'
            >
              <path d='M3 12h6l3 6 3-6h6' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>--</div>
            <p className='text-muted-foreground text-xs'>Connect classes to show</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Struggling Students
            </CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='text-muted-foreground h-4 w-4'
            >
              <circle cx='12' cy='12' r='10' />
              <path d='M12 6v6l4 2' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{strugglingStudents}</div>
            <p className='text-muted-foreground text-xs'>Completion rate &lt; 50%</p>
          </CardContent>
        </Card>
      </div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
        <Card className='col-span-1 lg:col-span-4'>
          <CardHeader>
            <CardTitle>Top Lessons by Completion</CardTitle>
            <CardDescription>Highlights from current modules</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={topLessons}
              barClass='bg-primary'
              valueFormatter={(n) => `${n}%`}
            />
          </CardContent>
        </Card>
        <Card className='col-span-1 lg:col-span-3'>
          <CardHeader>
            <CardTitle>Module Completion</CardTitle>
            <CardDescription>Completion rate across top modules</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={completionBars}
              barClass='bg-muted-foreground'
              valueFormatter={(n) => `${n}%`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SimpleBarList({
  items,
  valueFormatter,
  barClass,
}: {
  items: { name: string; value: number }[]
  valueFormatter: (n: number) => string
  barClass: string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className='space-y-3'>
      {items.map((i) => {
        const width = `${Math.round((i.value / max) * 100)}%`
        return (
          <li key={i.name} className='flex items-center justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='text-muted-foreground mb-1 truncate text-xs'>
                {i.name}
              </div>
              <div className='bg-muted h-2.5 w-full rounded-full'>
                <div
                  className={`h-2.5 rounded-full ${barClass}`}
                  style={{ width }}
                />
              </div>
            </div>
            <div className='ps-2 text-xs font-medium tabular-nums'>
              {valueFormatter(i.value)}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
