// Fetch wrapper that automatically refreshes tokens on 401 errors
// Must be used in components with access to useAuthStore

import { useAuthStore } from '../store/authStore'

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
    refreshSubscribers.forEach((callback) => callback(token))
    refreshSubscribers = []
}

function addRefreshSubscriber(callback: (token: string) => void) {
    refreshSubscribers.push(callback)
}

export async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const store = useAuthStore.getState()

    const fetchOptions: RequestInit = {
        ...options,
        credentials: 'include',
        headers: {
            ...store.getAuthHeaders(),
            ...(options.headers || {}),
        },
    }

    let response = await fetch(url, fetchOptions)

    if (response.status === 401 && !isRefreshing) {
        isRefreshing = true

        try {
            const res = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            })

            if (!res.ok) {
                throw new Error('Token refresh failed')
            }

            const data = await res.json()
            const newToken = data.accessToken

            store.setAccessToken(newToken)

            isRefreshing = false
            onRefreshed(newToken)

            const retryHeaders = {
                ...store.getAuthHeaders(),
                ...(options.headers || {}),
            }
            response = await fetch(url, {
                ...fetchOptions,
                headers: retryHeaders,
            })
        } catch (error) {
            isRefreshing = false
            store.setAccessToken(null)
            window.location.href = '/'
            throw error
        }
    } else if (response.status === 401 && isRefreshing) {
        return new Promise((resolve, reject) => {
            addRefreshSubscriber(() => {
                const storeUpdated = useAuthStore.getState()
                const retryHeaders = {
                    ...storeUpdated.getAuthHeaders(),
                    ...(options.headers || {}),
                }
                fetch(url, {
                    ...fetchOptions,
                    headers: retryHeaders,
                })
                    .then(resolve)
                    .catch(reject)
            })
        })
    }

    return response
}
