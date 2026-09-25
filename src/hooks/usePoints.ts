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
  }
}
