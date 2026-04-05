import { StrictMode, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import {
  onAuthStateChange,
  getCurrentAdminData,
  getCurrentUserToken,
} from '@/lib/auth-service'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('Content not modified!')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast.error('Session expired!')
          useAuthStore.getState().auth.reset()
          const redirect = `${router.history.location.href}`
          router.navigate({ to: '/sign-in', search: { redirect } })
        }
        if (error.response?.status === 500) {
          toast.error('Internal Server Error!')
          // Only navigate to error page in production to avoid disrupting HMR in development
          if (import.meta.env.PROD) {
            router.navigate({ to: '/500' })
          }
        }
        if (error.response?.status === 403) {
          // router.navigate("/forbidden", { replace: true });
        }
      }
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

/**
 * Initialize auth state listener
 * Restores user session on app load and handles auth state changes
 */
function initializeAuth() {
  const { auth } = useAuthStore.getState()

  // Listen to Firebase auth state changes
  const unsubscribe = onAuthStateChange(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Get ID token
        const idToken = await getCurrentUserToken()
        
        if (!idToken) {
          throw new Error('Failed to get ID token')
        }

        // Verify admin role and get admin data
        const adminData = await getCurrentAdminData()

        if (!adminData) {
          // User is not an admin, sign them out
          console.warn('User is not an admin, clearing session')
          auth.reset()
          return
        }

        // Create user object for auth store
        const authUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || adminData.email,
          role: 'admin' as const,
          displayName: adminData.email.split('@')[0] || 'Admin',
        }

        // Restore session
        auth.setUser(authUser, firebaseUser, adminData)
        auth.setAccessToken(idToken)
      } catch (error) {
        console.error('Error restoring auth session:', error)
        auth.reset()
      }
    } else {
      // User is signed out, clear auth store
      auth.reset()
    }
  })

  return unsubscribe
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  // Initialize auth state listener
  const unsubscribeAuth = initializeAuth()

  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )

  // Cleanup auth listener on unmount (though this shouldn't happen in SPA)
  // This is mainly for development hot reload
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      unsubscribeAuth()
    })
  }
}
