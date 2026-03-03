'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export type FeedbackState = {
  type: 'success' | 'error' | 'info'
  message: string
}

interface CrudFeedbackProps {
  feedback: FeedbackState | null
}

export function CrudFeedback({ feedback }: CrudFeedbackProps) {
  if (!feedback) return null

  return (
    <Card className="border-border bg-card/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <Badge
          className={
            feedback.type === 'success'
              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
              : feedback.type === 'error'
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : 'bg-secondary text-secondary-foreground border border-border'
          }
        >
          {feedback.type === 'success' ? '成功' : feedback.type === 'error' ? '失败' : '提示'}
        </Badge>
        <span className="text-sm text-muted-foreground">{feedback.message}</span>
      </div>
    </Card>
  )
}
