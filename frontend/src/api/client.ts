import { API_URL } from './config'

export async function authenticatedFetch(
    path: string,
    options: RequestInit = {},
) {
    const token = sessionStorage.getItem('questlog_token')

    return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })
}