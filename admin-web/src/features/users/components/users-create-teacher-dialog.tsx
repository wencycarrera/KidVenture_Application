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
import { useCreateTeacher, type TeacherCreateData } from '../services/user-service'

const formSchema = z.object({
  email: z
    .string()
    .email({ message: 'Valid email is required.' })
    .min(1, 'Email is required.'),
  fullName: z.string().min(1, 'Full name is required.'),
  birthday: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(64, 'Password must be at most 64 characters.'),
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

type TeacherCreateForm = z.infer<typeof formSchema>

type UsersCreateTeacherDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersCreateTeacherDialog({
  open,
  onOpenChange,
}: UsersCreateTeacherDialogProps) {
  const createTeacherMutation = useCreateTeacher()

  const form = useForm<TeacherCreateForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      fullName: '',
      birthday: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: TeacherCreateForm) => {
    const teacherData: TeacherCreateData = {
      email: values.email.trim(),
      fullName: values.fullName.trim(),
      birthday: values.birthday?.trim() || undefined,
      password: values.password,
    }

    try {
      await createTeacherMutation.mutateAsync(teacherData)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating teacher:', error)
    }
  }

  const isSubmitting = createTeacherMutation.isPending

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
            <UserPlus /> Create Teacher
          </DialogTitle>
          <DialogDescription>
            Add a teacher account. Teacher will be auto-approved.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id='teacher-create-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='teacher@example.com'
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
              name='fullName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='Juan Dela Cruz' autoComplete='off' {...field} />
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

            <FormField
              control={form.control}
              name='birthday'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birthday (optional)</FormLabel>
                  <FormControl>
                    <Input type='date' {...field} />
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
          <Button type='submit' form='teacher-create-form' disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Teacher'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

