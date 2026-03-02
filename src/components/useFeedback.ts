'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FeedbackState } from '@/components/CrudFeedback'

export function useFeedback(timeout = 2500) {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showFeedback = useCallback((type: FeedbackState['type'], message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setFeedback({ type, message })
    timerRef.current = setTimeout(() => setFeedback(null), timeout)
  }, [timeout])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { feedback, showFeedback }
}
