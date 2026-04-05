import { Bar, BarChart, Legend, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { type ModuleStat } from '../services/dashboard-service'

export function Overview({ data }: { data: ModuleStat[] }) {
  if (!data || data.length === 0) {
    return (
      <div className='text-muted-foreground text-sm py-6 px-4'>
        No module stats yet.
      </div>
    )
  }
  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          direction='ltr'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Legend />
        <Bar
          dataKey='completion'
          name='Completion'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
        <Bar
          dataKey='averageScore'
          name='Avg. Score'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-muted-foreground'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
