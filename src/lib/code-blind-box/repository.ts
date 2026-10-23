import { prisma } from '@/lib/prisma';
import { blindBoxRowToSession } from '@/lib/code-blind-box/session';
import type { BlindBoxSession } from '@/lib/code-blind-box/types';
import { drawRandomBlindBoxWords } from '@/lib/code-blind-box/words';

export async function findBlindBoxDrawByUserId(userId: bigint) {
  return prisma.codeBlindBoxDraw.findUnique({ where: { userId } });
}

export async function getBlindBoxSession(userId: bigint): Promise<BlindBoxSession> {
  const row = await findBlindBoxDrawByUserId(userId);
  return blindBoxRowToSession(row);
}

/** 抽取下一套词（最多 2 套；已确认则不再抽） */
export async function drawBlindBoxSet(userId: bigint): Promise<BlindBoxSession> {
  const existing = await findBlindBoxDrawByUserId(userId);
  const session = blindBoxRowToSession(existing);

  if (session.confirmed || session.options.length >= 2) {
    return session;
  }

  const words = drawRandomBlindBoxWords();

  if (!existing) {
    await prisma.codeBlindBoxDraw.create({
      data: {
        userId,
        themeWord1: words.themeWord,
        functionWord1: words.functionWord,
        styleWord1: words.styleWord,
      },
    });
  } else {
    await prisma.codeBlindBoxDraw.updateMany({
      where: {
        userId,
        themeWord2: null,
        chosenSlot: null,
      },
      data: {
        themeWord2: words.themeWord,
        functionWord2: words.functionWord,
        styleWord2: words.styleWord,
        drawnAt2: new Date(),
      },
    });
  }

  const updated = await findBlindBoxDrawByUserId(userId);
  return blindBoxRowToSession(updated);
}

export type ConfirmBlindBoxResult =
  | { ok: true; session: BlindBoxSession }
  | { ok: false; status: 400; error: string };

/** 二选一确认 */
export async function confirmBlindBoxSlot(
  userId: bigint,
  slot: 1 | 2
): Promise<ConfirmBlindBoxResult> {
  const existing = await findBlindBoxDrawByUserId(userId);
  if (!existing) {
    return { ok: false, status: 400, error: '请先抽卡' };
  }

  const session = blindBoxRowToSession(existing);
  if (session.confirmed) {
    return { ok: true, session };
  }
  if (!session.options.some((item) => item.slot === slot)) {
    return { ok: false, status: 400, error: '该套命题还不存在' };
  }

  await prisma.codeBlindBoxDraw.updateMany({
    where: { userId, chosenSlot: null },
    data: { chosenSlot: slot },
  });

  const updated = await findBlindBoxDrawByUserId(userId);
  return { ok: true, session: blindBoxRowToSession(updated) };
}

export async function resetBlindBoxDraw(userId: bigint): Promise<BlindBoxSession> {
  await prisma.codeBlindBoxDraw.deleteMany({ where: { userId } });
  return blindBoxRowToSession(null);
}

const blindBoxAdminInclude = {
  user: { select: { id: true, username: true, email: true } },
  work: { select: { id: true, title: true } },
} as const;

function buildBlindBoxAdminListWhere(query?: string) {
  const q = query?.trim();
  if (!q) return undefined;

  const or: object[] = [
    { user: { username: { contains: q, mode: 'insensitive' } } },
    { user: { email: { contains: q, mode: 'insensitive' } } },
  ];
  if (/^\d+$/.test(q)) {
    or.push({ userId: BigInt(q) });
  }
  return { OR: or };
}

/** 控制台：盲盒抽取记录列表（对应 code_blind_box_draw 表） */
export async function listBlindBoxDrawsForAdmin(params: {
  page: number;
  pageSize: number;
  query?: string;
}) {
  const { page, pageSize, query } = params;
  const where = buildBlindBoxAdminListWhere(query);
  const skip = (page - 1) * pageSize;

  const [rows, total] = await Promise.all([
    prisma.codeBlindBoxDraw.findMany({
      where,
      include: blindBoxAdminInclude,
      orderBy: { drawnAt1: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.codeBlindBoxDraw.count({ where }),
  ]);

  return { rows, total };
}
