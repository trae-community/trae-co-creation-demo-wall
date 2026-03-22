import { syncUserFromClerk } from "@/lib/auth";
import { redirect } from "next/navigation";
import SyncClient from "./sync-client";

/**
 * Server Component: runs syncUserFromClerk() to ensure the DB user exists
 * and Clerk publicMetadata.userId is written before the client gets the page.
 * Then SyncClient forces a JWT refresh so the new token is available immediately.
 */
export default async function SyncPage({
  params,
  searchParams,
}: {
  params: Promise<{ language: string }>;
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { language } = await params;
  const { redirect_url } = await searchParams;

  // Run server-side sync: upsert DB user + write userId to Clerk publicMetadata
  try {
    await syncUserFromClerk({ trigger: "auth_callback" });
  } catch (err) {
    console.error("[Sync] syncUserFromClerk failed:", err);
    // Even if sync fails, don't block the user — redirect to home
    redirect(`/${language}`);
  }

  const destination = redirect_url || `/${language}`;

  // Hand off to client to force JWT refresh, then navigate
  return <SyncClient destination={destination} />;
}
