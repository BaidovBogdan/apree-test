'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '../lib/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: {
    queries: { staleTime: 15000, retry: 1 },
    mutations: { retry: false },
  } }));
  return <ThemeProvider theme={theme}><CssBaseline /><QueryClientProvider client={client}>{children}</QueryClientProvider></ThemeProvider>;
}
