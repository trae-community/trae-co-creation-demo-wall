import { NextRequest, NextResponse } from "next/server";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrSyncUser } from "@/lib/auth";

const toSafeString = (value: unknown, maxLength = 255): string => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const toNullable = (value: string): string | null => {
  return value.length > 0 ? value : null;
};

const buildProfilePayload = async (
  user: {
    id: bigint;
    username: string;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    phone: string | null;
    lastSignInAt: Date | null;
  },
  metadataLocation: { country?: string; city?: string },
  roles: { id: number; roleCode: string; roleName: string }[] = []
) => {
  const works = await prisma.workBase.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      statistic: {
        select: {
          viewCount: true,
          likeCount: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  const fallbackLocation = works.find((work) => work.countryCode || work.cityCode);
  const locationCountry = toSafeString(metadataLocation.country, 100) || fallbackLocation?.countryCode || "";
  const locationCity = toSafeString(metadataLocation.city, 100) || fallbackLocation?.cityCode || "";

  const worksPayload = works.map((work) => ({
    id: work.id.toString(),
    title: work.title,
    summary: work.summary ?? "",
    coverUrl: work.coverUrl ?? "",
    countryCode: work.countryCode ?? "",
    cityCode: work.cityCode ?? "",
    createdAt: work.createdAt,
    views: Number(work.statistic?.viewCount ?? 0),
    likes: Number(work.statistic?.likeCount ?? 0),
    tags: work.tags.map((item) => item.tag.name),
  }));

  const totalViews = worksPayload.reduce((sum, work) => sum + work.views, 0);
  const totalLikes = worksPayload.reduce((sum, work) => sum + work.likes, 0);

  return {
    profile: {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio ?? "",
      phone: user.phone ?? "",
      locationCountry,
      locationCity,
      lastSignInAt: user.lastSignInAt,
      workCount: worksPayload.length,
      totalViews,
      totalLikes,
      roles,
    },
    works: worksPayload,
  };
};

export async function GET() {
  try {
    const sysUser = await getOrSyncUser();
    if (!sysUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const metadata = clerkUser?.publicMetadata ?? {};

    const roles = sysUser.roles.map((r) => ({
      id: r.role.id,
      roleCode: r.role.roleCode,
      roleName: r.role.roleName,
    }));

    const payload = await buildProfilePayload(
      {
        id: sysUser.id,
        username: sysUser.username,
        email: sysUser.email,
        avatarUrl: sysUser.avatarUrl,
        bio: sysUser.bio,
        phone: sysUser.phone,
        lastSignInAt: sysUser.lastSignInAt,
      },
      {
        country: typeof metadata.profileCountry === "string" ? metadata.profileCountry : "",
        city: typeof metadata.profileCity === "string" ? metadata.profileCity : "",
      },
      roles
    );

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[API] Failed to fetch profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sysUser = await getOrSyncUser();
    if (!sysUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const bio = toSafeString(body.bio, 500);
    const phone = toSafeString(body.phone, 50);
    const locationCountry = toSafeString(body.locationCountry, 100);
    const locationCity = toSafeString(body.locationCity, 100);

    const updatedUser = await prisma.sysUser.update({
      where: { id: sysUser.id },
      data: {
        bio: toNullable(bio),
        phone: toNullable(phone),
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        phone: true,
        lastSignInAt: true,
      },
    });

    const clerkUser = await currentUser();
    if (clerkUser) {
      const client = await clerkClient();
      await client.users.updateUserMetadata(clerkUser.id, {
        publicMetadata: {
          profileCountry: locationCountry,
          profileCity: locationCity,
        },
      });
    }

    const payload = await buildProfilePayload(updatedUser, {
      country: locationCountry,
      city: locationCity,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[API] Failed to update profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

