import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CRUD_QUERY_PARAMS } from '@/lib/crud'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get(CRUD_QUERY_PARAMS.page) || '1')
    const pageSize = parseInt(searchParams.get(CRUD_QUERY_PARAMS.pageSize) || '10')
    const query = searchParams.get(CRUD_QUERY_PARAMS.query) || ''
    const filter = searchParams.get(CRUD_QUERY_PARAMS.filter) || 'all'

    const skip = (page - 1) * pageSize
    const take = pageSize

    const where: any = {}

    // Handle filter
    if (filter === 'success') {
      where.success = true
    } else if (filter === 'failed') {
      where.success = false
    }

    // Handle search query
    if (query) {
      where.OR = [
        { module: { contains: query, mode: 'insensitive' } },
        { action: { contains: query, mode: 'insensitive' } },
        { targetId: { contains: query, mode: 'insensitive' } },
        { requestPath: { contains: query, mode: 'insensitive' } },
        {
          operator: {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          }
        }
      ]
    }

    const [total, items] = await Promise.all([
      prisma.sysOperationLog.count({ where }),
      prisma.sysOperationLog.findMany({
        where,
        include: {
          operator: {
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
    console.error('Failed to fetch operation logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch operation logs' },
      { status: 500 }
    )
  }
}
