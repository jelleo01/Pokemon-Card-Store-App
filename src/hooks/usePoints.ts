import { announcePoints } from '@/lib/pointNotices'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function usePoints() {
  const { user } = useAuth()
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ['points', user?.id],
    enabled: !!user?.trainerId,
    queryFn: async () => {
      const { data, error } = await supabase.from('card_point_accounts')
        .select('balance').eq('user_id', user!.id).single()
      if (error) throw error
      return data.balance as number
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 1,
  })
  return {
    balance: query.data,
    loading: query.isPending,
    error: query.error,
    refreshPoints: () => client.invalidateQueries({ queryKey: ['points'] }),
    retry: query.refetch,
    notifyTransaction: async (eventKey: string, label: string) => {
      if (!user) return
      const { data, error } = await supabase.from('card_point_entries').select('amount')
        .eq('user_id', user.id).eq('event_key', eventKey).maybeSingle()
      if (!error && data) announcePoints(data.amount, label, `${user.id}:${eventKey}`)
      await client.invalidateQueries({ queryKey: ['points'] })
      await client.invalidateQueries({ queryKey: ['place-summaries'] })
      return !error && !!data?.amount
    },
  }
}
