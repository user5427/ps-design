import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface AuthStateProps {
    userId: string | null
    email: string | null
    role: string | null
    businessId: string | null
    isPasswordResetRequired: boolean
    isAuthenticated: boolean
}

export interface AuthActionsProps {
    setUser: (user: Omit<AuthStateProps, 'isAuthenticated'>) => void
    login: (userId: string, email: string, role: string, businessId: string | null, isPasswordResetRequired: boolean) => void
    logout: () => void
    reset: () => void
}

export type AuthStoreProps = AuthStateProps & AuthActionsProps

const initialState: AuthStateProps = {
    userId: null,
    email: null,
    role: null,
    businessId: null,
    isPasswordResetRequired: false,
    isAuthenticated: false,
}

export const AuthStore = create<AuthStoreProps>()(
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
