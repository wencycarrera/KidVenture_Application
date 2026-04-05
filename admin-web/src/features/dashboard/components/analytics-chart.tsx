import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { type WeeklyActivityPoint } from '../services/dashboard-service'

export function AnalyticsChart({ data }: { data: WeeklyActivityPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className='text-muted-foreground text-sm py-6 px-4'>
        No activity data yet.
      </div>
    )
  }
  return (
    <ResponsiveContainer width='100%' height={300}>
      <AreaChart data={data}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Area
          type='monotone'
          dataKey='lessonStarts'
          name='Lessons started'
          stroke='currentColor'
          className='text-primary'
          fill='currentColor'
          fillOpacity={0.15}
        />
        <Area
          type='monotone'
          dataKey='lessonCompletions'
          name='Lessons completed'
          stroke='currentColor'
          className='text-muted-foreground'
          fill='currentColor'
          fillOpacity={0.1}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
