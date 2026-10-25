import { NextResponse } from 'next/server';
import {
  fetchAuthUserFromSession,
  type AuthUser,
  isAdmin,
  isRoot,
} from '@/lib/auth';
import { isUserBanned } from '@/lib/ban';

/** 与前端/文档对齐的 API 鉴权错误码 */
export const API_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  LOGIN_REQUIRED: 'LOGIN_REQUIRED',
  USER_BANNED: 'USER_BANNED',
  FORBIDDEN: 'FORBIDDEN',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  ROOT_REQUIRED: 'ROOT_REQUIRED',
} as const;

export type AuthResolveResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: 'unauthenticated' | 'banned' };

export function isAuthResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export async function resolveAuthUser(): Promise<AuthResolveResult> {
  const user = await fetchAuthUserFromSession();
  if (!user) {
    return { ok: false, reason: 'unauthenticated' };
  }
  if (await isUserBanned(user.userId)) {
    return { ok: false, reason: 'banned' };
  }
  return { ok: true, user };
}

type DenyOptions = {
  /** C 端未登录场景使用 LOGIN_REQUIRED（如点赞） */
  loginRequired?: boolean;
  error?: string;
};

export function authDeniedResponse(
  reason: 'unauthenticated' | 'banned',
  options?: DenyOptions
): NextResponse {
  if (reason === 'banned') {
    return NextResponse.json(
      {
        success: false,
        error: options?.error ?? 'Account banned',
        code: API_ERROR_CODES.USER_BANNED,
      },
      { status: 403 }
    );
  }

  const code = options?.loginRequired
    ? API_ERROR_CODES.LOGIN_REQUIRED
    : API_ERROR_CODES.UNAUTHORIZED;

  return NextResponse.json(
    {
      success: false,
      error: options?.error ?? 'Unauthorized',
      code,
    },
    { status: 401 }
  );
}

/** 写接口：要求已登录且未封禁 */
export async function requireAuthUser(
  options?: DenyOptions
): Promise<AuthUser | NextResponse> {
  const result = await resolveAuthUser();
  if (!result.ok) {
    return authDeniedResponse(result.reason, options);
  }
  return result.user;
}

/** 管理写接口：要求 admin 或 root */
export async function requireAdmin(): Promise<AuthUser | NextResponse> {
  const userOrRes = await requireAuthUser();
  if (isAuthResponse(userOrRes)) {
    return userOrRes;
  }
  if (!isAdmin(userOrRes)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Admin access required',
        code: API_ERROR_CODES.ADMIN_REQUIRED,
      },
      { status: 403 }
    );
  }
  return userOrRes;
}

/** 仅 root 可执行的维护类写接口 */
export async function requireRoot(): Promise<AuthUser | NextResponse> {
  const userOrRes = await requireAuthUser();
  if (isAuthResponse(userOrRes)) {
    return userOrRes;
  }
  if (!isRoot(userOrRes)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Root access required',
        code: API_ERROR_CODES.ROOT_REQUIRED,
      },
      { status: 403 }
    );
  }
  return userOrRes;
}

/**
 * 可选登录：未登录返回 null；已登录但封禁返回 403 响应（用于浏览量等匿名可访问的写接口）
 */
export async function optionalAuthUser(): Promise<AuthUser | null | NextResponse> {
  const sessionUser = await fetchAuthUserFromSession();
  if (!sessionUser) {
    return null;
  }
  if (await isUserBanned(sessionUser.userId)) {
    return authDeniedResponse('banned');
  }
  return sessionUser;
}
