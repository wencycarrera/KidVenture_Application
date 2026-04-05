import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { type FeedbackStats } from '../data/schema'
import { formatDateShort, getCategoryLabel, getRatingStars } from '../data/data'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Star, TrendingUp } from 'lucide-react'

type FeedbackDashboardProps = {
  stats: FeedbackStats | undefined
  isLoading: boolean
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export function FeedbackDashboard({
  stats,
  isLoading,
}: FeedbackDashboardProps) {
  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-8 w-16' />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className='grid gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-64' />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-64' />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        <MessageSquare className='h-12 w-12 mx-auto mb-4 opacity-50' />
        <p>No feedbacks available yet.</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Summary Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Feedbacks</CardTitle>
            <MessageSquare className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
            <p className='text-xs text-muted-foreground'>All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Average Rating</CardTitle>
            <Star className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats.averageRating.toFixed(1)}
            </div>
            <p className='text-xs text-muted-foreground'>
              {getRatingStars(Math.round(stats.averageRating))} out of 5
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>This Month</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats.trends[stats.trends.length - 1]?.count || 0}
            </div>
            <p className='text-xs text-muted-foreground'>New feedbacks</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className='grid gap-4 lg:grid-cols-2'>
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Feedback ratings breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={stats.ratingDistribution}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='rating' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey='count' fill='#8884d8' name='Feedbacks' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Feedback by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryBreakdown}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ category, percent }) =>
                    `${getCategoryLabel(category)} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='count'
                >
                  {stats.categoryBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      {stats.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback Trends</CardTitle>
            <CardDescription>Feedbacks over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={stats.trends}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='period' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='count'
                  stroke='#8884d8'
                  name='Feedbacks'
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Feedbacks */}
      {stats.recentFeedbacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedbacks</CardTitle>
            <CardDescription>Latest 10 feedbacks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {stats.recentFeedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className='flex items-start justify-between border-b pb-4 last:border-0 last:pb-0'
                >
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium text-sm'>
                        {feedback.teacherName || 'Unknown Teacher'}
                      </span>
                      <Badge variant='outline' className='text-xs'>
                        {getCategoryLabel(feedback.category)}
                      </Badge>
                      <span className='text-yellow-500 text-xs'>
                        {getRatingStars(feedback.rating)}
                      </span>
                    </div>
                    <p className='text-sm text-muted-foreground line-clamp-2'>
                      {feedback.feedbackText}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {formatDateShort(feedback.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

