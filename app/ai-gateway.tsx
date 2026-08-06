import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getCurrentUser } from '@/lib/auth'
import { AiGatewayConsole } from './ai-gateway/-ui'

const isSignedIn = createServerFn().handler(async () => Boolean(await getCurrentUser()))

export const Route = createFileRoute('/ai-gateway')({
  beforeLoad: async () => {
    if (!(await isSignedIn())) {
      throw redirect({ to: '/login', search: { mode: undefined, redirect: '/ai-gateway' } })
    }
  },
  head: () => ({ meta: [{ title: 'AI 中转 | 毛球' }] }),
  component: AiGatewayPage,
})

function AiGatewayPage() {
  return <AiGatewayConsole />
}
