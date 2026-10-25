import { prisma } from '@/lib/prisma';

export async function fetchWorkLikesPage(params: {
  workId: bigint;
  page: number;
  pageSize: number;
}) {
  const { workId, page, pageSize } = params;
  const skip = (page - 1) * pageSize;

  const [total, likes] = await Promise.all([
    prisma.workLike.count({ where: { workId } }),
    prisma.workLike.findMany({
      where: { workId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  const items = likes.map((like) => ({
    id: like.id.toString(),
    likedAt: like.createdAt,
    user: {
      id: like.user.id.toString(),
      username: like.user.username,
      avatarUrl: like.user.avatarUrl,
    },
  }));

  return { total, items, page, pageSize };
}
