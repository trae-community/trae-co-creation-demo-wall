import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const NotificationType = {
  WORK_AUDIT_APPROVED: 'work_audit_approved',
  WORK_AUDIT_REJECTED: 'work_audit_rejected',
  POSTER_AUDIT_APPROVED: 'poster_audit_approved',
  POSTER_AUDIT_REJECTED: 'poster_audit_rejected',
  WORK_LIKED: 'work_liked',
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

export type UserNotificationPayload = {
  workId?: string;
  workTitle?: string;
  posterId?: string;
  posterNickname?: string;
  actorUserId?: string;
  actorUsername?: string;
  actorAvatarUrl?: string | null;
  auditReason?: string | null;
};

export async function createUserNotification(
  userId: bigint,
  type: NotificationTypeValue,
  payload: UserNotificationPayload
) {
  return prisma.sysUserNotification.create({
    data: {
      userId,
      type,
      payload: payload as Prisma.InputJsonValue,
    },
  });
}

function auditNotificationType(
  entity: 'work' | 'poster',
  newStatus: number
): NotificationTypeValue | null {
  if (newStatus === 1) {
    return entity === 'work'
      ? NotificationType.WORK_AUDIT_APPROVED
      : NotificationType.POSTER_AUDIT_APPROVED;
  }
  if (newStatus === 2) {
    return entity === 'work'
      ? NotificationType.WORK_AUDIT_REJECTED
      : NotificationType.POSTER_AUDIT_REJECTED;
  }
  return null;
}

export async function notifyWorkAuditResult(params: {
  workId: bigint;
  newStatus: number;
  prevStatus?: number | null;
  auditReason?: string | null;
}) {
  const { workId, newStatus, prevStatus, auditReason } = params;
  if (prevStatus !== undefined && prevStatus !== null && prevStatus === newStatus) {
    return;
  }
  const type = auditNotificationType('work', newStatus);
  if (!type) return;

  const work = await prisma.workBase.findUnique({
    where: { id: workId },
    select: { userId: true, title: true },
  });
  if (!work) return;

  const reason =
    auditReason && String(auditReason).trim()
      ? String(auditReason).trim()
      : null;

  await createUserNotification(work.userId, type, {
    workId: workId.toString(),
    workTitle: work.title || '',
    auditReason: reason,
  });
}

export async function notifyWorkAuditBatch(params: {
  workIds: bigint[];
  newStatus: number;
  prevByWorkId: Map<string, number | null | undefined>;
  auditReason?: string | null;
}) {
  const { workIds, newStatus, prevByWorkId, auditReason } = params;
  const type = auditNotificationType('work', newStatus);
  if (!type) return;

  const works = await prisma.workBase.findMany({
    where: { id: { in: workIds } },
    select: { id: true, userId: true, title: true },
  });

  const reason =
    auditReason && String(auditReason).trim()
      ? String(auditReason).trim()
      : null;

  await Promise.all(
    works.map((work) => {
      const prev = prevByWorkId.get(work.id.toString());
      if (prev !== undefined && prev !== null && prev === newStatus) {
        return Promise.resolve();
      }
      return createUserNotification(work.userId, type, {
        workId: work.id.toString(),
        workTitle: work.title || '',
        auditReason: reason,
      });
    })
  );
}

export async function notifyPosterAuditResult(params: {
  posterIds: bigint[];
  newStatus: number;
  prevByPosterId?: Map<string, number>;
}) {
  const { posterIds, newStatus, prevByPosterId } = params;
  const type = auditNotificationType('poster', newStatus);
  if (!type) return;

  const posters = await prisma.workPoster.findMany({
    where: { id: { in: posterIds } },
    select: { id: true, userId: true, nickname: true, auditStatus: true },
  });

  await Promise.all(
    posters.map((poster) => {
      const prev =
        prevByPosterId?.get(poster.id.toString()) ?? poster.auditStatus;
      if (prev === newStatus) {
        return Promise.resolve();
      }
      return createUserNotification(poster.userId, type, {
        posterId: poster.id.toString(),
        posterNickname: poster.nickname,
      });
    })
  );
}

export async function notifyWorkLiked(params: {
  workId: bigint;
  ownerUserId: bigint;
  likerUserId: bigint;
  workTitle: string;
}) {
  const { workId, ownerUserId, likerUserId, workTitle } = params;
  if (ownerUserId === likerUserId) return;

  const liker = await prisma.sysUser.findUnique({
    where: { id: likerUserId },
    select: { id: true, username: true, avatarUrl: true },
  });
  if (!liker) return;

  await createUserNotification(ownerUserId, NotificationType.WORK_LIKED, {
    workId: workId.toString(),
    workTitle,
    actorUserId: liker.id.toString(),
    actorUsername: liker.username,
    actorAvatarUrl: liker.avatarUrl,
  });
}

export function serializeNotifications<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  ) as T;
}
