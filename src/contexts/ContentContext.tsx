import { leapPrograms, type LeapProgram } from '@/data/programs'
import type { MediaPathOverrides } from '@/data/visual-assets'
import {
  contentApiReady,
  fetchHomeSections,
  fetchMediaOverrides,
  fetchPublishedPrograms,
} from '@/lib/supabase/queries'
import type { DbPageSectionRow } from '@/lib/supabase/types'
import { useQuery } from '@tanstack/react-query'
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'

type ContentContextValue = {
  apiReady: boolean
  programs: LeapProgram[]
  programsFromDb: boolean
  mediaOverrides: MediaPathOverrides
  mediaFromDb: boolean
  homeSections: Record<string, DbPageSectionRow['body']>
  homeFromDb: boolean
}

const ContentContext = createContext<ContentContextValue | null>(null)

export function ContentProvider({ children }: { children: ReactNode }) {
  const apiReady = contentApiReady()

  const programsQuery = useQuery({
    queryKey: ['content', 'programs'],
    queryFn: fetchPublishedPrograms,
    enabled: apiReady,
    staleTime: 120_000,
  })

  const mediaQuery = useQuery({
    queryKey: ['content', 'media'],
    queryFn: fetchMediaOverrides,
    enabled: apiReady,
    staleTime: 120_000,
  })

  const homeQuery = useQuery({
    queryKey: ['content', 'home-sections'],
    queryFn: fetchHomeSections,
    enabled: apiReady,
    staleTime: 120_000,
  })

  const value = useMemo<ContentContextValue>(() => {
    const homeSections: Record<string, DbPageSectionRow['body']> = {}
    for (const row of homeQuery.data ?? []) {
      homeSections[row.section_key] = row.body
    }

    return {
      apiReady,
      programs: programsQuery.data?.length ? programsQuery.data : leapPrograms,
      programsFromDb: Boolean(programsQuery.data?.length),
      mediaOverrides: mediaQuery.data ?? {},
      mediaFromDb: Boolean(mediaQuery.data && Object.keys(mediaQuery.data).length),
      homeSections,
      homeFromDb: Boolean(homeQuery.data?.length),
    }
  }, [apiReady, programsQuery.data, mediaQuery.data, homeQuery.data])

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  )
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) {
    throw new Error('useContent must be used within ContentProvider')
  }
  return ctx
}

export function useLeapPrograms() {
  return useContent().programs
}

export function useMediaOverrides() {
  return useContent().mediaOverrides
}

export function useHomeSectionBody(sectionKey: string) {
  return useContent().homeSections[sectionKey]
}