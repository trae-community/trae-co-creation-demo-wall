import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { writeAuthLog, writeOperationLog } from "@/lib/audit-log";

type ClerkUserPayload = {
  id: string;
  email_addresses: { email_address: string; id: string }[];
  username: string | null;
  image_url: string;
  password_enabled: boolean;
  external_accounts: {
    provider: string;
    provider_user_id: string;
    email_address?: string;
    username?: string;
  }[];
  last_sign_in_at: number | null;
  public_metadata: Record<string, unknown>;
};

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Webhook] CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();

  const wh = new Webhook(secret);
  let event: { type: string; data: ClerkUserPayload };

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;
  console.log(`[Webhook] Received event: ${type} for user ${data.id}`);

  try {
    if (type === "user.created") {
      await handleUserCreated(data, req);
    } else if (type === "user.updated") {
      await handleUserUpdated(data);
    }
  } catch (err) {
    console.error(`[Webhook] Error handling ${type}:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleUserCreated(data: ClerkUserPayload, req: Request) {
  const email = data.email_addresses[0]?.email_address;
  if (!email) {
    console.warn("[Webhook] user.created: no email, skipping");
    return;
  }

  const username =
    data.username || email.split("@")[0] || `user_${data.id.substring(0, 8)}`;
  const identities = data.external_accounts.map((a) => ({
    provider: a.provider,
    providerUserId: a.provider_user_id,
    email: a.email_address,
    username: a.username,
  }));
  const passwordHashValue = data.password_enabled ? "managed_by_clerk" : null;

  // Create user
  const sysUser = await prisma.sysUser.upsert({
    where: { clerkId: data.id },
    update: {
      email,
      username,
      avatarUrl: data.image_url,
      lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : new Date(),
      identities: identities as object,
      passwordHash: passwordHashValue,
    },
    create: {
      clerkId: data.id,
      email,
      username,
      avatarUrl: data.image_url,
      lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : new Date(),
      identities: identities as object,
      passwordHash: passwordHashValue,
    },
    include: { roles: { include: { role: true } } },
  });

  // Assign default 'common' role if none
  let finalUser = sysUser;
  if (sysUser.roles.length === 0) {
    const commonRole = await prisma.sysRole.findUnique({ where: { roleCode: "common" } });
    if (commonRole) {
      await prisma.sysUserRole.upsert({
        where: { userId_roleId: { userId: sysUser.id, roleId: commonRole.id } },
        update: {},
        create: { userId: sysUser.id, roleId: commonRole.id },
      });
      finalUser = (await prisma.sysUser.findUnique({
        where: { id: sysUser.id },
        include: { roles: { include: { role: true } } },
      })) as typeof sysUser;
    }
  }

  // Sync userId + roles to Clerk JWT publicMetadata
  const roleCodes = finalUser.roles.map((r) => r.role.roleCode);
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(data.id, {
      publicMetadata: {
        userId: finalUser.id.toString(),
        roles: roleCodes,
      },
    });
  } catch (err) {
    console.error("[Webhook] Failed to update Clerk metadata:", err);
  }

  await writeAuthLog({
    userId: finalUser.id,
    clerkId: data.id,
    authType: "sign_up",
    authChannel: "clerk",
    authStatus: "success",
    metadata: { email, providers: data.external_accounts.map((a) => a.provider) },
    request: req as Parameters<typeof writeAuthLog>[0]["request"],
  });

  await writeOperationLog({
    operatorId: finalUser.id,
    module: "auth",
    action: "sign_up",
    targetType: "sys_user",
    targetId: finalUser.id,
    payload: { clerkId: data.id },
    request: req as Parameters<typeof writeOperationLog>[0]["request"],
  });

  console.log(`[Webhook] user.created: DB user ${finalUser.id} created with roles [${roleCodes.join(", ")}]`);
}

async function handleUserUpdated(data: ClerkUserPayload) {
  const email = data.email_addresses[0]?.email_address;
  if (!email) return;

  const username =
    data.username || email.split("@")[0] || `user_${data.id.substring(0, 8)}`;

  const existing = await prisma.sysUser.findUnique({
    where: { clerkId: data.id },
    select: { id: true, email: true, username: true, avatarUrl: true },
  });

  if (!existing) {
    console.warn(`[Webhook] user.updated: user ${data.id} not found in DB, skipping`);
    return;
  }

  // Only write if something actually changed
  if (
    existing.email === email &&
    existing.username === username &&
    existing.avatarUrl === data.image_url
  ) {
    console.log(`[Webhook] user.updated: no changes for user ${data.id}`);
    return;
  }

  await prisma.sysUser.update({
    where: { clerkId: data.id },
    data: { email, username, avatarUrl: data.image_url },
  });

  console.log(`[Webhook] user.updated: DB user ${existing.id} updated`);
}
