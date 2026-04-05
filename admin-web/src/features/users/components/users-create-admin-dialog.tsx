'use client'

import { z } from 'zod'

import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'

import { UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/password-input'

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

import { useCreateAdmin, type AdminCreateData } from '../services/user-service'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Email is required.' : undefined),
  }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(64, 'Password must be at most 64 characters.'),
  confirmPassword: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

type AdminCreateForm = z.infer<typeof formSchema>

type UsersCreateAdminDialogProps = {

  open: boolean

  onOpenChange: (open: boolean) => void

}

export function UsersCreateAdminDialog({

  open,

  onOpenChange,

}: UsersCreateAdminDialogProps) {

  const createAdminMutation = useCreateAdmin()

  const form = useForm<AdminCreateForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  })

  const onSubmit = async (values: AdminCreateForm) => {

    const adminData: AdminCreateData = {
      email: values.email,
      password: values.password,
      firstName: values.firstName || undefined,
      lastName: values.lastName || undefined,
    }

    try {

      await createAdminMutation.mutateAsync(adminData)

      form.reset()

      onOpenChange(false)

    } catch (error) {

      // Error is already handled by the mutation hook

      console.error('Error creating admin:', error)

    }

  }

  const isSubmitting = createAdminMutation.isPending

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

            <UserPlus /> Create Admin User

          </DialogTitle>

          <DialogDescription>

            Create a new admin user. The admin will be able to access the admin panel.

          </DialogDescription>

        </DialogHeader>

        <Form {...form}>

          <form

            id='admin-create-form'

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

                      placeholder='admin@example.com'

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

            <FormField

              control={form.control}

              name='firstName'

              render={({ field }) => (

                <FormItem>

                  <FormLabel>First Name (optional)</FormLabel>

                  <FormControl>

                    <Input

                      placeholder='John'

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

              name='lastName'

              render={({ field }) => (

                <FormItem>

                  <FormLabel>Last Name (optional)</FormLabel>

                  <FormControl>

                    <Input

                      placeholder='Doe'

                      autoComplete='off'

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

          <Button

            variant='outline'

            onClick={() => onOpenChange(false)}

            disabled={isSubmitting}

          >

            Cancel

          </Button>

          <Button

            type='submit'

            form='admin-create-form'

            disabled={isSubmitting}

          >

            {isSubmitting ? 'Creating...' : 'Create Admin'}

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  )

}


