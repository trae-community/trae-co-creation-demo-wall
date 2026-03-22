'use client'

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

/**
 * Client Component: after the server has synced the DB user and written
 * publicMetadata.userId, we force Clerk to refresh the session token so
 * the new JWT with userId is available immediately — no 60s wait.
 */
export default function SyncClient({ destination }: { destination: string }) {
  const { session } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      // No session — just redirect (unauthenticated)
      router.replace(destination);
      return;
    }

    // Force Clerk to refresh the JWT, pulling the latest publicMetadata
    session.touch().then(() => {
      router.replace(destination);
    }).catch(() => {
      // touch() failed — still redirect, JWT will refresh on its own cycle
      router.replace(destination);
    });
  }, [session, router, destination]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">正在初始化账户…</p>
      </div>
    </div>
  );
}
