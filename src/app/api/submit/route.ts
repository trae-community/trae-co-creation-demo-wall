
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrSyncUser } from "@/lib/auth";
import { writeOperationLog } from "@/lib/audit-log";
import { z } from "zod";

// Schema matching the frontend form
const submissionSchema = z.object({
  name: z.string().min(2).max(50),
  intro: z.string().min(10).max(100),
  country: z.string().min(1),
  city: z.string().min(1),
  team: z.string().min(2),
  teamIntro: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  coverUrl: z.string().min(1), // URL string expected
  story: z.string().min(20),
  category: z.string().min(1),
  devStatus: z.string().optional(),
  tags: z.array(z.number()).min(1).max(5),
  highlights: z.array(z.string().max(10)).min(3).max(5),
  scenarios: z.array(z.string()).min(1),
  screenshots: z.array(z.string()).min(1).max(5),
  demoUrl: z.string().url(),
  repoUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const user = await getOrSyncUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = submissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const work = await tx.workBase.create({
        data: {
          userId: user.id,
          title: data.name,
          summary: data.intro,
          cityCode: data.city,
          countryCode: data.country,
          coverUrl: data.coverUrl,
          categoryCode: data.category,
          devStatusCode: data.devStatus,
          // Optional fields left as null/default
        },
      });

      const autoAuditTags = await tx.workTag.findMany({
        where: {
          id: { in: data.tags },
          isAutoAudit: true,
          OR: [{ auditStartTime: null }, { auditStartTime: { lte: now } }],
          AND: [{ OR: [{ auditEndTime: null }, { auditEndTime: { gte: now } }] }]
        },
        select: {
          id: true,
          name: true
        }
      });

      const isAutoApproved = autoAuditTags.length > 0;

      if (data.tags.length > 0) {
        await tx.workTagRelation.createMany({
          data: data.tags.map(tagId => ({
            workId: work.id,
            tagId: tagId
          }))
        });
      }

      await tx.workDetail.create({
        data: {
          workId: work.id,
          story: data.story,
          highlights: data.highlights,
          scenarios: data.scenarios,
          demoUrl: data.demoUrl,
          repoUrl: data.repoUrl || null,
        },
      });

      if (data.screenshots.length > 0) {
        await tx.workImage.createMany({
          data: data.screenshots.map((url, index) => ({
            workId: work.id,
            imageUrl: url,
            imageType: "screenshot",
            sortOrder: index,
          })),
        });
      }

      await tx.workTeam.create({
        data: {
          workId: work.id,
          members: data.team,
          teamIntro: data.teamIntro || null,
          contactPhone: data.contactPhone || null,
          contactEmail: data.contactEmail || null,
        },
      });

      await tx.workStatistic.create({
        data: {
          workId: work.id,
          auditStatus: isAutoApproved ? 1 : 0,
          displayStatus: isAutoApproved ? 1 : 0,
          lastAuditAt: isAutoApproved ? now : null,
          viewCount: 0,
          likeCount: 0
        },
      });

      if (isAutoApproved) {
        await tx.workAuditLog.create({
          data: {
            workId: work.id,
            auditorId: null,
            prevStatus: 0,
            newStatus: 1,
            reason: `Auto approved by system via tags: ${autoAuditTags.map(tag => tag.name).join(", ")}`
          }
        });
      }
      return {
        work,
        isAutoApproved,
        autoAuditTags
      };
    });

    await writeOperationLog({
      operatorId: user.id,
      module: "submit",
      action: "create_work",
      targetType: "work_base",
      targetId: result.work.id,
      payload: {
        title: data.name,
        category: data.category,
        autoApproved: result.isAutoApproved,
        autoAuditTags: result.autoAuditTags.map(tag => tag.name)
      },
      request
    });

    if (result.isAutoApproved) {
      await writeOperationLog({
        module: "submit",
        action: "auto_audit",
        targetType: "work_base",
        targetId: result.work.id,
        payload: {
          auditStatus: 1,
          displayStatus: 1,
          auditor: "system",
          tags: result.autoAuditTags.map(tag => tag.name)
        },
        request
      });
    }

    return NextResponse.json({ 
      success: true, 
      id: result.work.id.toString(),
      auditStatus: result.isAutoApproved ? 1 : 0,
      displayStatus: result.isAutoApproved ? 1 : 0,
      autoApproved: result.isAutoApproved
    });

  } catch (error) {
    console.error("Submission error:", error);
    await writeOperationLog({
      module: "submit",
      action: "create_work",
      targetType: "work_base",
      success: false,
      errorMessage: error instanceof Error ? error.message : "unknown error",
      request
    });
    return NextResponse.json(
      { success: false, error: error },
      { status: 500 }
    );
  }
}
