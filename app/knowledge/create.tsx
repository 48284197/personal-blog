import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Navbar } from '@/components/navbar'
import { syncCurrentPlatformUser } from '@/lib/platform-user'
import { CreateKnowledgePageClient } from './create/-create-knowledge-page-client'

const canCreateKnowledge = createServerFn().handler(async () => {
  const currentUser = await syncCurrentPlatformUser()
  return Boolean(
    (currentUser as (typeof currentUser & { isKnowledgeCreator?: boolean }) | null)?.isKnowledgeCreator
  )
})

export const Route = createFileRoute('/knowledge/create')({
  beforeLoad: async () => {
    if (!(await canCreateKnowledge())) throw redirect({ to: '/knowledge' })
  },
  component: KnowledgeCreatePage,
})

function KnowledgeCreatePage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#2e1a14]">
      <Navbar activeLabel="知识" />
      <CreateKnowledgePageClient />
    </main>
  )
}
