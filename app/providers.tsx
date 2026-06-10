'use client'

import { useEffect, useState } from 'react'
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
  useIsFetching,
  useIsMutating,
} from '@tanstack/react-query'
import { errorBus } from '@/lib/errorBus'

export function Providers({ children }: { children: React.ReactNode }) {
  // One client per browser session; created lazily so it isn't shared
  // across requests on the server.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
        // Surface any read failure to the user instead of silently rendering
        // an empty list.
        queryCache: new QueryCache({
          onError: () =>
            errorBus.emit("Couldn't load data — check your connection."),
        }),
        // Surface write failures that aren't otherwise handled.
        mutationCache: new MutationCache({
          onError: (err) =>
            errorBus.emit(
              err instanceof Error ? err.message : 'Something went wrong.',
            ),
        }),
      }),
  )

  return (
    <QueryClientProvider client={client}>
      <GlobalStatus />
      {children}
    </QueryClientProvider>
  )
}

// Thin top progress bar while any query/mutation is in flight + a dismissible
// error toast driven by the error bus.
function GlobalStatus() {
  const fetching = useIsFetching()
  const mutating = useIsMutating()
  const busy = fetching + mutating > 0
  const [error, setError] = useState<string | null>(null)

  useEffect(() => errorBus.subscribe(setError), [])

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 4000)
    return () => clearTimeout(t)
  }, [error])

  return (
    <>
      {busy && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background:
              'linear-gradient(90deg,#6C3CE1,#8B5CF6,#6C3CE1)',
            backgroundSize: '200% 100%',
            animation: 'studioLoadingBar 1s linear infinite',
            zIndex: 9999,
          }}
        />
      )}
      {error && (
        <div
          onClick={() => setError(null)}
          style={{
            position: 'fixed',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 440,
            width: 'calc(100% - 32px)',
            background: '#7F1D1D',
            color: '#FEE2E2',
            border: '1px solid #B91C1C',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 500,
            zIndex: 10000,
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          ⚠ {error}
        </div>
      )}
      <style>{`@keyframes studioLoadingBar{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </>
  )
}
