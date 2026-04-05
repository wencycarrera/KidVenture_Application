import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { TeacherApprovalsDialogs } from './components/teacher-approvals-dialogs'
import { TeacherApprovalsProvider } from './components/teacher-approvals-provider'
import { TeacherApprovalsTable } from './components/teacher-approvals-table'
import { usePendingTeachers } from './services/teacher-service'

export function TeacherApprovals() {
  const { data: teachers, isLoading, error } = usePendingTeachers()
  const pendingCount = teachers?.length ?? 0

  return (
    <TeacherApprovalsProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <div className='flex items-center gap-2'>
              <h2 className='text-2xl font-bold tracking-tight'>
                Pending Teacher Approvals
              </h2>
              {pendingCount > 0 && (
                <Badge variant='secondary' className='text-sm'>
                  {pendingCount}
                </Badge>
              )}
            </div>
            <p className='text-muted-foreground'>
              Review and approve teacher registration requests.
            </p>
          </div>
        </div>
        {error && (
          <div className='rounded-md border border-destructive/50 bg-destructive/10 p-4'>
            <p className='text-sm font-medium text-destructive'>
              Error loading pending teachers
            </p>
            <p className='text-xs text-destructive/80 mt-1'>
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <p className='text-xs text-muted-foreground mt-2'>
              Check browser console for details.
            </p>
          </div>
        )}
        <TeacherApprovalsTable
          data={teachers ?? []}
          isLoading={isLoading}
        />
      </Main>

      <TeacherApprovalsDialogs />
    </TeacherApprovalsProvider>
  )
}

