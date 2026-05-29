import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { syncCurrentPlatformUser } from '@/lib/platform-user'
import { CreateKnowledgePageClient } from './create-knowledge-page-client'

export default async function KnowledgeCreatePage() {
  const currentUser = await syncCurrentPlatformUser()
  const isKnowledgeCreator = Boolean(
    (currentUser as (typeof currentUser & { isKnowledgeCreator?: boolean }) | null)?.isKnowledgeCreator
  )

  if (!isKnowledgeCreator) {
    redirect('/knowledge')
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#2e1a14]">
      <Navbar activeLabel="知识" />
      <CreateKnowledgePageClient />
    </main>
  )
}
