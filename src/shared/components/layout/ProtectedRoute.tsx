import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/shared/lib/supabase'

export function ProtectedRoute() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <div className="flex min-h-screen items-center justify-center">Laden...</div>
  }

  if (session === null) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
