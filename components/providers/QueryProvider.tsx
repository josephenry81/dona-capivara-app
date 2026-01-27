'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Global default options
                        staleTime: 1000 * 60 * 5, // 5 minutes
                        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
                        refetchOnWindowFocus: false,
                        retry: 1
                    }
                }
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <div style={{ fontSize: '16px' }}>
                <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
            </div>
        </QueryClientProvider>
    );
}
