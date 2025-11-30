import { useMutation } from '@tanstack/react-query'
import { login } from '../../api/endpoints/auth'
import type { LoginResponse } from '../../api/types/auth'

export function useLogin() {
    return useMutation<LoginResponse, Error, { email: string; password: string }>({
        mutationFn: async ({ email, password }) => {
            return login(email, password)
        },
    })
}
