
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrSyncUser } from "@/lib/auth";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

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
  coverUrl: z.string().min(1), // Base64 string expected
  story: z.string().min(20),
  highlights: z.array(z.string().max(10)).min(3).max(5),
  scenarios: z.array(z.string()).min(1),
  screenshots: z.array(z.string()).min(1).max(5),
  demoUrl: z.string().url(),
  repoUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(request: Request) {
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
    const validationResult = submissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 3. Handle image upload (Base64 -> File)
    const processImage = async (dataUrl: string) => {
      if (dataUrl.startsWith("data:image")) {
        try {
          const matches = dataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const ext = matches[1];
            const buffer = Buffer.from(matches[2], "base64");
            const fileName = `${uuidv4()}.${ext}`;
            const uploadDir = path.join(process.cwd(), "public", "uploads");
            await fs.mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, fileName);
            await fs.writeFile(filePath, buffer);
            return `/uploads/${fileName}`;
          }
        } catch (error) {
          console.error("Image processing error:", error);
          throw new Error("Failed to process image");
        }
      }
      return dataUrl;
    };

    let coverUrl = await processImage(data.coverUrl);
    const screenshots = await Promise.all(data.screenshots.map(processImage));

    // 4. Save to database using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create WorkBase
      const work = await tx.workBase.create({
        data: {
          userId: user.id,
          title: data.name,
          summary: data.intro,
          cityCode: data.city,
          countryCode: data.country,
          coverUrl: coverUrl,
          // Optional fields left as null/default
        },
      });

      // Create WorkDetail
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

      // Create WorkImage
      if (screenshots.length > 0) {
        await tx.workImage.createMany({
          data: screenshots.map((url, index) => ({
            workId: work.id,
            imageUrl: url,
            imageType: "screenshot",
            sortOrder: index,
          })),
        });
      }

      // Create WorkTeam
      await tx.workTeam.create({
        data: {
          workId: work.id,
          members: data.team,
          teamIntro: data.teamIntro || null,
          contactPhone: data.contactPhone || null,
          contactEmail: data.contactEmail || null,
        },
      });

      // Initialize WorkStatistic
      await tx.workStatistic.create({
        data: {
          workId: work.id,
          auditStatus: 0, // Pending
          displayStatus: 0, // Hidden
          viewCount: 0,
          likeCount: 0,
        },
      });

      return work;
    });

    // Return success with ID (serialized to string for BigInt safety)
    return NextResponse.json({ 
      success: true, 
      id: result.id.toString() 
    });

  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
