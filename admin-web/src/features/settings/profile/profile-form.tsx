import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { useAuthStore } from '@/stores/auth-store'
import { auth as firebaseAuth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email.'),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const { auth } = useAuthStore()
  const [resetting, setResetting] = useState(false)

  const defaultValues = useMemo<ProfileFormValues>(
    () => ({
      name: auth.user?.displayName ?? '',
      email: auth.user?.email ?? '',
    }),
    [auth.user]
  )

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const handleResetPassword = async () => {
    const email = auth.user?.email ?? ''
    if (!email) {
      toast.error('No email found for the current admin user.')
      return
    }

    try {
      setResetting(true)
      await sendPasswordResetEmail(firebaseAuth, email)
      toast.success(`Reset link sent to ${email}`)
    } catch (error) {
      console.error('Error sending reset email', error)
      toast.error('Failed to send reset link. Please try again.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => showSubmittedData(data))}
        className='space-y-6'
      >
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Admin Name' autoComplete='name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='admin@school.com'
                    autoComplete='email'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <Button type='submit'>Update profile</Button>
          <Button
            type='button'
            variant='outline'
            onClick={handleResetPassword}
            disabled={resetting || !auth.user?.email}
          >
            {resetting ? 'Sending reset link...' : 'Send reset password link'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
