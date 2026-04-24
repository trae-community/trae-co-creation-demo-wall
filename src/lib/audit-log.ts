import { prisma } from '@/lib/prisma'

type IdLike = bigint | number | string | null | undefined

const normalizeId = (value: IdLike) => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  try {
    return BigInt(value)
  } catch {
    return null
  }
}

const getHeaderValue = (headers: Headers, name: string) => {
  const value = headers.get(name)
  return value?.trim() || null
}

const getClientIp = (headers: Headers) => {
  const forwardedFor = getHeaderValue(headers, 'x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }
  return (
    getHeaderValue(headers, 'x-real-ip') ||
    getHeaderValue(headers, 'cf-connecting-ip') ||
    getHeaderValue(headers, 'x-client-ip')
  )
}

const toSafeJson = (value: unknown) =>
  JSON.parse(
    JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item))
  )

type RequestLike = {
  headers: Headers
  method?: string
  nextUrl?: { pathname?: string }
  url?: string
}

const getRequestMeta = (request?: RequestLike) => {
  if (!request) {
    return {
      ipAddress: null,
      userAgent: null,
      requestMethod: null,
      requestPath: null
    }
  }

  const requestPath = request.nextUrl?.pathname
    ? request.nextUrl.pathname
    : request.url
      ? new URL(request.url).pathname
      : null

  return {
    ipAddress: getClientIp(request.headers),
    userAgent: getHeaderValue(request.headers, 'user-agent'),
    requestMethod: request.method || null,
    requestPath
  }
}

type AuthLogInput = {
  userId?: IdLike
  clerkId?: string | null
  authType: string
  authChannel?: string | null
  authStatus?: string
  metadata?: unknown
  request?: RequestLike
}

export async function writeAuthLog(input: AuthLogInput) {
  try {
    const meta = getRequestMeta(input.request)
    await prisma.sysAuthLog.create({
      data: {
        userId: normalizeId(input.userId),
        clerkId: input.clerkId || null,
        authType: input.authType,
        authChannel: input.authChannel || 'credentials',
        authStatus: input.authStatus || 'success',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: input.metadata ? toSafeJson(input.metadata) : undefined
      }
    })
  } catch (error) {
    console.error('[AuditLog] Failed to write auth log:', error)
  }
}

type OperationLogInput = {
  operatorId?: IdLike
  module: string
  action: string
  targetType?: string | null
  targetId?: string | number | bigint | null
  success?: boolean
  errorMessage?: string | null
  payload?: unknown
  request?: RequestLike
}

export async function writeOperationLog(input: OperationLogInput) {
  try {
    const meta = getRequestMeta(input.request)
    await prisma.sysOperationLog.create({
      data: {
        operatorId: normalizeId(input.operatorId),
        module: input.module,
        action: input.action,
        targetType: input.targetType || null,
        targetId:
          input.targetId === null || input.targetId === undefined
            ? null
            : String(input.targetId),
        success: input.success ?? true,
        errorMessage: input.errorMessage || null,
        requestMethod: meta.requestMethod,
        requestPath: meta.requestPath,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        payload: input.payload ? toSafeJson(input.payload) : undefined
      }
    })
  } catch (error) {
    console.error('[AuditLog] Failed to write operation log:', error)
  }
}
