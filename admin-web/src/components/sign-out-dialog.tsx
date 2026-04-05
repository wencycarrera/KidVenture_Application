import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { logoutAdmin, AuthServiceError } from '@/lib/auth-service'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { auth } = useAuthStore()

  const handleSignOut = async () => {
    try {
      // Sign out from Firebase
      await logoutAdmin()
      
      // Clear auth store
      auth.reset()
      
      // Preserve current location for redirect after sign-in
      const currentPath = location.href
      navigate({
        to: '/sign-in',
        search: { redirect: currentPath },
        replace: true,
      })
    } catch (error) {
      console.error('Sign out error:', error)
      
      // Even if logout fails, clear local state and redirect
      auth.reset()
      navigate({
        to: '/sign-in',
        replace: true,
      })
      
      if (error instanceof AuthServiceError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to sign out. Please try again.')
      }
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
