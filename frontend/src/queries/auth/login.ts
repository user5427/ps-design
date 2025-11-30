import { useMutation } from '@tanstack/react-query'
import { login } from '../../api/endpoints/auth'
import type { LoginRequest, LoginResponse } from '../../api/types/auth'

export function useLogin() {
    return useMutation<LoginResponse, Error, LoginRequest>({
        mutationFn: async (request) => {
            return login(request)
        },
    })
}
