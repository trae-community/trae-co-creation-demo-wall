'use client'

import { WorksManagement } from '@/components/work/works-management'

export default function WorksPage() {
  return (
    <WorksManagement 
      scope="admin" 
      allowedActions={['view', 'edit', 'audit', 'tag', 'honor', 'delete']} 
    />
  )
}
