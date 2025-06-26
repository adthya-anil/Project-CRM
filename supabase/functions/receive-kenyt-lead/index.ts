// supabase/functions/receive-kenyt-lead/index.ts

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FIXED_USER_ID = 'e10bcb36-8566-49c2-8f7b-096c912b2624'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const expectedBearer = `Bearer ${Deno.env.get('EXPECTED_SECRET')}`

    if (authHeader !== expectedBearer) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = await req.json()
    const { Name, Phone, Email, State, Country, next_course } = body

    if (!Name || !Phone) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const { error } = await supabase.from('mock').insert([
      {
        Name,
        Phone,
        Email,
        State,
        Country,
        next_course,
        user_id: FIXED_USER_ID,
        timestamp: new Date().toISOString()
      }
    ])

    if (error) {
      console.error('Insert error:', error)
      return new Response(JSON.stringify({ status: 'error', message: 'Database error' }), { status: 500 })
    }

    return new Response(JSON.stringify({ status: 'success', message: 'Lead stored successfully' }), { status: 200 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
})
