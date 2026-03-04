import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getOrSyncUser } from "@/lib/auth";
import { z } from "zod";


const updateSchema = z.object({
  id: z.string().min(1), // Added id to schema
  name: z.string().min(2).max(50),
  intro: z.string().min(10).max(100),
  country: z.string().min(1),
  city: z.string().min(1),
  team: z.string().min(2), // JSON stringified array
  teamIntro: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  coverUrl: z.string().min(1),
  story: z.string().min(20),
  category: z.string().min(1),
  devStatus: z.string().min(1),
  tags: z.array(z.number()).min(1).max(5),
  highlights: z.array(z.string().max(10)).min(3).max(5),
  scenarios: z.array(z.string()).min(1),
  screenshots: z.array(z.string()).min(1).max(5),
  demoUrl: z.string().url(),
  repoUrl: z.string().url().optional().or(z.literal("")),
});

export async function PUT(request: Request) {
  try {
    // 1. Authenticate user
    const user = await getOrSyncUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse and validate body
    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const workId = BigInt(data.id);

    // 3. Verify ownership
    const existingWork = await prisma.workBase.findUnique({
      where: { id: workId },
      select: { userId: true }
    });

    if (!existingWork) {
      return NextResponse.json(
        { success: false, error: "Work not found" },
        { status: 404 }
      );
    }

    if (existingWork.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // 4. Update database using transaction
    await prisma.$transaction(async (tx) => {
      // Update WorkBase
      await tx.workBase.update({
        where: { id: workId },
        data: {
          title: data.name,
          summary: data.intro,
          cityCode: data.city,
          countryCode: data.country,
          coverUrl: data.coverUrl,
          categoryCode: data.category,
          devStatusCode: data.devStatus,
          updatedAt: new Date(),
        },
      });

      // Update Tags: Delete all and re-create
      await tx.workTagRelation.deleteMany({
        where: { workId: workId }
      });
      
      if (data.tags.length > 0) {
        await tx.workTagRelation.createMany({
          data: data.tags.map(tagId => ({
            workId: workId,
            tagId: tagId
          }))
        });
      }

      // Update WorkDetail
      await tx.workDetail.upsert({
        where: { workId: workId },
        create: {
          workId: workId,
          story: data.story,
          highlights: data.highlights,
          scenarios: data.scenarios,
          demoUrl: data.demoUrl,
          repoUrl: data.repoUrl || null,
        },
        update: {
          story: data.story,
          highlights: data.highlights,
          scenarios: data.scenarios,
          demoUrl: data.demoUrl,
          repoUrl: data.repoUrl || null,
        },
      });

      // Update Screenshots: Delete all and re-create (simplest strategy for now)
      // Note: This doesn't delete files from storage, just database records
      await tx.workImage.deleteMany({
        where: { 
          workId: workId,
          imageType: "screenshot" 
        }
      });

      if (data.screenshots.length > 0) {
        await tx.workImage.createMany({
          data: data.screenshots.map((url, index) => ({
            workId: workId,
            imageUrl: url,
            imageType: "screenshot",
            sortOrder: index,
          })),
        });
      }

      // Update WorkTeam
      await tx.workTeam.upsert({
        where: { workId: workId },
        create: {
          workId: workId,
          members: data.team,
          teamIntro: data.teamIntro || null,
          contactPhone: data.contactPhone || null,
          contactEmail: data.contactEmail || null,
        },
        update: {
          members: data.team,
          teamIntro: data.teamIntro || null,
          contactPhone: data.contactPhone || null,
          contactEmail: data.contactEmail || null,
        },
      });
      
      // Reset audit status to pending on edit? 
      // Usually good practice, but keeping it simple as requested: "编辑内容即可"
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Number(searchParams.get('pageSize') || '12'));
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const lang = searchParams.get('lang') || 'zh-CN';
    const sort = searchParams.get('sort') || 'newest'; // newest, likes, views

    const cityCodes = city?.split(',').filter(Boolean) || [];
    const countryCodes = country?.split(',').filter(Boolean) || [];
    const categoryCodes = category?.split(',').filter(Boolean) || [];

    const where: Prisma.WorkBaseWhereInput = {
      // Basic filtering
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(cityCodes.length > 0 && { cityCode: { in: cityCodes } }),
      ...(countryCodes.length > 0 && { countryCode: { in: countryCodes } }),
      ...(categoryCodes.length > 0 && { categoryCode: { in: categoryCodes } }),
      
      // Tag filtering
      ...(tags && tags.length > 0 && {
        tags: {
          some: {
            tag: {
              name: { in: tags }
            }
          }
        }
      }),

      // Temporarily remove displayStatus and auditStatus checks to show all works
      // statistic: {
      //   displayStatus: 1, // Assuming 1 means published/visible
      //   auditStatus: 1,   // Assuming 1 means approved
      // }
    };

    // Sorting logic
    let orderBy: Prisma.WorkBaseOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'likes') {
      orderBy = { statistic: { likeCount: 'desc' } };
    } else if (sort === 'views') {
      orderBy = { statistic: { viewCount: 'desc' } };
    }

    const [countryDict, cityDict, categoryDict, honorDict] = await Promise.all([
      prisma.sysDict.findUnique({
        where: { dictCode: 'country' },
        include: { items: true }
      }),
      prisma.sysDict.findUnique({
        where: { dictCode: 'city' },
        include: { items: true }
      }),
      prisma.sysDict.findUnique({
        where: { dictCode: 'category_code' },
        include: { items: true }
      }),
      prisma.sysDict.findUnique({
        where: { dictCode: 'honor_type' },
        include: { items: true }
      })
    ]);

    const resolveLabelMap = (items: Array<{ itemValue: string; itemLabel: string; labelI18n: Prisma.JsonValue | null }>) => {
      return items.reduce<Record<string, string>>((acc, item) => {
        let label = item.itemLabel;
        if (item.labelI18n && typeof item.labelI18n === 'object') {
          const i18n = item.labelI18n as Record<string, string>;
          if (i18n[lang]) {
            label = i18n[lang];
          }
        }
        acc[item.itemValue] = label;
        return acc;
      }, {});
    };

    const countryLabelMap = resolveLabelMap(countryDict?.items || []);
    const cityLabelMap = resolveLabelMap(cityDict?.items || []);
    const categoryLabelMap = resolveLabelMap(categoryDict?.items || []);
    const honorLabelMap = resolveLabelMap(honorDict?.items || []);

    const [total, works] = await Promise.all([
      prisma.workBase.count({ where }),
      prisma.workBase.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              username: true,
              avatarUrl: true,
            }
          },
          statistic: {
            select: {
              viewCount: true,
              likeCount: true,
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
          team: {
            select: {
              members: true
            }
          }
        }
      })
    ]);

    // Transform data to match frontend expectations
    const items = works.map(work => ({
      id: work.id.toString(),
      name: work.title,
      intro: work.summary,
      city: cityLabelMap[work.cityCode || ''] || work.cityCode || '',
      country: countryLabelMap[work.countryCode || ''] || work.countryCode || '',
      category: categoryLabelMap[work.categoryCode || ''] || work.categoryCode || '',
      coverUrl: work.coverUrl,
      author: {
        name: work.user.username,
        avatar: work.user.avatarUrl,
      },
      team: work.team?.members,
      views: Number(work.statistic?.viewCount || 0),
      likes: Number(work.statistic?.likeCount || 0),
      tags: work.tags.map(r => r.tag.name),
      honors: work.honors
        .map((honor) => {
          if (honor.dictItem?.itemValue) {
            return honorLabelMap[honor.dictItem.itemValue] || honor.dictItem.itemLabel || '';
          }
          return '';
        })
        .filter(Boolean),
      createdAt: work.createdAt
    }));

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });

  } catch (error) {
    console.error('Failed to fetch works:', error);
    return NextResponse.json(
      { error: 'Failed to fetch works' },
      { status: 500 }
    );
  }
}
