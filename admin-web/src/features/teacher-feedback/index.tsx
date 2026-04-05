import { useState, useMemo } from 'react'
import { FileDown, FileSpreadsheet, MessageSquare } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFeedbacks, useFeedbackStats } from './services/feedback-service'
import { FeedbackDashboard } from './components/feedback-dashboard'
import { FeedbackTable } from './components/feedback-table'
import { exportToCsv, exportToPdf } from './utils/export-feedback'
import { getCategoryLabel } from './data/data'

export function TeacherFeedback() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')

  const { data: feedbacks, isLoading } = useFeedbacks()
  const { data: stats, isLoading: statsLoading } = useFeedbackStats()

  // Filter feedbacks
  const filteredFeedbacks = useMemo(() => {
    if (!feedbacks) return []

    return feedbacks.filter((feedback) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          feedback.teacherName?.toLowerCase().includes(searchLower) ||
          feedback.feedbackText.toLowerCase().includes(searchLower) ||
          feedback.teacherEmail?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Category filter
      if (categoryFilter !== 'all') {
        if (feedback.category !== categoryFilter) return false
      }

      // Rating filter
      if (ratingFilter !== 'all') {
        const rating = parseInt(ratingFilter)
        if (feedback.rating !== rating) return false
      }

      return true
    })
  }, [feedbacks, search, categoryFilter, ratingFilter])

  const handleExportCsv = () => {
    if (filteredFeedbacks.length === 0) return
    exportToCsv(filteredFeedbacks)
  }

  const handleExportPdf = () => {
    if (filteredFeedbacks.length === 0) return
    exportToPdf(filteredFeedbacks)
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-col gap-4'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <div className='flex items-center gap-2'>
              <MessageSquare className='h-5 w-5 text-primary' />
              <h2 className='text-2xl font-bold tracking-tight'>
                Teacher Feedback
              </h2>
            </div>
            <p className='text-muted-foreground text-sm'>
              View and analyze teacher feedbacks on app usability and educational
              effectiveness.
            </p>
          </div>
        </div>

        <Tabs defaultValue='overview' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='all'>All Feedbacks</TabsTrigger>
            </TabsList>
            {filteredFeedbacks.length > 0 && (
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleExportCsv}
                  disabled={filteredFeedbacks.length === 0}
                >
                  <FileSpreadsheet className='h-4 w-4 mr-2' />
                  Export CSV
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleExportPdf}
                  disabled={filteredFeedbacks.length === 0}
                >
                  <FileDown className='h-4 w-4 mr-2' />
                  Export PDF
                </Button>
              </div>
            )}
          </div>

          <TabsContent value='overview' className='space-y-4'>
            <FeedbackDashboard stats={stats} isLoading={statsLoading} />
          </TabsContent>

          <TabsContent value='all' className='space-y-4'>
            {/* Filters */}
            <div className='flex flex-wrap gap-4 items-center'>
              <Input
                placeholder='Search by teacher name or feedback...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='max-w-sm'
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='All Categories' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  <SelectItem value='usability'>
                    {getCategoryLabel('usability')}
                  </SelectItem>
                  <SelectItem value='educational'>
                    {getCategoryLabel('educational')}
                  </SelectItem>
                  <SelectItem value='general'>
                    {getCategoryLabel('general')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='All Ratings' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Ratings</SelectItem>
                  <SelectItem value='5'>5 Stars</SelectItem>
                  <SelectItem value='4'>4 Stars</SelectItem>
                  <SelectItem value='3'>3 Stars</SelectItem>
                  <SelectItem value='2'>2 Stars</SelectItem>
                  <SelectItem value='1'>1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <FeedbackTable data={filteredFeedbacks} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

