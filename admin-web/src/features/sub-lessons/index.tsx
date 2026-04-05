import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Separator } from '@/components/ui/separator'
import { useSubLessons } from './services/sub-lesson-service'
import { useActivities } from './services/activity-service'
import {
  SubLessonsProvider,
  useSubLessonContext,
} from './components/sub-lessons-provider'
import { SubLessonsPrimaryButtons } from './components/sub-lessons-primary-buttons'
import { SubLessonsTable } from './components/sub-lessons-table'
import { ActivitiesTable } from './components/activities-table'
import { SubLessonsDialogs } from './components/sub-lessons-dialogs'

function SubLessonsContent() {
  const { data: subLessons, isLoading } = useSubLessons()
  const { currentSubLesson } = useSubLessonContext()
  const {
    data: activities,
    isLoading: activitiesLoading,
  } = useActivities(currentSubLesson?.id)

  const subLessonsData = subLessons ?? []

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

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Sub-lessons</h2>
            <p className='text-muted-foreground'>
              Manage sub-lessons and activities aligned to the fixed curriculum.
            </p>
          </div>
          <SubLessonsPrimaryButtons />
        </div>

        <SubLessonsTable
          data={subLessonsData}
          isLoading={isLoading}
        />

        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-semibold'>Activities</h3>
            <p className='text-sm text-muted-foreground'>
              {currentSubLesson
                ? `For: ${currentSubLesson.title}`
                : 'Select a sub-lesson to view activities.'}
            </p>
          </div>
        </div>
        <ActivitiesTable
          data={activities ?? []}
          isLoading={activitiesLoading && Boolean(currentSubLesson)}
        />
        <Separator />
      </Main>

      <SubLessonsDialogs />
    </>
  )
}

export function SubLessonsFeature() {
  return (
    <SubLessonsProvider>
      <SubLessonsContent />
    </SubLessonsProvider>
  )
}

