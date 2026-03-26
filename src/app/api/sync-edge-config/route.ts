import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const [countryDict, cityDict, categoryDict, honorDict] = await Promise.all([
      prisma.sysDict.findUnique({ where: { dictCode: 'country' }, include: { items: true } }),
      prisma.sysDict.findUnique({ where: { dictCode: 'city' }, include: { items: true } }),
      prisma.sysDict.findUnique({ where: { dictCode: 'category_code' }, include: { items: true } }),
      prisma.sysDict.findUnique({ where: { dictCode: 'honor_type' }, include: { items: true } }),
    ])

    const serialize = (obj: unknown) =>
      JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)))

    const data = {
      countryDict: serialize(countryDict),
      cityDict: serialize(cityDict),
      categoryDict: serialize(categoryDict),
      honorDict: serialize(honorDict),
    }

    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{ operation: 'upsert', key: 'dictionaries', value: data }],
        }),
      }
    )

    if (!response.ok) throw new Error('Failed to update Edge Config')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to sync dictionaries:', error)
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 })
  }
}
