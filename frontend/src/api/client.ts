import { getToken } from './session'

import { API_URL } from './config'

export async function authenticatedFetch(
    path: string,
    options: RequestInit = {},
) {
    const token = getToken()

    const headers = new Headers(options.headers)

    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    if (options.body instanceof FormData) {
        headers.delete('Content-Type')
    } else if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    return fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    })
}
