'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchFlareSnapshot } from '@/lib/flare/public-client';

export function useFlareSnapshot() {
  return useQuery({
    queryKey: ['flare', 'coston2', 'fassets-snapshot'],
    queryFn: fetchFlareSnapshot,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 2,
  });
}
