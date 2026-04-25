import { useQuery } from '@tanstack/react-query'
import { Work } from '@/lib/types'

interface WorksParams {
  page: number
  pageSize: number
  search?: string
  sort?: string
  lang?: string
  city?: string
  country?: string
  category?: string
  tags?: string
  date?: string
  honor?: string
}

interface WorksResponse {
  items: Work[]
  total: number
  totalPages: number
}

export function useWorks(params: WorksParams) {
  return useQuery({
    queryKey: ['works', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, String(value))
      })

      const response = await fetch(`/api/works?${searchParams}`)
      if (!response.ok) throw new Error('Failed to fetch works')
      return response.json() as Promise<WorksResponse>
    },
    staleTime: 2 * 60 * 1000, // 2分钟
  })
}
