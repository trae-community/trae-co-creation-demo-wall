import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { writeAuthLog, writeOperationLog } from "@/lib/audit-log";

export type AuthUser = {
  clerkId: string;
  userId: bigint;
  roles: string[];
};

/**
 * Reads identity from the local Clerk JWT — zero network calls in the happy path.
 *
 * Fast path: JWT publicMetadata already contains userId (written by webhook/sync).
 * Fallback path: userId not yet in JWT (webhook not fired or JWT not refreshed yet).
 *   → One DB lookup by clerkId to resolve the local userId.
 *   → This only triggers during the race window between sign-in and first JWT refresh.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const { userId: clerkId, sessionClaims } = await auth();
  if (!clerkId) return null;

  const meta = sessionClaims?.publicMetadata as
    | { userId?: string; roles?: string[] }
    | undefined;

  // Fast path: JWT already has userId
  if (meta?.userId) {
    try {
      return {
        clerkId,
        userId: BigInt(meta.userId),
        roles: meta.roles ?? [],
      };
    } catch {
      // BigInt parse failed — fall through to DB lookup
    }
  }

  // Fallback: userId not yet in JWT — look up DB by clerkId
  // This happens when webhook hasn't fired or JWT hasn't refreshed yet.
  try {
    const dbUser = await prisma.sysUser.findUnique({
      where: { clerkId },
      select: {
        id: true,
        roles: { include: { role: { select: { roleCode: true } } } },
      },
    });

    if (!dbUser) return null;

    return {
      clerkId,
      userId: dbUser.id,
      roles: dbUser.roles.map(r => r.role.roleCode),
    };
  } catch {
    return null;
  }
}

type SyncUserOptions = {
  trigger?: "auth_callback" | "default";
  request?: Request;
};

/**
 * Retrieves the current Clerk user and synchronizes them with the local SysUser database.
 * Used only by the Clerk webhook handler — not called on every API request.
 */
export async function syncUserFromClerk(options: SyncUserOptions = {}) {
  console.log("[Auth] Starting getOrSyncUser...");
  try {
    const user = await currentUser();

    if (!user) {
      console.log("[Auth] No current user found from Clerk.");
      return null;
    }

    console.log(`[Auth] Found Clerk user: ${user.id} (${user.emailAddresses[0]?.emailAddress})`);

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
       console.warn("[Auth] User has no email address, skipping sync.");
       return null;
    }

    // Use username if available, otherwise fallback to email prefix or generated ID
    const username = user.username || email?.split('@')[0] || `user_${user.id.substring(0, 8)}`;

    // Extract external accounts (identities)
    const identities = user.externalAccounts.map(account => ({
      provider: account.provider,
      providerUserId: account.providerUserId,
      email: account.emailAddress,
      username: account.username,
    }));

    // Determine password status
    const passwordEnabled = user.passwordEnabled;
    const passwordHashValue = passwordEnabled ? 'managed_by_clerk' : null;
    const existingUser = await prisma.sysUser.findUnique({
      where: {
        clerkId: user.id
      },
      select: {
        id: true
      }
    });

    console.log("[Auth] Upserting user to database...");
    // Use Upsert to handle both Create and Update in one atomic operation
    const sysUser = await prisma.sysUser.upsert({
      where: {
        clerkId: user.id
      },
      update: {
        email,
        username,
        avatarUrl: user.imageUrl,
        lastSignInAt: new Date(user.lastSignInAt || Date.now()),
        identities: identities as object,
        passwordHash: passwordHashValue,
      },
      create: {
        clerkId: user.id,
        email,
        username,
        avatarUrl: user.imageUrl,
        lastSignInAt: new Date(user.lastSignInAt || Date.now()),
        identities: identities as object,
        passwordHash: passwordHashValue,
      },
      include: {
        roles: {
            include: {
                role: true
            }
        }
      }
    });
    console.log(`[Auth] User upserted successfully. ID: ${sysUser.id}`);

    let finalUser = sysUser;

    // Assign default 'common' role if no roles exist
    if (sysUser.roles.length === 0) {
      console.log("[Auth] User has no roles, checking for default 'common' role...");
      const userRole = await prisma.sysRole.findUnique({
        where: { roleCode: 'common' }
      });

      if (userRole) {
        console.log(`[Auth] Assigning 'common' role (ID: ${userRole.id}) to user...`);
        // Use upsert to prevent duplicate role assignment
        await prisma.sysUserRole.upsert({
          where: {
            userId_roleId: {
              userId: sysUser.id,
              roleId: userRole.id
            }
          },
          update: {},
          create: {
            userId: sysUser.id,
            roleId: userRole.id
          }
        });
        // Re-fetch user with roles
        finalUser = await prisma.sysUser.findUnique({
          where: { id: sysUser.id },
          include: {
            roles: {
                include: {
                    role: true
                }
            }
          }
        }) as typeof sysUser;
      } else {
         console.warn("[Auth] Default 'common' role not found in database. Please ensure 'common' role exists in sys_role table.");
      }
    }

    // Sync roles to Clerk publicMetadata if changed
    const roleCodes = finalUser.roles.map(r => r.role.roleCode);
    const currentClerkRoles = user.publicMetadata.roles as string[] || [];

    const isRolesChanged = roleCodes.length !== currentClerkRoles.length ||
                           !roleCodes.every(r => currentClerkRoles.includes(r));

    if (isRolesChanged) {
        console.log(`[Auth] Syncing roles to Clerk metadata: ${roleCodes.join(', ')}`);
        try {
            const client = await clerkClient();
            await client.users.updateUserMetadata(user.id, {
                publicMetadata: {
                    roles: roleCodes,
                    userId: finalUser.id.toString()
                }
            });
            console.log("[Auth] Clerk metadata updated successfully.");
        } catch (err) {
            console.error("[Auth] Failed to update Clerk metadata:", err);
        }
    }

    if (options.trigger === "auth_callback") {
      const authType = existingUser ? "sign_in" : "sign_up";
      const providers = user.externalAccounts.map(account => account.provider);

      await writeAuthLog({
        userId: finalUser.id,
        clerkId: user.id,
        authType,
        authChannel: "clerk",
        authStatus: "success",
        metadata: {
          email,
          providers
        },
        request: options.request
      });

      await writeOperationLog({
        operatorId: finalUser.id,
        module: "auth",
        action: authType,
        targetType: "sys_user",
        targetId: finalUser.id,
        payload: {
          clerkId: user.id
        },
        request: options.request
      });
    }

    return finalUser;
  } catch (error) {
    console.error("[Auth] Error in getOrSyncUser:", error);
    throw error;
  }
}
