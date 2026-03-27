import { auth } from "@/lib/auth-nextauth";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  userId: bigint;
  email: string;
  username: string;
  roles: string[];
};

/**
 * Get authenticated user from NextAuth session
 * Returns user info with roles from database
 */
export async function getAuthUser(): Promise<AuthUser | null> {
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
