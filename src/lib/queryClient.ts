import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { mutationErrorHandler, queryErrorHandler } from './qcErrorHandler';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 404 || error?.status === 404) {
          return false;
        }
        return failureCount < 1; // or true / number / etc.
      },
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
  mutationCache: new MutationCache({
    onError: mutationErrorHandler,
  }),
  queryCache: new QueryCache({
    onError: queryErrorHandler,
  }),
});

export const persister = createAsyncStoragePersister({
  storage: window.localStorage,
  key: 'aware-query-cache',
});

export { PersistQueryClientProvider };
