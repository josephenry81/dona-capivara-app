import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API } from '../services/api';
import { CatalogData } from '../types';

export const CATALOG_QUERY_KEY = ['catalog'];

export function useCatalog() {
    return useQuery<CatalogData>({
        queryKey: CATALOG_QUERY_KEY,
        queryFn: async () => {
            const data = await API.fetchCatalogData(false); // false = bypass internal cache since we use RQ
            return data;
        },
        staleTime: 1000 * 60 * 15 // 15 minutes freshness
    });
}

export function useInvalidateCatalog() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEY });
}
