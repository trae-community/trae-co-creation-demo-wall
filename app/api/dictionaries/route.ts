import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 获取字典列表（包含字典项）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (code) {
      const dict = await prisma.sysDict.findUnique({
        where: { dictCode: code },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      });
      return NextResponse.json(dict);
    }

    const dicts = await prisma.sysDict.findMany({
      include: {
        items: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { id: 'asc' }
    });

    // 转换 BigInt 为 String
    const serializedDicts = JSON.parse(JSON.stringify(dicts, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json(serializedDicts);
  } catch (error) {
    console.error('[API] Failed to fetch dicts:', error);
    return NextResponse.json({ error: 'Failed to fetch dictionaries' }, { status: 500 });
  }
}

// POST: 创建字典或字典项
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body; // type: 'dict' | 'item'

    if (type === 'dict') {
      const newDict = await prisma.sysDict.create({
        data: {
          dictCode: data.dictCode,
          dictName: data.dictName,
          description: data.description,
          isSystem: data.isSystem || false
        }
      });
      return NextResponse.json(JSON.parse(JSON.stringify(newDict, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )));
    } 
    
    if (type === 'item') {
      const itemData = {
        dictCode: data.dictCode,
        itemLabel: data.itemLabel,
        itemValue: data.itemValue,
        ...(data.lang !== undefined ? { lang: data.lang } : {}),
        sortOrder: data.sortOrder ?? 0,
        status: data.status ?? true
      }

      const newItem = await prisma.sysDictItem.create({
        data: itemData
      })
      return NextResponse.json(JSON.parse(JSON.stringify(newItem, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )));
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('[API] Failed to create:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

// PUT: 更新字典或字典项
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, data } = body;

    if (type === 'dict') {
      const updatedDict = await prisma.sysDict.update({
        where: { id: BigInt(id) },
        data: {
          dictName: data.dictName,
          description: data.description
        }
      });
      return NextResponse.json(JSON.parse(JSON.stringify(updatedDict, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )));
    }

    if (type === 'item') {
      const itemData = {
        itemLabel: data.itemLabel,
        itemValue: data.itemValue,
        ...(data.lang !== undefined ? { lang: data.lang } : {}),
        sortOrder: data.sortOrder,
        status: data.status
      }

      const updatedItem = await prisma.sysDictItem.update({
        where: { id: BigInt(id) },
        data: itemData
      })
      return NextResponse.json(JSON.parse(JSON.stringify(updatedItem, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )));
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('[API] Failed to update:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE: 删除字典或字典项
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    if (type === 'dict') {
      await prisma.sysDict.delete({
        where: { id: BigInt(id) }
      });
    } else if (type === 'item') {
      await prisma.sysDictItem.delete({
        where: { id: BigInt(id) }
      });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to delete:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
