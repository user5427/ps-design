import { useMutation } from '@tanstack/react-query'
import { changePassword } from '../../api/endpoints/auth'
import type { ChangePasswordResponse } from '../../api/types/auth'

interface UseChangePasswordPayload {
    email: string
    currentPassword: string
    newPassword: string
}

export function useChangePassword() {
    return useMutation<ChangePasswordResponse, Error, UseChangePasswordPayload>({
        mutationFn: async ({ email, currentPassword, newPassword }) => {
            return changePassword(email, currentPassword, newPassword)
        },
    })
}
