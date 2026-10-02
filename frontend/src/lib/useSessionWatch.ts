import { useEffect } from 'react'
import { api } from './api'
import { isLoggedIn } from './auth'

// Pings /me so a device that was removed gets logged out quickly.
// api() already clears the token and redirects to /login on a 401.
const check = () => {
  if (!isLoggedIn()) return
  api('/me').catch(() => {})
}

export function useSessionWatch(intervalMs = 30000) {
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    const id = setInterval(check, intervalMs)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])
}