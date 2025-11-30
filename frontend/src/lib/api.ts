const API_BASE = '/api/auth'

export interface AuthUser {
    userId: string
    email: string
    role: string
    businessId: string | null
    isPasswordResetRequired: boolean
}

export interface LoginResponse extends AuthUser {
    accessToken: string
}

export const authApi = {
    async login(email: string, password: string): Promise<LoginResponse> {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Login failed' }))
            throw new Error(error.error || 'Login failed')
        }

        return res.json()
    },

    async logout(): Promise<void> {
        const res = await fetch(`${API_BASE}/logout`, {
            method: 'POST',
            credentials: 'include',
        })

        if (!res.ok) {
            throw new Error('Logout failed')
        }
    },

    async getCurrentUser(token: string): Promise<AuthUser> {
        const res = await fetch(`${API_BASE}/me`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        })

        if (!res.ok) {
            throw new Error('Failed to get current user')
        }

        return res.json()
    },

    async refreshToken(): Promise<{ accessToken: string }> {
        const res = await fetch(`${API_BASE}/refresh`, {
            method: 'POST',
            credentials: 'include',
        })

        if (!res.ok) {
            throw new Error('Token refresh failed')
        }

        return res.json()
    },

    async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
        const res = await fetch(`${API_BASE}/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({ currentPassword, newPassword }),
        })

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Password change failed' }))
            throw new Error(error.error || 'Password change failed')
        }
    },
}
