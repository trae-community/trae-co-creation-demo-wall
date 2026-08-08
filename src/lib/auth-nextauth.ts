import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'
import { writeAuthLog } from './audit-log'
import { isUserBanned } from './ban'

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

        // 封禁用户拒绝登录，并记录失败认证日志
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
      if (user) {
        token.id = user.id
      }
      // 已被封禁的账号：清空会话中的用户 ID，使其存量会话失效
      if (token.id && (await isUserBanned(token.id as string))) {
        token.id = ''
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  ...authConfig,
})
