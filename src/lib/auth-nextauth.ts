import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'
import { writeAuthLog } from './audit-log'
import { isUserBanned } from './ban'
import { getAuthSessionOptions, getPasswordSessionStamp } from './auth-session'

async function loadPasswordStamp(userId: string): Promise<number> {
  try {
    const row = await prisma.sysUser.findUnique({
      where: { id: BigInt(userId) },
      select: { passwordChangedAt: true },
    })
    return getPasswordSessionStamp(row?.passwordChangedAt)
  } catch {
    return 0
  }
}

const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.sysUser.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) {
          return null
        }

        if (await isUserBanned(user.id)) {
          await writeAuthLog({
            userId: user.id,
            authType: 'sign_in',
            authStatus: 'failed',
            metadata: { email: user.email, reason: 'banned' },
          })
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.username,
          image: user.avatarUrl,
        }
      },
    }),
  ],
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
        token.pwdAt = await loadPasswordStamp(user.id)
      }

      if (
        token.id &&
        typeof process !== 'undefined' &&
        process.env.NEXT_RUNTIME === 'nodejs'
      ) {
        if (await isUserBanned(token.id as string)) {
          token.id = ''
          delete token.pwdAt
          return token
        }

        const currentPwdAt = await loadPasswordStamp(token.id as string)
        const tokenPwdAt = typeof token.pwdAt === 'number' ? token.pwdAt : 0
        if (tokenPwdAt !== currentPwdAt) {
          token.id = ''
          delete token.pwdAt
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || ''
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        await writeAuthLog({
          userId: user.id,
          authType: 'sign_in',
          authChannel: 'credentials',
          authStatus: 'success',
          metadata: { email: user.email },
        })
        await prisma.sysUser.update({
          where: { id: BigInt(user.id) },
          data: { lastSignInAt: new Date() },
        }).catch(() => {})
      }
    },
  },
} satisfies NextAuthConfig

const sessionOptions = getAuthSessionOptions()

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: sessionOptions,
  ...authConfig,
})
