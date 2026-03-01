import { SubmissionPage } from '@/views/SubmissionPage'
import { getOrSyncUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  // Sync user data when accessing the submission page
  // Note: Data is also synced on login via /api/auth/callback, but we keep it here
  // to ensure data is fresh and to get the local user object for the UI
  const user = await getOrSyncUser()
  
  if (!user) {
    // Should be handled by middleware, but double check
    redirect('/sign-in')
  }

  // Serialize BigInt to string before passing to client component
  const serializedUser = {
    ...user,
    id: user.id.toString()
  }

  return <SubmissionPage user={serializedUser} />
}
