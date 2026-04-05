import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, RefreshCw, TrendingUp } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudentActivity } from './services/student-activity-service'
import { ActivityDetailDialog } from './components/activity-detail'
import { StudentActivityRow } from './types'
import { formatSeconds } from './utils/formatters'
import { exportToCsv, exportToPdf } from './utils/exports'
import { useClasses } from '../sub-lessons/services/class-service'
import { useModules } from './services/module-service'

export function StudentActivityFeature() {
  const [classId, setClassId] = useState('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<StudentActivityRow | null>(null)

  const filters = useMemo(() => {
    return {
      classId: classId || undefined,
      search: search || undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    }
  }, [classId, search, from, to])

  const { data, isLoading, isError, refetch, error } = useStudentActivity(filters)
  const rows = data ?? []

  const { data: classes, isLoading: classesLoading } = useClasses()
  const { data: modules, isLoading: modulesLoading } = useModules()

  const classNameById = useMemo(() => {
    const map: Record<string, string> = {}
    classes?.forEach((cls) => {
      const label = cls.className || cls.classCode || cls.id
      map[cls.id] = label
    })
    return map
  }, [classes])

  const moduleTitleById = useMemo(() => {
    const map: Record<string, string> = {}
    modules?.forEach((mod) => {
      const label = mod.title || mod.topicCategory || mod.id
      map[mod.id] = label
    })
    return map
  }, [modules])

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
              <TrendingUp className='h-5 w-5 text-primary' />
              <h2 className='text-2xl font-bold tracking-tight'>
                Student Activity & Performance
              </h2>
            </div>
            <p className='text-muted-foreground text-sm'>
              Monitor every student&apos;s progress, attempts, and time on task.
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={!rows.length}
              onClick={() => exportToPdf(rows, { classNameById })}
            >
              <FileDown className='h-4 w-4' />
              Export PDF
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={!rows.length}
              onClick={() => exportToCsv(rows, { classNameById })}
            >
              <FileSpreadsheet className='h-4 w-4' />
              Export CSV
            </Button>
            <Button size='sm' variant='secondary' onClick={() => refetch()}>
              <RefreshCw className='me-2 h-4 w-4' />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search by student, class, or date range.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-3 md:grid-cols-4'>
            <Input
              placeholder='Search student or email'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Input
              placeholder='Class code'
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            />
            <Input type='date' value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type='date' value={to} onChange={(e) => setTo(e.target.value)} />
          </CardContent>
        </Card>

        <Card className='flex-1'>
          <CardHeader>
            <CardTitle>Student performance</CardTitle>
            <CardDescription>
              Aggregated from the `student_progress` collection with class and time filters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='space-y-2'>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton key={idx} className='h-12 w-full' />
                ))}
              </div>
            ) : isError ? (
              <div className='rounded-md border border-destructive/50 bg-destructive/5 p-4'>
                <p className='text-destructive font-semibold'>Failed to load data</p>
                <p className='text-muted-foreground text-sm'>
                  {error instanceof Error ? error.message : 'Unknown error'}
                </p>
              </div>
            ) : rows.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No activity found.</p>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Avg. Score</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Activities</TableHead>
                      <TableHead>Total Time</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Stars</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.studentID}>
                        <TableCell className='font-semibold'>{row.studentName}</TableCell>
                        <TableCell className='text-muted-foreground'>
                          {classesLoading ? 'Loading...' : classNameById[row.classID ?? ''] ?? row.classID ?? '—'}
                        </TableCell>
                        <TableCell>{row.averageScore.toFixed(1)}%</TableCell>
                        <TableCell>{row.completionRate.toFixed(0)}%</TableCell>
                        <TableCell>{row.activityCount}</TableCell>
                        <TableCell>{formatSeconds(row.totalTimeSpent)}</TableCell>
                        <TableCell>{row.attempts}</TableCell>
                        <TableCell>{row.starsEarned}</TableCell>
                        <TableCell>
                          {row.lastActivity ? row.lastActivity.toLocaleString() : '—'}
                        </TableCell>
                        <TableCell>
                          <Button size='sm' variant='outline' onClick={() => setSelected(row)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Main>

      <ActivityDetailDialog
        student={selected}
        classNameById={classNameById}
        moduleTitleById={moduleTitleById}
        showLoadingLabels={classesLoading || modulesLoading}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </>
  )
}


