import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CRUD_QUERY_PARAMS, DICT_FILTERS, normalizeFilter } from '@/lib/crud';
import { getOrSyncUser } from '@/lib/auth';
import { writeOperationLog } from '@/lib/audit-log';

// GET: 获取字典列表（包含字典项）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const rawLang = searchParams.get('lang'); // Get language parameter
    
    // Map URL locale to DB locale
    // Now URL locale matches DB locale (zh-CN, en-US), but keeping fallback for safety
    let lang = rawLang;
    if (rawLang === 'zh') lang = 'zh-CN';
    if (rawLang === 'en') lang = 'en-US';

    const page = Number(searchParams.get(CRUD_QUERY_PARAMS.page) || '1');
    const pageSize = Number(searchParams.get(CRUD_QUERY_PARAMS.pageSize) || '10');
    const query = searchParams.get(CRUD_QUERY_PARAMS.query) || '';
    const filter = normalizeFilter(searchParams.get(CRUD_QUERY_PARAMS.filter), DICT_FILTERS, 'all');

    if (code) {
      const dict = await prisma.sysDict.findUnique({
        where: { dictCode: code },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      });

      if (!dict) {
        return NextResponse.json({ error: 'Dictionary not found' }, { status: 404 });
      }

      // Process items to return correct label based on lang
      const processedItems = dict.items.map(item => {
        let label = item.itemLabel;
        if (lang && item.labelI18n && typeof item.labelI18n === 'object') {
          const i18n = item.labelI18n as Record<string, string>;
          if (i18n[lang]) {
            label = i18n[lang];
          }
        }
        return {
          ...item,
          itemLabel: label
        };
      });

      const response = {
        ...dict,
        items: processedItems
      };

      return NextResponse.json(JSON.parse(JSON.stringify(response, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )));
    }

    const whereFilters: Prisma.SysDictWhereInput[] = [];
    if (query.trim()) {
      whereFilters.push({
        OR: [
          { dictName: { contains: query, mode: 'insensitive' } },
          { dictCode: { contains: query, mode: 'insensitive' } },
        ],
      });
    }
    if (filter === 'system') {
      whereFilters.push({ isSystem: true });
    } else if (filter === 'custom') {
      whereFilters.push({ isSystem: false });
    }

    const whereClause = whereFilters.length ? { AND: whereFilters } : undefined;
    const skip = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);
    const take = Math.max(pageSize, 1);

    const [total, dicts] = await Promise.all([
      prisma.sysDict.count({ where: whereClause }),
      prisma.sysDict.findMany({
        where: whereClause,
        include: {
          items: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { id: 'asc' },
        skip,
        take
      })
    ]);

    const serializedDicts = JSON.parse(JSON.stringify(dicts, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({
      items: serializedDicts,
      total,
      page: Math.max(page, 1),
      pageSize: Math.max(pageSize, 1)
    });
  } catch (error) {
    console.error('[API] Failed to fetch dicts:', error);
    return NextResponse.json({ error: 'Failed to fetch dictionaries' }, { status: 500 });
  }
}

// POST: 创建字典或字典项
export async function POST(req: NextRequest) {
  try {
    const operator = await getOrSyncUser();
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
      await writeOperationLog({
        operatorId: operator?.id,
        module: 'dictionaries',
        action: 'create_dict',
        targetType: 'sys_dict',
        targetId: newDict.id,
        payload: { dictCode: data.dictCode, dictName: data.dictName },
        request: req
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
        labelI18n: data.labelI18n, // Support v0.3 JSONB
        sortOrder: data.sortOrder ?? 0,
        status: data.status ?? true
      }

      const newItem = await prisma.sysDictItem.create({
        data: itemData
      })
      await writeOperationLog({
        operatorId: operator?.id,
        module: 'dictionaries',
        action: 'create_item',
        targetType: 'sys_dict_item',
        targetId: newItem.id,
        payload: { dictCode: data.dictCode, itemValue: data.itemValue },
        request: req
      });
      return NextResponse.json(JSON.parse(JSON.stringify(newItem, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )));
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('[API] Failed to create:', error);
    await writeOperationLog({
      module: 'dictionaries',
      action: 'create',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req
    });
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

// PUT: 更新字典或字典项
export async function PUT(req: NextRequest) {
  try {
    const operator = await getOrSyncUser();
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
      await writeOperationLog({
        operatorId: operator?.id,
        module: 'dictionaries',
        action: 'update_dict',
        targetType: 'sys_dict',
        targetId: updatedDict.id,
        payload: { id, dictName: data.dictName },
        request: req
      });
      return NextResponse.json(JSON.parse(JSON.stringify(updatedDict, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )));
    }

    if (type === 'item') {
      const itemData = {
        itemLabel: data.itemLabel,
        itemValue: data.itemValue,
        labelI18n: data.labelI18n, // Support v0.3 JSONB
        sortOrder: data.sortOrder,
        status: data.status
      }

      const updatedItem = await prisma.sysDictItem.update({
        where: { id: BigInt(id) },
        data: itemData
      })
      await writeOperationLog({
        operatorId: operator?.id,
        module: 'dictionaries',
        action: 'update_item',
        targetType: 'sys_dict_item',
        targetId: updatedItem.id,
        payload: { id, itemValue: data.itemValue },
        request: req
      });
      return NextResponse.json(JSON.parse(JSON.stringify(updatedItem, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )));
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('[API] Failed to update:', error);
    await writeOperationLog({
      module: 'dictionaries',
      action: 'update',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req
    });
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE: 删除字典或字典项
export async function DELETE(req: NextRequest) {
  try {
    const operator = await getOrSyncUser();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    if (type === 'dict') {
      await prisma.sysDict.delete({
        where: { id: BigInt(id) }
      });
      await writeOperationLog({
        operatorId: operator?.id,
        module: 'dictionaries',
        action: 'delete_dict',
        targetType: 'sys_dict',
        targetId: id,
        request: req
      });
    } else if (type === 'item') {
      await prisma.sysDictItem.delete({
        where: { id: BigInt(id) }
      });
      await writeOperationLog({
        operatorId: operator?.id,
        module: 'dictionaries',
        action: 'delete_item',
        targetType: 'sys_dict_item',
        targetId: id,
        request: req
      });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to delete:', error);
    await writeOperationLog({
      module: 'dictionaries',
      action: 'delete',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req
    });
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
