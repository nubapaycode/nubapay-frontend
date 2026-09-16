'use client'

import { createContext, useContext } from 'react'

import type { WorkspaceSectionAccess } from '@/lib/organizerWorkspaceSections'

export type WorkspaceAccess = WorkspaceSectionAccess & {
  basePath: string
  /** Cuenta partner habilitada para Marca y dominios. */
  partnerBrand: boolean
}

const WorkspaceAccessContext = createContext<WorkspaceAccess | null>(null)

/** Lo provee `EventOrganizerShell` con los permisos ya resueltos del evento. */
export const WorkspaceAccessProvider = WorkspaceAccessContext.Provider

export function useWorkspaceAccess() {
  return useContext(WorkspaceAccessContext)
}
