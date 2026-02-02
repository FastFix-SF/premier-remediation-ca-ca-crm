import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlandCall {
  call_id: string
  to: string
  from: string
  status: string
  started_at?: string
  completed_at?: string
  answered?: boolean
  duration?: number
}

interface BlandCallDetail {
  call_id: string
  summary?: string
  concatenated_transcript?: string
  transcripts?: any[]
  status: string
  started_at?: string
  completed_at?: string 
  from: string
  to: string
  answered?: boolean
  duration?: number
  recording_url?: string
}

interface SyncResponse {
  success: boolean
  step?: string
  message: string
  synced?: number
  total?: number
}

Deno.serve(async (req) => {
  console.log('Bland sync function called with method:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const blandApiKey = Deno.env.get('BLAND_API_KEY')
    if (!blandApiKey) {
      console.error('BLAND_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ 
          success: false,
          step: "env", 
          message: "Missing BLAND_API_KEY" 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('API Key present:', blandApiKey ? 'Yes (length: ' + blandApiKey.length + ')' : 'No')

    // Parse request body to get date filters
    let startDate: string
    let endDate: string
    
    try {
      const body = req.method === 'POST' ? await req.json() : {}
      startDate = body.start_date || new Date(Date.now() - 14*24*60*60*1000).toISOString()
      endDate = body.end_date || new Date().toISOString()
    } catch {
      // Default to 14 days if parsing fails
      startDate = new Date(Date.now() - 14*24*60*60*1000).toISOString()
      endDate = new Date().toISOString()
    }

    console.log('Date range:', { startDate, endDate })

    // Step A: Get call list with date filters
    const apiUrl = 'https://api.bland.ai/v1/calls'
    const listParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    })
    const listUrl = `${apiUrl}?${listParams}`
    
    console.log('Fetching calls list from:', listUrl)

    const requestHeaders = {
      'authorization': blandApiKey, // Direct API key format as per docs
      'Content-Type': 'application/json',
    }
    
    console.log('Request headers:', JSON.stringify({ ...requestHeaders, authorization: '[REDACTED]' }, null, 2))

    // Fetch calls list with timeout and retry
    let blandResponse: Response
    let attempts = 0
    const maxAttempts = 2

    while (attempts < maxAttempts) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

        blandResponse = await fetch(listUrl, {
          method: 'GET',
          headers: requestHeaders,
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        
        if (blandResponse.ok || blandResponse.status < 500) {
          break // Success or client error (don't retry)
        }
        
        if (blandResponse.status >= 500 && attempts < maxAttempts - 1) {
          console.log(`Server error ${blandResponse.status}, retrying...`)
          attempts++
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
          continue
        }
        
        break
      } catch (error) {
        const errorName = error instanceof Error ? error.name : 'unknown';
        if (errorName === 'AbortError') {
          console.error('Request timed out after 30 seconds')
          return new Response(
            JSON.stringify({ 
              success: false,
              step: "bland-list", 
              message: "Request timed out" 
            }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        
        if (attempts < maxAttempts - 1) {
          console.log('Network error, retrying...', error)
          attempts++
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        
        throw error
      }
    }

    if (!blandResponse!.ok) {
      const errorText = await blandResponse!.text()
      console.error('Bland AI API error response:', {
        status: blandResponse!.status,
        statusText: blandResponse!.statusText,
        headers: Object.fromEntries(blandResponse!.headers.entries()),
        body: errorText.substring(0, 500)
      })

      const step = blandResponse!.status === 401 ? "auth" : "bland-list"
      const message = blandResponse!.status === 401 
        ? "Unauthorized — check BLAND_API_KEY"
        : `Bland AI error: ${blandResponse!.status} ${errorText.substring(0, 100)}`

      return new Response(
        JSON.stringify({ 
          success: false,
          step, 
          message 
        }),
        { 
          status: blandResponse!.status >= 500 ? 500 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const blandData = await blandResponse!.json()
    let calls: BlandCall[] = blandData.calls || []

    console.log(`Found ${calls.length} calls from Bland AI`)

    // Handle pagination if needed
    let nextPage = blandData.next_page_token || blandData.pagination?.next
    while (nextPage && calls.length < 1000) { // Safety limit
      console.log('Fetching next page:', nextPage)
      
      const nextParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        page_token: nextPage
      })
      const nextUrl = `${apiUrl}?${nextParams}`
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        const nextResponse = await fetch(nextUrl, {
          method: 'GET',
          headers: requestHeaders,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (nextResponse.ok) {
          const nextData = await nextResponse.json()
          const nextCalls = nextData.calls || []
          calls = [...calls, ...nextCalls]
          nextPage = nextData.next_page_token || nextData.pagination?.next
          console.log(`Fetched ${nextCalls.length} more calls, total: ${calls.length}`)
        } else {
          console.log('Failed to fetch next page, continuing with current calls')
          break
        }
      } catch (error) {
        console.log('Error fetching next page:', error)
        break
      }
    }

    if (calls.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No calls found in date range', 
          synced: 0,
          total: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let syncedCount = 0
    const errors: string[] = []

    // Step B: Fetch detailed data for each call
    const targetNumber = '+14156971849'
    for (const call of calls) {
      try {
        // Filter calls to only include those TO the target number
        if (call.to !== targetNumber) {
          console.log(`Skipping call ${call.call_id} - not to target number (${call.to})`)
          continue
        }
        
        console.log(`Fetching details for call ${call.call_id}`)
        
        const detailUrl = `${apiUrl}/${call.call_id}`
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        const detailResponse = await fetch(detailUrl, {
          method: 'GET',
          headers: requestHeaders,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!detailResponse.ok) {
          if (detailResponse.status === 401) {
            errors.push(`Call ${call.call_id}: Unauthorized`)
            continue
          }
          
          const errorText = await detailResponse.text()
          errors.push(`Call ${call.call_id}: ${detailResponse.status} ${errorText.substring(0, 100)}`)
          console.error(`Failed to fetch details for call ${call.call_id}:`, detailResponse.status, errorText.substring(0, 200))
          continue
        }

        const callDetail: BlandCallDetail = await detailResponse.json()
        
        // Double-check the target number in call details
        if (callDetail.to !== targetNumber) {
          console.log(`Skipping call ${call.call_id} - call details not to target number (${callDetail.to})`)
          continue
        }
        
        // Prepare data for database
        const callStarted = callDetail.started_at ? new Date(callDetail.started_at) : null
        const callCompleted = callDetail.completed_at ? new Date(callDetail.completed_at) : null
        const durationMin = callDetail.duration ? Math.round(callDetail.duration / 60 * 100) / 100 : null

        // Categorize the call using AI if we have a transcript
        let callStatus = callDetail.status || call.status
        
        if (callDetail.concatenated_transcript) {
          try {
            console.log(`Categorizing call ${call.call_id} with AI...`)
            const categorizationResponse = await supabaseClient.functions.invoke('categorize-call', {
              body: {
                transcript: callDetail.concatenated_transcript,
                summary: callDetail.summary
              }
            })

            if (categorizationResponse.data?.category) {
              callStatus = categorizationResponse.data.category
              console.log(`Call ${call.call_id} categorized as: ${callStatus} (${categorizationResponse.data.confidence} confidence)`)
              console.log(`Reasoning: ${categorizationResponse.data.reasoning}`)
            }
          } catch (categorizationError) {
            console.error(`Failed to categorize call ${call.call_id}:`, categorizationError)
            // Continue with default status if categorization fails
          }
        }

        // UPSERT into database using bland_call_id as unique key
        const { error: upsertError } = await supabaseClient
          .from('call_logs')
          .upsert({
            bland_call_id: callDetail.call_id,
            recording_url: callDetail.recording_url || null,
            to_number: callDetail.to || call.to,
            from_number: callDetail.from || call.from,
            status: callStatus,
            started_at: callStarted?.toISOString() || null,
            completed_at: callCompleted?.toISOString() || null,
            duration_min: durationMin,
            summary: callDetail.summary || null,
            transcript: callDetail.concatenated_transcript || null,
            raw: callDetail,
            created_at: callStarted?.toISOString() || new Date().toISOString(),
            synced_at: new Date().toISOString(),
            is_available: callDetail.answered ?? call.answered ?? true,
          }, {
            onConflict: 'bland_call_id'
          })

        if (upsertError) {
          console.error('Error upserting call:', upsertError)
          errors.push(`Call ${call.call_id}: Database error`)
        } else {
          syncedCount++
          console.log(`Successfully synced call ${call.call_id}`)
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error processing call ${call.call_id}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Processing error';
        errors.push(`Call ${call.call_id}: ${errorMessage}`)
      }
    }

    console.log(`Successfully synced ${syncedCount} out of ${calls.length} calls`)
    if (errors.length > 0) {
      console.log('Errors encountered:', errors.slice(0, 5)) // Log first 5 errors
    }

    const response: SyncResponse = {
      success: true,
      message: `Successfully synced ${syncedCount} calls${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
      synced: syncedCount,
      total: calls.length
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in bland-sync-calls:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ 
        success: false,
        step: "system",
        message: `Internal server error: ${errorMessage}` 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})