import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full user record from DB (bio, phone, roles — not in JWT)
    const sysUser = await prisma.sysUser.findUnique({
      where: { id: authUser.userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!sysUser) {
      return NextResponse.json(
        { error: "Account setup in progress, please retry in a moment." },
        { status: 503 }
      );
    }

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
      {},
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
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const username = toSafeString(body.username, 50);
    const bio = toSafeString(body.bio, 500);
    const phone = toSafeString(body.phone, 50);
    const locationCountry = toSafeString(body.locationCountry, 100);
    const locationCity = toSafeString(body.locationCity, 100);

    // Validate username
    if (username.length < 2 || username.length > 20) {
      return NextResponse.json({ error: "用户名长度需在 2-20 个字符之间" }, { status: 400 });
    }

    const updatedUser = await prisma.sysUser.update({
      where: { id: authUser.userId },
      data: {
        username,
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
