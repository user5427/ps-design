import { useMutation } from '@tanstack/react-query'
import { login } from '@/api/auth'
import type { LoginRequest, LoginResponse } from '@/schemas/auth'

export function useLogin() {
    return useMutation<LoginResponse, Error, LoginRequest>({
        mutationFn: async (request) => {
            return login(request)
        },
    })
}
