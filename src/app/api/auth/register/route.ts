import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { writeAuthLog } from '@/lib/audit-log'

export async function POST(req: Request) {
  try {
    const { email, password, username } = await req.json()

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.sysUser.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 10)

    const user = await prisma.sysUser.create({
      data: {
        email,
        username,
        passwordHash,
      },
    })

    // Assign default 'common' role
    const commonRole = await prisma.sysRole.findUnique({
      where: { roleCode: 'common' },
    })

    if (commonRole) {
      await prisma.sysUserRole.create({
        data: {
          userId: user.id,
          roleId: commonRole.id,
        },
      })
    }

    // Write auth log for registration
    await writeAuthLog({
      userId: user.id,
      authType: 'sign_up',
      authChannel: 'credentials',
      authStatus: 'success',
      metadata: { email: user.email, username: user.username },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        username: user.username,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
