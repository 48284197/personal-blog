import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AiGatewayConsole } from './ui'

export const metadata: Metadata = {
  title: 'AI 中转',
}

export default async function AiGatewayPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login?redirect=/ai-gateway')
  }

  return <AiGatewayConsole />
}
