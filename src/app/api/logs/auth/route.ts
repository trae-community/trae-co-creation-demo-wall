import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CRUD_QUERY_PARAMS } from '@/lib/crud'
import { getAuthUser, isAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    // 鉴权检查：只有管理员可以访问
    const user = await getAuthUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get(CRUD_QUERY_PARAMS.page) || '1')
    const pageSize = parseInt(searchParams.get(CRUD_QUERY_PARAMS.pageSize) || '10')
    const query = searchParams.get(CRUD_QUERY_PARAMS.query) || ''
    const filter = searchParams.get(CRUD_QUERY_PARAMS.filter) || 'all'
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const skip = (page - 1) * pageSize
    const take = pageSize

    const where: any = {}

    // Handle filter
    if (filter !== 'all') {
      where.authType = filter
    }

    // Handle date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(`${startDate}T00:00:00`)
      }
      if (endDate) {
        where.createdAt.lte = new Date(`${endDate}T23:59:59.999`)
      }
    }

    // Handle search query
    if (query) {
      where.OR = [
        { ipAddress: { contains: query, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          }
        }
      ]
    }

    const [total, items] = await Promise.all([
      prisma.sysAuthLog.count({ where }),
      prisma.sysAuthLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take
      })
    ])

    // Serialize BigInt
    const serializedItems = JSON.parse(
      JSON.stringify(items, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    )

    return NextResponse.json({
      items: serializedItems,
      total
    })
  } catch (error) {
    console.error('Failed to fetch auth logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch auth logs' },
      { status: 500 }
    )
  }
}
