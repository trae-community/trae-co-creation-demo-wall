import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Retrieves the current Clerk user and synchronizes them with the local SysUser database.
 * If the user does not exist in the local database, they are created.
 * If they exist, their basic information (email, username, avatar) is updated.
 *
 * @returns The synchronized SysUser object from the local database, or null if not authenticated.
 */
export async function getOrSyncUser() {
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

    return finalUser;
  } catch (error) {
    console.error("[Auth] Error in getOrSyncUser:", error);
    throw error;
  }
}
