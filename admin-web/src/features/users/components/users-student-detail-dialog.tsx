'use client'

import { Timestamp } from 'firebase/firestore'

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogHeader,

  DialogTitle,

} from '@/components/ui/dialog'

import {

  Card,

  CardContent,

  CardDescription,

  CardHeader,

  CardTitle,

} from '@/components/ui/card'

import { type User } from '../data/schema'

type UsersStudentDetailDialogProps = {

  currentRow: User | null

  open: boolean

  onOpenChange: (open: boolean) => void

}

/**

 * Calculate age from birthday timestamp

 */

function calculateAge(birthday: Timestamp | Date | undefined): string {

  if (!birthday) return 'N/A'

  

  const birthDate = birthday instanceof Timestamp 

    ? birthday.toDate() 

    : birthday instanceof Date 

      ? birthday 

      : new Date(birthday)

  

  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()

  const monthDiff = today.getMonth() - birthDate.getMonth()

  

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {

    age--

  }

  

  return age.toString()

}

/**

 * Format date from timestamp

 */

function formatDate(date: Timestamp | Date | undefined): string {

  if (!date) return 'N/A'

  

  const dateObj = date instanceof Timestamp 

    ? date.toDate() 

    : date instanceof Date 

      ? date 

      : new Date(date)

  

  return dateObj.toLocaleDateString('en-US', {

    year: 'numeric',

    month: 'long',

    day: 'numeric',

  })

}

export function UsersStudentDetailDialog({

  currentRow,

  open,

  onOpenChange,

}: UsersStudentDetailDialogProps) {

  if (!currentRow || currentRow.role !== 'student' || !currentRow.studentProfile) {

    return null

  }

  const { studentProfile } = currentRow

  const age = calculateAge(studentProfile.birthday)

  return (

    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent className='max-h-[90vh] overflow-y-auto sm:!max-w-2xl'>

        <DialogHeader className='text-start'>

          <DialogTitle>Student Details</DialogTitle>

          <DialogDescription>

            View detailed information about {studentProfile.name || currentRow.email}

          </DialogDescription>

        </DialogHeader>

        

        <div className='space-y-4 py-4'>

          {/* Student Information */}

          <Card>

            <CardHeader>

              <CardTitle>Student Information</CardTitle>

              <CardDescription>Basic student details</CardDescription>

            </CardHeader>

            <CardContent className='space-y-3'>

              <div className='grid grid-cols-2 gap-4'>

                <div>

                  <p className='text-sm font-medium text-muted-foreground'>Name</p>

                  <p className='text-sm'>{studentProfile.name || 'N/A'}</p>

                </div>

                <div>

                  <p className='text-sm font-medium text-muted-foreground'>Email</p>

                  <p className='text-sm'>{currentRow.email}</p>

                </div>

                <div>

                  <p className='text-sm font-medium text-muted-foreground'>Birthday</p>

                  <p className='text-sm'>{formatDate(studentProfile.birthday)}</p>

                </div>

                <div>

                  <p className='text-sm font-medium text-muted-foreground'>Age</p>

                  <p className='text-sm'>{age} years old</p>

                </div>

                <div>

                  <p className='text-sm font-medium text-muted-foreground'>Gender</p>

                  <p className='text-sm capitalize'>{studentProfile.gender || 'N/A'}</p>

                </div>

                <div>

                  <p className='text-sm font-medium text-muted-foreground'>Points</p>

                  <p className='text-sm'>{studentProfile.points ?? 'N/A'}</p>

                </div>

                <div>

                  <p className='text-sm font-medium text-muted-foreground'>Level</p>

                  <p className='text-sm'>{studentProfile.level ?? 'N/A'}</p>

                </div>

                <div>

                  <p className='text-sm font-medium text-muted-foreground'>Class ID</p>

                  <p className='text-sm'>{studentProfile.joinedClassID || 'Not assigned'}</p>

                </div>

              </div>

            </CardContent>

          </Card>

          {/* Parent Information */}

          {studentProfile.parentInfo && (

            <Card>

              <CardHeader>

                <CardTitle>Parent Information</CardTitle>

                <CardDescription>Parent/guardian details</CardDescription>

              </CardHeader>

              <CardContent className='space-y-3'>

                <div className='grid grid-cols-2 gap-4'>

                  <div>

                    <p className='text-sm font-medium text-muted-foreground'>Parent Name</p>

                    <p className='text-sm'>{studentProfile.parentInfo.parentName || 'N/A'}</p>

                  </div>

                  <div>

                    <p className='text-sm font-medium text-muted-foreground'>Parent Email</p>

                    <p className='text-sm'>{studentProfile.parentInfo.parentEmail || 'N/A'}</p>

                  </div>

                  <div>

                    <p className='text-sm font-medium text-muted-foreground'>Parent Birthday</p>

                    <p className='text-sm'>{formatDate(studentProfile.parentInfo.parentBirthday)}</p>

                  </div>

                </div>

              </CardContent>

            </Card>

          )}

        </div>

      </DialogContent>

    </Dialog>

  )

}





