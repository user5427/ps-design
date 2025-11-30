import { useMutation } from '@tanstack/react-query'
import { changePassword } from '../../api/endpoints/auth'
import type { ChangePasswordRequest, ChangePasswordResponse } from '../../api/types/auth'

export function useChangePassword() {
    return useMutation<ChangePasswordResponse, Error, ChangePasswordRequest>({
        mutationFn: async (request) => {
            return changePassword(request)
        },
    })
}
