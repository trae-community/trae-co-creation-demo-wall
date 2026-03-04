import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { CRUD_QUERY_PARAMS, TAG_FILTERS, normalizeFilter } from '@/lib/crud'
import { getOrSyncUser } from '@/lib/auth'
import { writeOperationLog } from '@/lib/audit-log'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get(CRUD_QUERY_PARAMS.page) || '1')
    const pageSize = Number(searchParams.get(CRUD_QUERY_PARAMS.pageSize) || '10')
    const query = searchParams.get(CRUD_QUERY_PARAMS.query) || ''
    const filter = normalizeFilter(searchParams.get(CRUD_QUERY_PARAMS.filter), TAG_FILTERS, 'all')

    const whereFilters: Prisma.WorkTagWhereInput[] = []
    if (query.trim()) {
      whereFilters.push({ name: { contains: query, mode: 'insensitive' } })
    }
    if (filter === 'auto') {
      whereFilters.push({ isAutoAudit: true })
    } else if (filter === 'manual') {
      whereFilters.push({ isAutoAudit: false })
    }

    const whereClause = whereFilters.length ? { AND: whereFilters } : undefined
    const skip = (Math.max(page, 1) - 1) * Math.max(pageSize, 1)
    const take = Math.max(pageSize, 1)

    const [total, items] = await Promise.all([
      prisma.workTag.count({ where: whereClause }),
      prisma.workTag.findMany({
        where: whereClause,
        orderBy: { id: 'asc' },
        skip,
        take
      })
    ])

    return NextResponse.json({
      items,
      total,
      page: Math.max(page, 1),
      pageSize: Math.max(pageSize, 1)
    })
  } catch (error) {
    console.error('[API] Failed to fetch tags:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const operator = await getOrSyncUser()
    const body = await req.json()
    const { name, isAutoAudit, auditStartTime, auditEndTime } = body
    const newTag = await prisma.workTag.create({
      data: {
        name,
        isAutoAudit: isAutoAudit ?? false,
        auditStartTime: auditStartTime ? new Date(auditStartTime) : null,
        auditEndTime: auditEndTime ? new Date(auditEndTime) : null
      }
    })
    await writeOperationLog({
      operatorId: operator?.id,
      module: 'tags',
      action: 'create',
      targetType: 'work_tag',
      targetId: newTag.id,
      payload: { name, isAutoAudit: isAutoAudit ?? false },
      request: req
    })
    return NextResponse.json(newTag)
  } catch (error) {
    console.error('[API] Failed to create tag:', error)
    await writeOperationLog({
      module: 'tags',
      action: 'create',
      targetType: 'work_tag',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req
    })
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const operator = await getOrSyncUser()
    const body = await req.json()
    const { id, name, isAutoAudit, auditStartTime, auditEndTime } = body
    const updatedTag = await prisma.workTag.update({
      where: { id: Number(id) },
      data: {
        name,
        isAutoAudit: isAutoAudit ?? false,
        auditStartTime: auditStartTime ? new Date(auditStartTime) : null,
        auditEndTime: auditEndTime ? new Date(auditEndTime) : null
      }
    })
    await writeOperationLog({
      operatorId: operator?.id,
      module: 'tags',
      action: 'update',
      targetType: 'work_tag',
      targetId: updatedTag.id,
      payload: { id, name, isAutoAudit: isAutoAudit ?? false },
      request: req
    })
    return NextResponse.json(updatedTag)
  } catch (error) {
    console.error('[API] Failed to update tag:', error)
    await writeOperationLog({
      module: 'tags',
      action: 'update',
      targetType: 'work_tag',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req
    })
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const operator = await getOrSyncUser()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    await prisma.workTag.delete({ where: { id: Number(id) } })
    await writeOperationLog({
      operatorId: operator?.id,
      module: 'tags',
      action: 'delete',
      targetType: 'work_tag',
      targetId: id,
      request: req
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to delete tag:', error)
    await writeOperationLog({
      module: 'tags',
      action: 'delete',
      targetType: 'work_tag',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req
    })
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}
