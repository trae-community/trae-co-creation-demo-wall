import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tags = await prisma.workTag.findMany({
      orderBy: { id: 'asc' }
    })
    return NextResponse.json(tags)
  } catch (error) {
    console.error('[API] Failed to fetch tags:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
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
    return NextResponse.json(newTag)
  } catch (error) {
    console.error('[API] Failed to create tag:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
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
    return NextResponse.json(updatedTag)
  } catch (error) {
    console.error('[API] Failed to update tag:', error)
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    await prisma.workTag.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to delete tag:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}
