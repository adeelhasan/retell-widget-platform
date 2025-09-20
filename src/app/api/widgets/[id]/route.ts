import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UpdateWidgetRequest } from '@/lib/types';
import { validateWidgetName, validateDomain, validateApiKey, validateAgentId } from '@/lib/utils-helpers';

// DELETE /api/widgets/[id] - Delete specific widget
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: widgetId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(widgetId)) {
      return NextResponse.json({ error: 'Invalid widget ID format' }, { status: 400 });
    }

    // Delete widget (RLS policy ensures user can only delete their own widgets)
    const { error } = await supabase
      .from('widgets')
      .delete()
      .eq('id', widgetId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to delete widget' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/widgets/[id] - Get specific widget
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: widgetId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(widgetId)) {
      return NextResponse.json({ error: 'Invalid widget ID format' }, { status: 400 });
    }

    // Fetch widget (RLS policy ensures user can only access their own widgets)
    const { data: widget, error } = await supabase
      .from('widgets')
      .select('*')
      .eq('id', widgetId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
      }
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch widget' }, { status: 500 });
    }

    return NextResponse.json(widget);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/widgets/[id] - Update specific widget
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: widgetId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(widgetId)) {
      return NextResponse.json({ error: 'Invalid widget ID format' }, { status: 400 });
    }

    // Parse request body
    const body: UpdateWidgetRequest = await request.json();
    const { name, retell_api_key, agent_id, allowed_domain, button_text, rate_limit_calls_per_hour } = body;

    // Validate input - only validate fields that are provided
    if (name !== undefined && !validateWidgetName(name)) {
      return NextResponse.json({ error: 'Invalid widget name' }, { status: 400 });
    }

    if (retell_api_key !== undefined && !validateApiKey(retell_api_key)) {
      return NextResponse.json({ error: 'Invalid Retell API key format' }, { status: 400 });
    }

    if (agent_id !== undefined && !validateAgentId(agent_id)) {
      return NextResponse.json({ error: 'Invalid agent ID format' }, { status: 400 });
    }

    if (allowed_domain !== undefined && !validateDomain(allowed_domain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    // Verify widget exists and belongs to user
    const { data: existingWidget, error: fetchError } = await supabase
      .from('widgets')
      .select('*')
      .eq('id', widgetId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
      }
      console.error('Database error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch widget' }, { status: 500 });
    }

    // Build update object with only provided fields
    const updateData: Partial<UpdateWidgetRequest> = {};
    if (name !== undefined) updateData.name = name;
    if (retell_api_key !== undefined) updateData.retell_api_key = retell_api_key;
    if (agent_id !== undefined) updateData.agent_id = agent_id;
    if (allowed_domain !== undefined) updateData.allowed_domain = allowed_domain;
    if (button_text !== undefined) updateData.button_text = button_text;
    if (rate_limit_calls_per_hour !== undefined) updateData.rate_limit_calls_per_hour = rate_limit_calls_per_hour;

    // Update widget (RLS policy ensures user can only update their own widgets)
    const { data: widget, error } = await supabase
      .from('widgets')
      .update(updateData)
      .eq('id', widgetId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update widget' }, { status: 500 });
    }

    return NextResponse.json(widget);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}