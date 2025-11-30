import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface AuthState {
    userId: string | null
    email: string | null
    role: string | null
    businessId: string | null
    isPasswordResetRequired: boolean
    isAuthenticated: boolean
}

export interface AuthActions {
    setUser: (user: Omit<AuthState, 'isAuthenticated'>) => void
    login: (userId: string, email: string, role: string, businessId: string | null, isPasswordResetRequired: boolean) => void
    logout: () => void
    reset: () => void
}

export type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
    userId: null,
    email: null,
    role: null,
    businessId: null,
    isPasswordResetRequired: false,
    isAuthenticated: false,
}

export const useAuthStore = create<AuthStore>()(
    devtools(
        persist(
            (set) => ({
                ...initialState,
                setUser: (user) =>
                    set({
                        ...user,
                        isAuthenticated: !!user.userId,
                    }),
                login: (userId, email, role, businessId, isPasswordResetRequired) =>
                    set({
                        userId,
                        email,
                        role,
                        businessId,
                        isPasswordResetRequired,
                        isAuthenticated: true,
                    }),
                logout: () =>
                    set({
                        ...initialState,
                    }),
                reset: () =>
                    set({
                        ...initialState,
                    }),
            }),
            {
                name: 'auth-storage',
            }
        ),
        {
            name: 'AuthStore',
        }
    )
)
