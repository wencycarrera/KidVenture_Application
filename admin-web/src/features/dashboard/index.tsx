import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Analytics } from './components/analytics'
import { Overview } from './components/overview'
import { RecentActivity } from './components/recent-sales'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardData } from './services/dashboard-service'
import { type ReactNode } from 'react'

type SummaryCard = {
  title: string
  value: number | string | ReactNode
  subtitle: string
  icon: LucideIcon
}

export function Dashboard() {
  const { data, isLoading } = useDashboardData()

  const summaryCards: SummaryCard[] = [
    {
      title: 'Total Users',
      value: data?.summary.totalUsers ?? '--',
      subtitle: '',
      icon: Users,
    },
    {
      title: 'Students',
      value: data?.summary.students ?? '--',
      subtitle: '',
      icon: GraduationCap,
    },
    {
      title: 'Teachers',
      value: data?.summary.teachers ?? '--',
      subtitle: data ? `${data.summary.pendingTeachers} pending approvals` : '',
      icon: UserCheck,
    },
    {
      title: 'Admins',
      value: data?.summary.admins ?? '--',
      subtitle: '',
      icon: ShieldCheck,
    },
  ]

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <div className='flex items-center space-x-2'></div>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='analytics'>Analytics</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {isLoading
                ? Array.from({ length: summaryCards.length }).map((_, idx) => (
                    <Card key={idx}>
                      <CardHeader className='space-y-2'>
                        <Skeleton className='h-4 w-24' />
                        <Skeleton className='h-4 w-8' />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className='h-6 w-16' />
                      </CardContent>
                    </Card>
                  ))
                : summaryCards.map((card) => (
                    <Card key={card.title}>
                      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>
                          {card.title}
                        </CardTitle>
                        <card.icon className='text-muted-foreground h-4 w-4' />
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl font-bold'>{card.value}</div>
                        <p className='text-muted-foreground text-xs'>{card.subtitle}</p>
                      </CardContent>
                    </Card>
                  ))}
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Module Completion & Scores</CardTitle>
                  <CardDescription>
                    Progress across core KidVenture lessons
                  </CardDescription>
                </CardHeader>
                <CardContent className='ps-2'>
                  <Overview data={data?.moduleStats ?? []} />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Approvals and content updates across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivity items={data?.recentActivity ?? []} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value='analytics' className='space-y-4'>
            <Analytics
              weeklyActivity={data?.weeklyActivity ?? []}
              moduleStats={data?.moduleStats ?? []}
              topLessons={data?.topLessons ?? []}
              completionBars={data?.completionBars ?? []}
              strugglingStudents={data?.strugglingStudents ?? 0}
            />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

