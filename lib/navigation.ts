import { useLocation, useRouter as useTanStackRouter } from '@tanstack/react-router'

export function useRouter() {
  const router = useTanStackRouter()

  return {
    push: (to: string) => router.navigate({ to }),
    replace: (to: string) => router.navigate({ to, replace: true }),
    refresh: () => router.invalidate(),
    prefetch: (to: string) => router.preloadRoute({ to }),
    back: () => router.history.back(),
  }
}

export function useSearchParams() {
  const search = useLocation({ select: (location) => location.searchStr })
  return new URLSearchParams(search)
}
