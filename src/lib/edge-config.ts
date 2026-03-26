import { get } from '@vercel/edge-config'

export async function getDictionaries() {
  try {
    const cached = await get('dictionaries')
    if (cached) return cached
    return null
  } catch {
    return null
  }
}
