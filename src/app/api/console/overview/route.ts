import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, isAdmin } from '@/lib/auth';

type WindowDays = 7 | 30;

const toNumber = (value: unknown) => Number(value || 0);

const calcChange = (current: number, previous: number) => {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const formatDayLabel = (date: Date) => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}-${day}`;
};

const getWindowDays = (value: string | null): WindowDays => {
  if (value === '30') return 30;
  return 7;
};

export async function GET(req: NextRequest) {
  try {
    // 鉴权检查：只有管理员可以访问
    const user = await getAuthUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const windowDays = getWindowDays(searchParams.get('window'));

    // 获取数据库中最新的记录时间作为基准
    const latestAuthLog = await prisma.sysAuthLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });
    
    // 使用数据库最新时间或当前时间作为基准
    const now = latestAuthLog?.createdAt ? new Date(latestAuthLog.createdAt) : new Date();
    const currentStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const previousStart = new Date(now.getTime() - windowDays * 2 * 24 * 60 * 60 * 1000);

    const [
      totalWorks,
      currentNewWorks,
      previousNewWorks,
      totalUsers,
      currentNewUsers,
      previousNewUsers,
      currentVisits,
      previousVisits,
      currentActiveUsersRaw,
      previousActiveUsersRaw,
      signInCount,
      signUpCount,
      operationCount,
      uploadCount,
      dailyAuthRows,
      dailyUploadRows,
      registerActivities,
      uploadActivities,
    ] = await Promise.all([
      prisma.workBase.count(),
      prisma.workBase.count({
        where: { createdAt: { gte: currentStart } }
      }),
      prisma.workBase.count({
        where: { createdAt: { gte: previousStart, lt: currentStart } }
      }),
      prisma.sysUser.count(),
      prisma.sysUser.count({
        where: { createdAt: { gte: currentStart } }
      }),
      prisma.sysUser.count({
        where: { createdAt: { gte: previousStart, lt: currentStart } }
      }),
      prisma.sysAuthLog.count({
        where: { createdAt: { gte: currentStart } }
      }),
      prisma.sysAuthLog.count({
        where: { createdAt: { gte: previousStart, lt: currentStart } }
      }),
      prisma.$queryRaw<Array<{ user_count: bigint }>>`
        SELECT COUNT(DISTINCT user_id) AS user_count
        FROM sys_auth_log
        WHERE created_at >= ${currentStart}
          AND user_id IS NOT NULL
      `,
      prisma.$queryRaw<Array<{ user_count: bigint }>>`
        SELECT COUNT(DISTINCT user_id) AS user_count
        FROM sys_auth_log
        WHERE created_at >= ${previousStart}
          AND created_at < ${currentStart}
          AND user_id IS NOT NULL
      `,
      prisma.sysAuthLog.count({
        where: {
          createdAt: { gte: currentStart },
          authType: 'sign_in'
        }
      }),
      prisma.sysAuthLog.count({
        where: {
          createdAt: { gte: currentStart },
          authType: 'sign_up'
        }
      }),
      prisma.sysOperationLog.count({
        where: { createdAt: { gte: currentStart } }
      }),
      prisma.sysOperationLog.count({
        where: {
          createdAt: { gte: currentStart },
          OR: [
            { module: 'submit', action: 'create_work' },
            { module: 'works', action: 'create', targetType: 'work_base' }
          ]
        }
      }),
      prisma.$queryRaw<Array<{ day: Date; auth_count: bigint; register_count: bigint }>>`
        SELECT
          DATE(created_at) AS day,
          COUNT(*) AS auth_count,
          COUNT(*) FILTER (WHERE auth_type = 'sign_up') AS register_count
        FROM sys_auth_log
        WHERE created_at >= ${currentStart}
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `,
      prisma.$queryRaw<Array<{ day: Date; upload_count: bigint }>>`
        SELECT
          DATE(created_at) AS day,
          COUNT(*) AS upload_count
        FROM sys_operation_log
        WHERE created_at >= ${currentStart}
          AND (
            (module = 'submit' AND action = 'create_work')
            OR (module = 'works' AND action = 'create' AND target_type = 'work_base')
          )
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `,
      prisma.sysAuthLog.findMany({
        where: { authType: 'sign_up' },
        include: {
          user: {
            select: {
              username: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.sysOperationLog.findMany({
        where: {
          OR: [
            { module: 'submit', action: 'create_work' },
            { module: 'works', action: 'create', targetType: 'work_base' }
          ]
        },
        include: {
          operator: {
            select: {
              username: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
    ]);

    const currentActiveUsers = toNumber(currentActiveUsersRaw[0]?.user_count);
    const previousActiveUsers = toNumber(previousActiveUsersRaw[0]?.user_count);

    const daySeries: Array<{ date: string; label: string; visits: number; registrations: number; uploads: number }> = [];
    const authMap = new Map<string, { visits: number; registrations: number }>();
    const uploadMap = new Map<string, number>();

    for (const row of dailyAuthRows) {
      const key = new Date(row.day).toISOString().slice(0, 10);
      authMap.set(key, {
        visits: toNumber(row.auth_count),
        registrations: toNumber(row.register_count)
      });
    }

    for (const row of dailyUploadRows) {
      const key = new Date(row.day).toISOString().slice(0, 10);
      uploadMap.set(key, toNumber(row.upload_count));
    }

    for (let index = windowDays - 1; index >= 0; index -= 1) {
      const date = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
      const key = date.toISOString().slice(0, 10);
      const authData = authMap.get(key);
      daySeries.push({
        date: key,
        label: formatDayLabel(date),
        visits: authData?.visits || 0,
        registrations: authData?.registrations || 0,
        uploads: uploadMap.get(key) || 0
      });
    }

    const latestActivities = [
      ...registerActivities.map((item) => ({
        id: `register-${item.id.toString()}`,
        type: 'register',
        title: '用户注册',
        description: `${item.user?.username || item.user?.email || '未知用户'} 完成注册`,
        status: item.authStatus,
        user: item.user?.username || item.user?.email || '未知用户',
        createdAt: item.createdAt
      })),
      ...uploadActivities.map((item) => {
        const payload = item.payload && typeof item.payload === 'object'
          ? (item.payload as Record<string, unknown>)
          : null;
        const title = typeof payload?.title === 'string' && payload.title.trim()
          ? payload.title
          : `作品 #${item.targetId || '-'}`;
        return {
          id: `upload-${item.id.toString()}`,
          type: 'upload',
          title: '上传作品',
          description: `${item.operator?.username || item.operator?.email || '未知用户'} 上传了 ${title}`,
          status: item.success ? 'success' : 'failed',
          user: item.operator?.username || item.operator?.email || '未知用户',
          createdAt: item.createdAt
        };
      })
    ]
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 10);

    const distribution = [
      { label: '登录次数', value: signInCount, tip: `近${windowDays}天登录操作的总次数` },
      { label: '注册次数', value: signUpCount, tip: `近${windowDays}天注册操作的总次数` },
      { label: '上传作品次数', value: uploadCount, tip: `近${windowDays}天通过提交页或后台创建作品的总次数` },
      { label: '其他操作次数', value: Math.max(operationCount - uploadCount, 0), tip: `近${windowDays}天除上传作品外的其他后台操作次数` }
    ];

    return NextResponse.json({
      stats: {
        totalWorks: {
          label: '本周新增作品',
          value: currentNewWorks,
          change: calcChange(currentNewWorks, previousNewWorks),
          tip: `近${windowDays}天新增的作品数量，环比为对比前${windowDays}天的变化率。数据库作品总数：${totalWorks}`
        },
        activeUsers: {
          label: '本周登录用户',
          value: currentActiveUsers,
          change: calcChange(currentActiveUsers, previousActiveUsers),
          tip: `近${windowDays}天有登录记录的不重复用户数（基于认证日志去重）`
        },
        registeredUsers: {
          label: '本周新注册用户',
          value: currentNewUsers,
          change: calcChange(currentNewUsers, previousNewUsers),
          tip: `近${windowDays}天新注册的用户数，环比为对比前${windowDays}天的变化率。数据库用户总数：${totalUsers}`
        },
        systemVisits: {
          label: '本周认证事件',
          value: currentVisits,
          change: calcChange(currentVisits, previousVisits),
          tip: `近${windowDays}天认证日志的总条数（含登录、注册、失败等所有认证事件），环比为对比前${windowDays}天的变化率`
        }
      },
      trend: daySeries,
      distribution,
      latestActivities
    });
  } catch (error) {
    console.error('[API] Failed to fetch console overview:', error);
    return NextResponse.json({ error: 'Failed to fetch console overview' }, { status: 500 });
  }
}
