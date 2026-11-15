import { useContent } from '@/contexts/ContentContext'
import { fetchAdminDashboardStats } from '@/lib/supabase/queries'
import { useQuery } from '@tanstack/react-query'

export function useAdminDashboardStats() {
  const { apiReady } = useContent()

  return useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: fetchAdminDashboardStats,
    enabled: apiReady,
    staleTime: 60_000,
  })
}