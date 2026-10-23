import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { clearToken } from '../api/session'

/**
 * Single place that ends the local session: drops the token, empties every
 * cached query (so nothing from the previous user survives) and sends the
 * visitor to the login screen.
 */
export function useEndSession() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    return useCallback(() => {
        clearToken()
        queryClient.clear()
        navigate('/login', { replace: true })
    }, [navigate, queryClient])
}
