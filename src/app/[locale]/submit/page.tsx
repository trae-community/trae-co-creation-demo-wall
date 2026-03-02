import { SubmissionPage } from '@/features/submit/page'
import { getOrSyncUser } from '@/lib/auth'
import { redirect } from '@/i18n/navigation'

export default async function Page() {
  const user = await getOrSyncUser()

  if (!user) {
    redirect({ href: '/sign-in', locale: 'zh' })
  }

  const serializedUser = {
    id: user!.id.toString(),
    email: user!.email ?? null,
    username: user!.username ?? '',
    avatarUrl: user!.avatarUrl ?? null,
  }

  return <SubmissionPage user={serializedUser} />
}
