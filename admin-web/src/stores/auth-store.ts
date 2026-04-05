import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'
import type { User as FirebaseUser } from 'firebase/auth'
import type { AdminUserData } from '@/lib/auth-service'

const ACCESS_TOKEN = 'thisisjustarandomstring'
const USER_DATA = 'admin_user_data'

interface AuthUser {
  uid: string
  email: string
  role: 'admin'
  displayName?: string
}

interface AuthState {
  auth: {
    user: AuthUser | null
    firebaseUser: FirebaseUser | null
    adminData: AdminUserData | null
    setUser: (user: AuthUser | null, firebaseUser: FirebaseUser | null, adminData: AdminUserData | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    isAuthenticated: () => boolean
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const cookieState = getCookie(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''
  const userDataState = getCookie(USER_DATA)
  const initUserData = userDataState ? JSON.parse(userDataState) : null

  return {
    auth: {
      user: initUserData?.user || null,
      firebaseUser: null,
      adminData: initUserData?.adminData || null,
      setUser: (user, firebaseUser, adminData) => {
        const userData = { user, adminData }
        if (user && adminData) {
          setCookie(USER_DATA, JSON.stringify(userData))
        } else {
          removeCookie(USER_DATA)
        }
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            user,
            firebaseUser,
            adminData,
          },
        }))
      },
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          if (accessToken) {
            setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          } else {
            removeCookie(ACCESS_TOKEN)
          }
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          removeCookie(USER_DATA)
          return {
            ...state,
            auth: {
              ...state.auth,
              user: null,
              firebaseUser: null,
              adminData: null,
              accessToken: '',
            },
          }
        }),
      isAuthenticated: () => {
        const state = get()
        return !!(
          state.auth.user &&
          state.auth.accessToken &&
          state.auth.adminData
        )
      },
    },
  }
})
