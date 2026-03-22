import { syncUserFromClerk } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  // Sync user data immediately after login/signup
  await syncUserFromClerk({ trigger: 'auth_callback', request });

  // Redirect to home page — middleware will add locale prefix automatically
  redirect('/');
}
