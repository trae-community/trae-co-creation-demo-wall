/**
 * 客户端 IP 解析：仅在 TRUST_PROXY=1 时信任反代头（X-Forwarded-For 等）。
 * 直连或未配置时返回 null，避免伪造 IP 误导运营风控。
 */

export function isTrustProxyEnabled(): boolean {
  const raw = process.env.TRUST_PROXY?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export type ResolvedClientIp = {
  /** 用于写入日志的 IP；不可信环境下常为 null */
  address: string | null;
  /** 是否已启用 TRUST_PROXY 并从反代头解析 */
  trusted: boolean;
  /** 原始 X-Forwarded-For（仅 trusted 时有值，供管理端排障） */
  forwardedFor: string | null;
};

const getHeaderValue = (headers: Headers, name: string) => {
  const value = headers.get(name);
  return value?.trim() || null;
};

const isLikelyIp = (value: string) => {
  if (!value) return false;
  if (value.includes(':')) {
    return /^[\da-f:.]+$/i.test(value);
  }
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
};

export function resolveClientIp(headers: Headers): ResolvedClientIp {
  if (!isTrustProxyEnabled()) {
    return { address: null, trusted: false, forwardedFor: null };
  }

  const forwardedFor = getHeaderValue(headers, 'x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first && isLikelyIp(first)) {
      return { address: first, trusted: true, forwardedFor };
    }
  }

  const fallback =
    getHeaderValue(headers, 'x-real-ip') ||
    getHeaderValue(headers, 'cf-connecting-ip');

  if (fallback && isLikelyIp(fallback)) {
    return { address: fallback, trusted: true, forwardedFor };
  }

  return { address: null, trusted: true, forwardedFor };
}

/** @deprecated 使用 resolveClientIp；保留别名供少量调用方 */
export function getClientIpFromHeaders(headers: Headers): string | null {
  return resolveClientIp(headers).address;
}
