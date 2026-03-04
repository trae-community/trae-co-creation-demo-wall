import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrSyncUser } from "@/lib/auth";
import { z } from "zod";

// Schema matching the frontend form (reused from submit/route.ts but could be shared)
const updateSchema = z.object({
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Authenticate user
    const user = await getOrSyncUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Verify ownership
    const existingWork = await prisma.workBase.findUnique({
      where: { id: BigInt(id) },
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

    // 3. Parse and validate body
    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 4. Update database using transaction
    await prisma.$transaction(async (tx) => {
      const workId = BigInt(id);

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
