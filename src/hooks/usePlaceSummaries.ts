import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export interface PlaceSummary { place_key: string; news_count: number; expires_at: string | null }
export function usePlaceSummaries() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['place-summaries', user?.id], enabled: !!user?.trainerId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('card_place_summaries')
      if (error) throw error
      return Object.fromEntries((data as PlaceSummary[]).map(row => [row.place_key, row]))
    }, staleTime: 0, retry: 1,
  })
}
