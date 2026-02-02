import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationAcceptanceRequest {
  token: string
  password: string
  phone?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { token, password, phone }: InvitationAcceptanceRequest = await req.json()

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: 'Token and password are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Validating invitation token:', token)

    // Validate invitation token and get invitation details
    const { data: inviteData, error: validateError } = await supabase
      .from('team_directory')
      .select('email, full_name, role')
      .eq('invite_token', token)
      .eq('status', 'invited')
      .gt('token_expires_at', new Date().toISOString())
      .single()

    if (validateError || !inviteData) {
      console.error('Invalid or expired invitation token:', validateError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    console.log('Checking if user already exists:', inviteData.email)

    // First check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Failed to check existing users:', listError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify user account' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    const existingUser = existingUsers.users.find(user => user.email === inviteData.email)
    let userId: string

    if (existingUser) {
      console.log('User already exists, linking to invitation:', existingUser.id)
      userId = existingUser.id
      
      // Update existing user's password and metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: password,
        user_metadata: {
          display_name: inviteData.full_name,
          full_name: inviteData.full_name
        }
      })
      
      if (updateError) {
        console.error('Failed to update existing user:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update user password' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        )
      }
    } else {
      console.log('Creating new user account for:', inviteData.email)
      
      // Create user account using Auth Admin API
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: inviteData.email,
        password: password,
        phone: phone,
        user_metadata: {
          display_name: inviteData.full_name,
          full_name: inviteData.full_name
        },
        email_confirm: true // Auto-confirm email since they were invited
      })

      if (userError || !userData.user) {
        console.error('Failed to create user:', userError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 400 
          }
        )
      }

      userId = userData.user.id
    }
    console.log('User account linked successfully:', userId)

    // Update team_directory with user_id and mark as active
    const { error: updateError } = await supabase
      .from('team_directory')
      .update({
        user_id: userId,
        status: 'active',
        invite_token: null,
        token_expires_at: null,
        last_login_at: new Date().toISOString()
      })
      .eq('invite_token', token)

    if (updateError) {
      console.error('Failed to update team directory:', updateError)
      // Only clean up if we created a new user (not if we linked existing user)
      if (!existingUser) {
        await supabase.auth.admin.deleteUser(userId)
      }
      return new Response(
        JSON.stringify({ error: 'Failed to update team directory' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    // Add user to admin_users table
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
        email: inviteData.email,
        is_active: true
      })

    if (adminError) {
      console.error('Failed to add admin user:', adminError)
      // Only clean up if we created a new user (not if we linked existing user)
      if (!existingUser) {
        await supabase.auth.admin.deleteUser(userId)
      }
      return new Response(
        JSON.stringify({ error: 'Failed to grant admin access' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    console.log('Invitation acceptance completed successfully for:', inviteData.email)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account created successfully',
        user: {
          id: userId,
          email: inviteData.email,
          full_name: inviteData.full_name,
          role: inviteData.role
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error('Unexpected error in accept-team-invitation:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})