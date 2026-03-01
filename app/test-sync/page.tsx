import { getOrSyncUser } from '@/lib/auth';

export default async function Page() {
  let user: Awaited<ReturnType<typeof getOrSyncUser>> | null = null;
  let error: string | null = null;

  try {
    user = await getOrSyncUser();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="container mx-auto p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">User Sync Debug Page</h1>
      
      <div className="bg-zinc-900 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-2">Sync Result</h2>
        {user ? (
          <pre className="whitespace-pre-wrap break-all text-green-400">
            {JSON.stringify(user, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value
            , 2)}
          </pre>
        ) : (
          <p className="text-yellow-400">No user synced (User might not be logged in or sync failed quietly).</p>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2 text-red-400">Error</h2>
          <pre className="whitespace-pre-wrap break-all text-red-300">{error}</pre>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-500">
        Check the server console logs for detailed "[Auth]" messages.
      </div>
    </div>
  );
}
