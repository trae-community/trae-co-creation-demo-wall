import { SubmissionForm } from '@/app/[language]/submit/submission-form'
import { getOrSyncUser } from '@/lib/auth'
import { redirect } from '@/lib/language/navigation'

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

  return <SubmissionForm user={serializedUser} />
}
