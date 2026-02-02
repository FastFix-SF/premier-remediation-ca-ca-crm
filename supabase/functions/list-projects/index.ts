
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type SortOption = 'newest' | 'oldest' | 'photos'

interface RequestBody {
  category?: string[] // ['Residential', 'Commercial']
  roofType?: string[] // ['Standing Seam', ...]
  sort?: SortOption
  page?: number
  pageSize?: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const body: RequestBody = await req.json().catch(() => ({}))
    const {
      category,
      roofType,
      sort = 'newest',
      page = 1,
      pageSize = 12,
    } = body

    const from = Math.max((page - 1) * pageSize, 0)
    const to = from + pageSize - 1

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('is_public', true)

    if (Array.isArray(category) && category.length > 0) {
      query = query.in('project_category', category)
    }

    if (Array.isArray(roofType) && roofType.length > 0) {
      query = query.in('roof_type', roofType)
    }

    // Sorting
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else {
      // 'newest' or 'photos' fallback (photos requires additional aggregation not implemented here)
      query = query.order('created_at', { ascending: false })
    }

    const { data, error, count } = await query.range(from, to)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        data,
        total: count ?? 0,
        page,
        pageSize,
        sort,
        applied: {
          category: category ?? null,
          roofType: roofType ?? null,
        },
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (err) {
    console.error('list-projects error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
