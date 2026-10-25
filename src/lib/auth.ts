import { auth } from "@/lib/auth-nextauth";
import { prisma } from "@/lib/prisma";
import { isUserBanned } from "@/lib/ban";

export type AuthUser = {
  userId: bigint;
  email: string;
  username: string;
  roles: string[];
};

/**
 * 从会话加载用户（不查封禁）。写接口请用 `requireAuthUser` 以区分 401 / USER_BANNED。
 */
export async function fetchAuthUserFromSession(): Promise<AuthUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    const user = await prisma.sysUser.findUnique({
      where: { id: BigInt(session.user.id) },
      select: {
        id: true,
        email: true,
        username: true,
        roles: {
          include: {
            role: {
              select: { roleCode: true }
            }
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles.map(r => r.role.roleCode)
    };
  } catch (error) {
    console.error("[Auth] Error fetching user:", error);
    return null;
  }
}

/**
 * Get authenticated user from NextAuth session (excludes banned users).
 * Returns user info with roles from database
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const user = await fetchAuthUserFromSession();
  if (!user) {
    return null;
  }
  if (await isUserBanned(user.userId)) {
    return null;
  }
  return user;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(user: AuthUser | null, requiredRoles: string[]): boolean {
  if (!user) return false;
  return requiredRoles.some(role => user.roles.includes(role));
}

/**
 * Check if user is admin (has 'admin' or 'root' role)
 */
export function isAdmin(user: AuthUser | null): boolean {
  return hasAnyRole(user, ['admin', 'root']);
}

export function isRoot(user: AuthUser | null): boolean {
  return hasAnyRole(user, ['root']);
}
