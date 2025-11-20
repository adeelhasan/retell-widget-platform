import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CreateWidgetRequest, Widget } from '@/lib/types';
import { CONFIG } from '@/lib/config';
import { validateWidgetName, validateDomain, validateApiKey, validateAgentId } from '@/lib/utils-helpers';

// GET /api/widgets - List user's widgets
export async function GET(request: NextRequest) {
  try {
    // Get user from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Create a Supabase client with the user's token for RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's widgets
    const { data: widgets, error } = await supabase
      .from('widgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch widgets' }, { status: 500 });
    }

    return NextResponse.json(widgets);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/widgets - Create new widget
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/widgets - Starting request');
    
    // Get user from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    console.log('Attempting to get user with token');
    
    // Create a Supabase client with the user's token for RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);

    // Parse request body
    console.log('Parsing request body');
    const body: CreateWidgetRequest = await request.json();
    const {
      name,
      retell_api_key,
      agent_id,
      allowed_domain,
      button_text,
      rate_limit_calls_per_hour,
      access_code,
      require_access_code,
      contact_form_enabled,
      collector_email,
      widget_type,
      display_text,
      outbound_phone_number
    } = body;
    
    console.log('Request body parsed:', { name, agent_id, allowed_domain, button_text });

    // Validate input
    console.log('Starting validation');
    if (!validateWidgetName(name)) {
      console.log('Widget name validation failed:', name);
      return NextResponse.json({ error: 'Invalid widget name' }, { status: 400 });
    }

    if (!validateApiKey(retell_api_key)) {
      console.log('API key validation failed');
      return NextResponse.json({ error: 'Invalid Retell API key format' }, { status: 400 });
    }

    if (!validateAgentId(agent_id)) {
      console.log('Agent ID validation failed:', agent_id);
      return NextResponse.json({ error: 'Invalid agent ID format' }, { status: 400 });
    }

    if (!validateDomain(allowed_domain)) {
      console.log('Domain validation failed:', allowed_domain);
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }
    
    console.log('All validations passed');

    // Check widget count limit
    const { count } = await supabase
      .from('widgets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count && count >= CONFIG.LIMITS.MAX_WIDGETS_PER_USER) {
      return NextResponse.json({ 
        error: `Maximum ${CONFIG.LIMITS.MAX_WIDGETS_PER_USER} widgets allowed per user` 
      }, { status: 400 });
    }

    // Create widget
    const { data: widget, error } = await supabase
      .from('widgets')
      .insert({
        user_id: user.id,
        name,
        retell_api_key,
        agent_id,
        allowed_domain,
        button_text: button_text || null,
        rate_limit_calls_per_hour,
        access_code: access_code || null,
        require_access_code: require_access_code || false,
        contact_form_enabled: contact_form_enabled || false,
        collector_email: collector_email || null,
        widget_type: widget_type || 'inbound_web',
        display_text,
        outbound_phone_number
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create widget' }, { status: 500 });
    }

    return NextResponse.json(widget, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}