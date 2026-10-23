import { NextRequest, NextResponse } from 'next/server';

import { writeOperationLog } from '@/lib/audit-log';
import { getAuthUser, isRoot } from '@/lib/auth';
import { CRUD_QUERY_PARAMS } from '@/lib/crud';
import {
  listBlindBoxDrawsForAdmin,
  resetBlindBoxDraw,
} from '@/lib/code-blind-box/repository';

function mapBlindBoxDrawRow(row: Awaited<
  ReturnType<typeof listBlindBoxDrawsForAdmin>
>['rows'][number]) {
  const set2 =
    row.themeWord2 && row.functionWord2 && row.styleWord2
      ? {
          theme: row.themeWord2,
          function: row.functionWord2,
          style: row.styleWord2,
          drawnAt: row.drawnAt2?.toISOString() ?? null,
        }
      : null;

  return {
    id: row.id.toString(),
    userId: row.userId.toString(),
    username: row.user.username,
    email: row.user.email,
    set1: {
      theme: row.themeWord1,
      function: row.functionWord1,
      style: row.styleWord1,
      drawnAt: row.drawnAt1.toISOString(),
    },
    set2,
    chosenSlot: row.chosenSlot,
    confirmed: row.chosenSlot != null,
    workId: row.workId?.toString() ?? null,
    workTitle: row.work?.title ?? null,
  };
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!isRoot(user)) {
    return NextResponse.json({ error: 'Forbidden: Root access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get(CRUD_QUERY_PARAMS.page) || '1', 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get(CRUD_QUERY_PARAMS.pageSize) || '20', 10))
  );
  const query = searchParams.get(CRUD_QUERY_PARAMS.query) || '';

  const { rows, total } = await listBlindBoxDrawsForAdmin({ page, pageSize, query });

  return NextResponse.json({
    items: rows.map(mapBlindBoxDrawRow),
    total,
  });
}

export async function DELETE(req: NextRequest) {
  const operator = await getAuthUser();
  if (!isRoot(operator)) {
    return NextResponse.json({ error: 'Forbidden: Root access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userIdRaw = searchParams.get('userId')?.trim();
  if (!userIdRaw || !/^\d+$/.test(userIdRaw)) {
    return NextResponse.json({ error: '缺少有效的 userId' }, { status: 400 });
  }

  const userId = BigInt(userIdRaw);

  try {
    await resetBlindBoxDraw(userId);
    await writeOperationLog({
      operatorId: operator?.userId,
      module: 'code_blind_box',
      action: 'reset_draw',
      targetType: 'user',
      targetId: userIdRaw,
      request: req,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Console] code blind box reset failed:', error);
    await writeOperationLog({
      operatorId: operator?.userId,
      module: 'code_blind_box',
      action: 'reset_draw',
      targetType: 'user',
      targetId: userIdRaw,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown',
      request: req,
    });
    return NextResponse.json({ error: '重置失败' }, { status: 500 });
  }
}
