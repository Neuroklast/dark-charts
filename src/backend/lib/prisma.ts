import { supabase } from '@/lib/supabase/client'

export const prisma = {
  chartEntry: {
    async findMany(options: {
      where?: { weekStart?: Date }
      orderBy?: { placement?: 'asc' | 'desc' }
      include?: unknown
    }) {
      let query = supabase
        .from('chart_entries')
        .select('*, release:releases(*, artist:artists(*))')

      if (options.where?.weekStart) {
        query = query.eq('weekStart', options.where.weekStart.toISOString())
      }

      if (options.orderBy?.placement) {
        query = query.order('placement', { ascending: options.orderBy.placement === 'asc' })
      }

      const { data, error } = await query
      if (error) {
        throw new Error(error.message)
      }

      return (data ?? []).map((entry: any) => ({
        ...entry,
        weekStart: new Date(entry.weekStart),
        createdAt: new Date(entry.createdAt),
        release: entry.release
          ? {
              ...entry.release,
              releaseDate: new Date(entry.release.releaseDate),
              createdAt: new Date(entry.release.createdAt),
              updatedAt: new Date(entry.release.updatedAt),
              artist: entry.release.artist
                ? {
                    ...entry.release.artist,
                    createdAt: new Date(entry.release.artist.createdAt),
                    updatedAt: new Date(entry.release.artist.updatedAt),
                  }
                : null,
            }
          : null,
      }))
    },
  },
}

export default prisma
