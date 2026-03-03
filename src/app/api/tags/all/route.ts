import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tags = await prisma.workTag.findMany({
      orderBy: { id: 'asc' }
    })
    return NextResponse.json(tags)
  } catch (error) {
    console.error('[API] Failed to fetch all tags:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}
