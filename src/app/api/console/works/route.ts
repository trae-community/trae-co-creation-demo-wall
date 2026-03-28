import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CRUD_QUERY_PARAMS } from '@/lib/crud';
import { getAuthUser } from '@/lib/auth';
import { writeOperationLog } from '@/lib/audit-log';

// Helper to sanitize object
const sanitize = (data: any) => {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

// GET: 获取作品列表或单个作品
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // 如果有 id 参数，返回单个作品详情
    if (id) {
      const work = await prisma.workBase.findUnique({
        where: { id: BigInt(id) },
        include: {
          user: { select: { username: true, email: true, avatarUrl: true } },
          tags: { include: { tag: true } },
          honors: { include: { dictItem: true } },
          statistic: true,
          detail: true,
          images: { orderBy: { sortOrder: 'asc' } },
          team: true
        }
      });

      if (!work) {
        return NextResponse.json({ error: 'Work not found' }, { status: 404 });
      }

      return NextResponse.json(sanitize(work));
    }

    const page = Number(searchParams.get(CRUD_QUERY_PARAMS.page) || '1');
    const pageSize = Number(searchParams.get(CRUD_QUERY_PARAMS.pageSize) || '10');
    const query = searchParams.get(CRUD_QUERY_PARAMS.query) || '';
    const userId = searchParams.get('userId');

    // 构建过滤条件
    const whereFilters: Prisma.WorkBaseWhereInput[] = [];
    if (userId) {
      whereFilters.push({ userId: BigInt(userId) });
    }
    if (query.trim()) {
      whereFilters.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    // Additional filters can be added here (e.g., country, city, category) if passed in searchParams

    const whereClause = whereFilters.length ? { AND: whereFilters } : undefined;
    const skip = (Math.max(page, 1) - 1) * Math.max(pageSize, 1);
    const take = Math.max(pageSize, 1);

    // 查询总数和数据
    const [total, works] = await Promise.all([
      prisma.workBase.count({ where: whereClause }),
      prisma.workBase.findMany({
        where: whereClause,
        select: {
          id: true,
          userId: true,
          title: true,
          summary: true,
          coverUrl: true,
          countryCode: true,
          cityCode: true,
          categoryCode: true,
          devStatusCode: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              username: true,
              email: true,
              avatarUrl: true
            }
          },
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          honors: {
            select: {
              id: true,
              dictItem: {
                select: {
                  id: true,
                  itemLabel: true,
                  itemValue: true,
                  labelI18n: true
                }
              }
            }
          },
          statistic: {
            select: {
              auditStatus: true,
              displayStatus: true,
              viewCount: true,
              likeCount: true,
              lastAuditAt: true
            }
          },
          detail: {
            select: {
              demoUrl: true,
              repoUrl: true
            }
          },
          images: {
            select: {
              id: true,
              imageUrl: true,
              imageType: true,
              sortOrder: true
            },
            orderBy: { sortOrder: 'asc' }
          },
          team: {
            select: {
              members: true,
              teamIntro: true,
              contactPhone: true,
              contactEmail: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ]);

    return NextResponse.json({
      items: sanitize(works),
      total,
      page: Math.max(page, 1),
      pageSize: Math.max(pageSize, 1)
    });
  } catch (error) {
    console.error('[API] Failed to fetch works:', error);
    return NextResponse.json({ error: 'Failed to fetch works' }, { status: 500 });
  }
}

// POST: 创建作品
export async function POST(req: NextRequest) {
  try {
    const operator = await getAuthUser();
    const body = await req.json();
    const { 
      userId, 
      title, 
      summary, 
      coverUrl, 
      countryCode, 
      cityCode, 
      categoryCode, 
      devStatusCode 
    } = body;

    if (!userId || !title) {
      return NextResponse.json({ error: 'User ID and Title are required' }, { status: 400 });
    }

    const newWork = await prisma.workBase.create({
      data: {
        userId: BigInt(userId),
        title,
        summary,
        coverUrl,
        countryCode,
        cityCode,
        categoryCode,
        devStatusCode,
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            avatarUrl: true
          }
        },
        statistic: true,
        team: true
      }
    });

    // Create initial statistic record
    await prisma.workStatistic.create({
      data: {
        workId: newWork.id,
        auditStatus: 0, // Pending
        displayStatus: 0, // Hidden
        viewCount: 0,
        likeCount: 0
      }
    });

    await writeOperationLog({
      operatorId: operator?.userId,
      module: 'works',
      action: 'create',
      targetType: 'work_base',
      targetId: newWork.id,
      payload: { title, userId, auditStatus: 0 },
      request: req
    });

    return NextResponse.json(sanitize(newWork));
  } catch (error) {
    console.error('[API] Failed to create work:', error);
    await writeOperationLog({
      module: 'works',
      action: 'create',
      targetType: 'work_base',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req
    });
    return NextResponse.json({ error: 'Failed to create work' }, { status: 500 });
  }
}

// PUT: 更新作品
export async function PUT(req: NextRequest) {
  try {
    const operator = await getAuthUser();
    const body = await req.json();
    const { 
      id, 
      userId,
      title, 
      summary, 
      coverUrl, 
      countryCode, 
      cityCode, 
      categoryCode, 
      devStatusCode,
      tagIds,
      honorIds,
      auditStatus,
      teamMembers,
      teamIntro,
      contactPhone,
      contactEmail
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Work ID is required' }, { status: 400 });
    }

    // If auditStatus is provided, update statistic and create log
    if (auditStatus !== undefined) {
      console.log('Updating audit status for work:', id, 'to:', auditStatus)
      const bodyAuditorId = body.auditorId ? BigInt(body.auditorId) : undefined
      const auditorId = operator?.userId ?? bodyAuditorId
      if (!auditorId) {
        return NextResponse.json({ error: 'Auditor ID is required for audit action' }, { status: 401 })
      }
      const currentStat = await prisma.workStatistic.findUnique({
        where: { workId: BigInt(id) }
      });
      
      const newStatus = Number(auditStatus)
      // Extract audit reason from body or use default
      const auditReason = body.auditReason || 'Manual update via console'

      if (!currentStat) {
        // If no statistic record exists, create one (safety fallback)
        console.warn('No statistic record found for work:', id, 'creating one')
        await prisma.workStatistic.create({
          data: {
            workId: BigInt(id),
            auditStatus: newStatus,
            displayStatus: newStatus === 1 ? 1 : 0,
            lastAuditAt: new Date()
          }
        })
        
        await prisma.$executeRaw`
          INSERT INTO "work_audit_log"
          ("work_id", "auditor_id", "prev_status", "new_status", "reason", "created_at")
          VALUES (${BigInt(id)}, ${auditorId ?? null}, ${null}, ${newStatus}, ${body.auditReason || 'Initial status creation via console'}, ${new Date()})
        `

      } else {
        // Even if status is the same, we log it if reason is provided or force it
        // This helps in debugging and also allows "re-confirming" a status with a new note
        console.log(`Audit status update request for work ${id} (Current: ${currentStat.auditStatus}, New: ${newStatus})`);
        
        // Update statistic (update timestamp anyway)
        await prisma.workStatistic.update({
          where: { workId: BigInt(id) },
          data: {
            auditStatus: newStatus,
            lastAuditAt: new Date(),
            displayStatus: newStatus === 1 ? 1 : 0 
          }
        });

        await prisma.$executeRaw`
          INSERT INTO "work_audit_log"
          ("work_id", "auditor_id", "prev_status", "new_status", "reason", "created_at")
          VALUES (${BigInt(id)}, ${auditorId ?? null}, ${currentStat.auditStatus ?? null}, ${newStatus}, ${auditReason}, ${new Date()})
        `
      }

      await writeOperationLog({
        operatorId: auditorId,
        module: 'works',
        action: 'audit',
        targetType: 'work_base',
        targetId: id,
        payload: {
          auditStatus: newStatus,
          auditReason
        },
        request: req
      });
    }

    // If tagIds is provided, update tags
    let tagUpdate = {};
    if (tagIds) {
      tagUpdate = {
        tags: {
          deleteMany: {}, // Remove all existing tags
          create: tagIds.map((tagId: number) => ({
            tag: { connect: { id: tagId } }
          }))
        }
      };
    }

    // If honorIds is provided, update honors
    let honorUpdate = {};
    if (honorIds && Array.isArray(honorIds)) {
      // Filter out invalid IDs and ensure they are BigInt
      const validHonorIds = honorIds
        .filter(id => id !== null && id !== undefined && id !== '')
        .map(id => BigInt(id));

      honorUpdate = {
        honors: {
          deleteMany: {}, // Remove all existing honors
          create: validHonorIds.map((honorItemId: bigint) => ({
            honorItemId,
            grantedAt: new Date(),
          }))
        }
      };
    }

    let teamUpdate = {};
    if (
      teamMembers !== undefined ||
      teamIntro !== undefined ||
      contactPhone !== undefined ||
      contactEmail !== undefined
    ) {
      const normalizedMembers = Array.isArray(teamMembers)
        ? teamMembers
            .map((member: any) => String(member).trim())
            .filter(Boolean)
            .map((value: string) => ({ value }))
        : [];

      const normalizedTeamIntro = typeof teamIntro === 'string' ? teamIntro.trim() : '';
      const normalizedContactPhone = typeof contactPhone === 'string' ? contactPhone.trim() : '';
      const normalizedContactEmail = typeof contactEmail === 'string' ? contactEmail.trim() : '';

      teamUpdate = {
        team: {
          upsert: {
            create: {
              members: normalizedMembers,
              teamIntro: normalizedTeamIntro || null,
              contactPhone: normalizedContactPhone || null,
              contactEmail: normalizedContactEmail || null
            },
            update: {
              members: normalizedMembers,
              teamIntro: normalizedTeamIntro || null,
              contactPhone: normalizedContactPhone || null,
              contactEmail: normalizedContactEmail || null
            }
          }
        }
      };
    }

    const updatedWork = await prisma.workBase.update({
      where: { id: BigInt(id) },
      data: {
        userId: userId ? BigInt(userId) : undefined,
        title,
        summary,
        coverUrl,
        countryCode,
        cityCode,
        categoryCode,
        devStatusCode,
        ...tagUpdate,
        ...honorUpdate,
        ...teamUpdate
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            avatarUrl: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        honors: {
          include: {
            dictItem: true
          }
        },
        statistic: true,
        detail: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        team: true
      }
    });

    await writeOperationLog({
      operatorId: operator?.userId,
      module: 'works',
      action: 'update',
      targetType: 'work_base',
      targetId: updatedWork.id,
      payload: {
        id,
        title,
        hasTagUpdate: Boolean(tagIds),
        hasHonorUpdate: Boolean(honorIds),
        hasTeamUpdate:
          teamMembers !== undefined ||
          teamIntro !== undefined ||
          contactPhone !== undefined ||
          contactEmail !== undefined
      },
      request: req
    });

    return NextResponse.json(sanitize(updatedWork));
  } catch (error) {
    console.error('[API] Failed to update work:', error);
    await writeOperationLog({
      module: 'works',
      action: 'update',
      targetType: 'work_base',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req
    });
    return NextResponse.json({ error: 'Failed to update work' }, { status: 500 });
  }
}

// DELETE: 删除作品
export async function DELETE(req: NextRequest) {
  try {
    const operator = await getAuthUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Work ID is required' }, { status: 400 });
    }

    // 检查作品是否存在，并获取作品的所有者信息
    const work = await prisma.workBase.findUnique({
      where: { id: BigInt(id) },
      select: { userId: true }
    });

    if (!work) {
      return NextResponse.json({ error: 'Work not found' }, { status: 404 });
    }

    // 权限验证：只有作品所有者或管理员/root可以删除
    const isOwner = operator && work.userId === operator.userId;
    const isAdmin = operator && operator.roles.some(r => r === 'admin' || r === 'root');

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: '您没有权限删除此作品' }, { status: 403 });
    }

    await prisma.workBase.delete({
      where: { id: BigInt(id) },
    });

    await writeOperationLog({
      operatorId: operator?.userId,
      module: 'works',
      action: 'delete',
      targetType: 'work_base',
      targetId: id,
      request: req
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to delete work:', error);
    await writeOperationLog({
      module: 'works',
      action: 'delete',
      targetType: 'work_base',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'unknown error',
      request: req
    });
    return NextResponse.json({ error: 'Failed to delete work' }, { status: 500 });
  }
}
