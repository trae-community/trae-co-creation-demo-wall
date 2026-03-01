import { getOrSyncUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function GET() {
  // Sync user data immediately after login/signup
  await getOrSyncUser();

  // Redirect to home page — middleware will add locale prefix automatically
  redirect('/');
}
