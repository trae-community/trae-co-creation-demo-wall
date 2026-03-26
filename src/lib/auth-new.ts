import { auth } from '@/lib/auth-nextauth'
import { prisma } from '@/lib/prisma'

export type AuthUser = {
  userId: bigint
  email: string
  roles: string[]
}

/**
 * Get current authenticated user from NextAuth session
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  try {
    const dbUser = await prisma.sysUser.findUnique({
      where: { id: BigInt(session.user.id) },
      select: {
        id: true,
        email: true,
        roles: {
          include: {
            role: {
              select: {
                roleCode: true,
              },
            },
          },
        },
      },
    })

    if (!dbUser) {
      return null
    }

    return {
      userId: dbUser.id,
      email: dbUser.email,
      roles: dbUser.roles.map((r) => r.role.roleCode),
    }
  } catch {
    return null
  }
}
