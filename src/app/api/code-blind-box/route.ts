import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { isCodeBlindBoxDevTools, isCodeBlindBoxEnabled } from '@/lib/code-blind-box/config';
import {
  confirmBlindBoxSlot,
  drawBlindBoxSet,
  getBlindBoxSession,
  resetBlindBoxDraw,
} from '@/lib/code-blind-box/repository';
import type { BlindBoxSession } from '@/lib/code-blind-box/types';

function featureDisabled() {
  return NextResponse.json({ error: '活动未开启' }, { status: 404 });
}

function sessionResponse(session: BlindBoxSession) {
  return NextResponse.json(session);
}

export async function GET() {
  if (!isCodeBlindBoxEnabled()) return featureDisabled();

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = await getBlindBoxSession(user.userId);
    return sessionResponse(session);
  } catch (error) {
    console.error('[API] code-blind-box GET failed:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

/** 抽取下一套词（最多 2 套；已确认则不再抽） */
export async function POST() {
  if (!isCodeBlindBoxEnabled()) return featureDisabled();

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = await drawBlindBoxSet(user.userId);
    return sessionResponse(session);
  } catch (error) {
    console.error('[API] code-blind-box draw failed:', error);
    return NextResponse.json({ error: '抽取失败，请重试' }, { status: 500 });
  }
}

/** 二选一确认 */
export async function PATCH(req: NextRequest) {
  if (!isCodeBlindBoxEnabled()) return featureDisabled();

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const slot = Number(body.slot);
    if (slot !== 1 && slot !== 2) {
      return NextResponse.json({ error: '请选择第 1 或第 2 套命题' }, { status: 400 });
    }

    const result = await confirmBlindBoxSlot(user.userId, slot);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return sessionResponse(result.session);
  } catch (error) {
    console.error('[API] code-blind-box confirm failed:', error);
    return NextResponse.json({ error: '确认失败，请重试' }, { status: 500 });
  }
}

/** 开发测试：清空当前用户抽卡记录 */
export async function DELETE() {
  if (!isCodeBlindBoxEnabled()) return featureDisabled();
  if (!isCodeBlindBoxDevTools()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = await resetBlindBoxDraw(user.userId);
    return sessionResponse(session);
  } catch (error) {
    console.error('[API] code-blind-box reset failed:', error);
    return NextResponse.json({ error: '重置失败' }, { status: 500 });
  }
}
