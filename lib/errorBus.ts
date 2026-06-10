// Minimal event bus so React Query's cache-level error callbacks (created when
// the QueryClient is constructed) can push user-facing messages to a UI
// component without a circular dependency.
type Listener = (message: string) => void

const listeners = new Set<Listener>()

export const errorBus = {
  emit(message: string) {
    listeners.forEach((l) => l(message))
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
