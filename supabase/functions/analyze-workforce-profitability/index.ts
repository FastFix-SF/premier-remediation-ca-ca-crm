import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkforceInsight {
  type: string
  title: string
  description: string
  impact_amount?: number
  impact_type?: string
  confidence_score: number
  data_sources: string[]
  action_items: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const { analysisType = 'weekly' } = await req.json()

    console.log(`Starting ${analysisType} workforce profitability analysis...`)

    // Get workforce data from the last week
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Fetch data for analysis
    const [chatsResult, timecardsResult, schedulesResult] = await Promise.all([
      supabaseClient
        .from('team_chats')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString()),
      
      supabaseClient
        .from('time_clock')
        .select('*')
        .gte('clock_in', startDate.toISOString()),
      
      supabaseClient
        .from('job_schedules')
        .select('*')
        .gte('start_time', startDate.toISOString())
    ])

    if (chatsResult.error || timecardsResult.error || schedulesResult.error) {
      throw new Error('Failed to fetch workforce data for analysis')
    }

    const chats = chatsResult.data || []
    const timecards = timecardsResult.data || []
    const schedules = schedulesResult.data || []

    console.log(`Analyzing ${chats.length} chats, ${timecards.length} timecards, ${schedules.length} schedules`)

    // Prepare data summary for AI analysis
    const dataSummary = {
      total_overtime_hours: timecards.reduce((sum, tc) => sum + (tc.overtime_hours || 0), 0),
      late_clockouts: timecards.filter(tc => tc.clock_out && new Date(tc.clock_out).getHours() > 17).length,
      important_messages: chats.filter(chat => chat.is_important).length,
      delay_mentions: chats.filter(chat => 
        chat.message.toLowerCase().includes('delay') || 
        chat.message.toLowerCase().includes('permit') ||
        chat.message.toLowerCase().includes('weather') ||
        chat.message.toLowerCase().includes('material')
      ).length,
      schedule_conflicts: 0, // TODO: Implement conflict detection logic
      total_scheduled_hours: schedules.reduce((sum, s) => sum + (s.estimated_hours || 0), 0),
      average_hourly_rate: 65 // TODO: Get from config or calculate
    }

    // Generate AI insights using OpenAI
    const insights = await generateAIInsights(openAIApiKey, dataSummary, chats, timecards, schedules)

    // Store insights in database
    for (const insight of insights) {
      await supabaseClient
        .from('ai_workforce_insights')
        .insert({
          insight_type: insight.type,
          title: insight.title,
          description: insight.description,
          impact_amount: insight.impact_amount,
          impact_type: insight.impact_type,
          confidence_score: insight.confidence_score,
          data_sources: insight.data_sources,
          action_items: insight.action_items,
          analysis_period_start: startDate.toISOString(),
          analysis_period_end: endDate.toISOString()
        })
    }

    return new Response(JSON.stringify({
      success: true,
      insights: insights,
      data_summary: dataSummary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Workforce profitability analysis error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function generateAIInsights(
  apiKey: string, 
  dataSummary: any, 
  chats: any[], 
  timecards: any[], 
  schedules: any[]
): Promise<WorkforceInsight[]> {
  const systemPrompt = `You are a roofing business operations analyst focused on profitability. Analyze workforce data and provide 3-5 actionable insights that directly impact project profitability.

Focus on:
- Cost overruns (overtime, delays, inefficiencies)
- Schedule optimization
- Risk identification from chat patterns
- Labor cost vs. project budgets

Data Summary:
- Total overtime hours: ${dataSummary.total_overtime_hours}
- Late clockouts: ${dataSummary.late_clockouts} 
- Important messages: ${dataSummary.important_messages}
- Delay mentions in chat: ${dataSummary.delay_mentions}
- Average hourly rate: $${dataSummary.average_hourly_rate}

Recent chat highlights:
${chats.slice(0, 10).map(c => `- ${c.sender}: "${c.message.substring(0, 100)}..."`).join('\n')}

Return exactly 3-5 insights in this JSON format:
{
  "insights": [
    {
      "type": "cost_overrun|schedule_risk|efficiency_issue|safety_concern",
      "title": "Brief actionable title",
      "description": "Detailed explanation with specific numbers",
      "impact_amount": 450.00,
      "impact_type": "cost_increase|time_delay|efficiency_loss", 
      "confidence_score": 0.85,
      "data_sources": ["timecards", "chats", "schedules"],
      "action_items": ["Specific action 1", "Specific action 2"]
    }
  ]
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Analyze this workforce data and provide profitability insights.' }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    try {
      const parsed = JSON.parse(content)
      return parsed.insights || []
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      // Return fallback insights based on data
      return generateFallbackInsights(dataSummary)
    }

  } catch (error) {
    console.error('OpenAI API call failed:', error)
    return generateFallbackInsights(dataSummary)
  }
}

function generateFallbackInsights(dataSummary: any): WorkforceInsight[] {
  const insights: WorkforceInsight[] = []

  if (dataSummary.total_overtime_hours > 10) {
    insights.push({
      type: 'cost_overrun',
      title: 'High Overtime Costs Detected',
      description: `${dataSummary.total_overtime_hours} overtime hours at time-and-a-half rate resulted in approximately $${Math.round(dataSummary.total_overtime_hours * dataSummary.average_hourly_rate * 0.5)} in additional labor costs this week.`,
      impact_amount: Math.round(dataSummary.total_overtime_hours * dataSummary.average_hourly_rate * 0.5),
      impact_type: 'cost_increase',
      confidence_score: 0.9,
      data_sources: ['timecards'],
      action_items: ['Review project scheduling to reduce overtime needs', 'Consider adding crew members to high-demand projects']
    })
  }

  if (dataSummary.delay_mentions > 3) {
    insights.push({
      type: 'schedule_risk',
      title: 'Multiple Project Delays Identified',
      description: `${dataSummary.delay_mentions} delay-related messages in team chat indicate potential schedule disruptions affecting project timelines and profitability.`,
      impact_amount: 1200,
      impact_type: 'time_delay',
      confidence_score: 0.8,
      data_sources: ['chats'],
      action_items: ['Implement proactive delay mitigation strategies', 'Improve permit and material scheduling processes']
    })
  }

  if (dataSummary.late_clockouts > 5) {
    insights.push({
      type: 'efficiency_issue',
      title: 'Frequent Late Clockouts',
      description: `${dataSummary.late_clockouts} late clockouts suggest potential project overruns or inefficient work scheduling affecting crew productivity.`,
      impact_amount: 800,
      impact_type: 'efficiency_loss',
      confidence_score: 0.75,
      data_sources: ['timecards'],
      action_items: ['Review daily work planning and task allocation', 'Investigate causes of extended work days']
    })
  }

  return insights.slice(0, 5)
}