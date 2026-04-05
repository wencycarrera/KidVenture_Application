'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateStudent, type StudentCreateData } from '../services/user-service'

const formSchema = z.object({
  studentName: z.string().min(1, 'Student name is required.'),
  studentBirthday: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  parentName: z.string().min(1, 'Parent/guardian name is required.'),
  parentEmail: z
    .string()
    .email({ message: 'Valid parent email is required.' })
    .min(1, 'Parent email is required.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(64, 'Password must be at most 64 characters.'),
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

type StudentCreateForm = z.infer<typeof formSchema>

type UsersCreateStudentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersCreateStudentDialog({
  open,
  onOpenChange,
}: UsersCreateStudentDialogProps) {
  const createStudentMutation = useCreateStudent()

  const form = useForm<StudentCreateForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentName: '',
      studentBirthday: '',
      gender: undefined,
      parentName: '',
      parentEmail: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: StudentCreateForm) => {
    const studentData: StudentCreateData = {
      studentName: values.studentName.trim(),
      studentBirthday: values.studentBirthday?.trim() || undefined,
      gender: values.gender,
      parentName: values.parentName.trim(),
      parentEmail: values.parentEmail.trim(),
      password: values.password,
    }

    try {
      await createStudentMutation.mutateAsync(studentData)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating student:', error)
    }
  }

  const isSubmitting = createStudentMutation.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <UserPlus /> Create Student
          </DialogTitle>
          <DialogDescription>
            Add a student with linked parent contact. Parent email becomes the login email.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id='student-create-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='studentName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='Child name' autoComplete='off' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='studentBirthday'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Birthday (optional)</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='gender'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender (optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select gender' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='male'>Male</SelectItem>
                      <SelectItem value='female'>Female</SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='parentName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent/Guardian Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='Parent or guardian name' autoComplete='off' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='parentEmail'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Email *</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='parent@example.com'
                      autoComplete='off'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='Set a password'
                      autoComplete='new-password'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password *</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder='Re-type password'
                      autoComplete='new-password'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type='submit' form='student-create-form' disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

