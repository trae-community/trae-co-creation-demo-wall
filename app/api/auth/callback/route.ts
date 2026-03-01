import { getOrSyncUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Sync user data immediately after login/signup
  await getOrSyncUser();
  
  // Redirect to home page (or origin if stored)
  // You can also get 'redirect_url' from query params if you pass it
  redirect('/');
}
