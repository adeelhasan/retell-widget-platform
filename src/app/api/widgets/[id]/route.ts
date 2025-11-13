import { NextRequest, NextResponse } from 'next/server';
import { withAuthAsync } from '@/lib/with-auth';
import { type AuthContext } from '@/lib/auth-server';
import { UpdateWidgetRequest } from '@/lib/types';
import { validateWidgetName, validateDomain, validateApiKey, validateAgentId } from '@/lib/utils-helpers';

// DELETE /api/widgets/[id] - Delete specific widget
async function deleteWidget(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  { user, supabase }: AuthContext
) {
  const { id: widgetId } = await params;

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
}

// GET /api/widgets/[id] - Get specific widget
async function getWidget(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  { user, supabase }: AuthContext
) {
  const { id: widgetId } = await params;

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
}

// PUT /api/widgets/[id] - Update specific widget
async function updateWidget(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  { user, supabase }: AuthContext
) {
  const { id: widgetId } = await params;

  // Parse request body
  const body: UpdateWidgetRequest = await request.json();
  const {
    name,
    retell_api_key,
    agent_id,
    allowed_domain,
    button_text,
    rate_limit_calls_per_hour,
    daily_minutes_limit,
    daily_minutes_enabled,
    access_code,
    require_access_code,
    widget_type,
    display_text,
    outbound_phone_number
  } = body;

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
  const { error: fetchError } = await supabase
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
  if (daily_minutes_limit !== undefined) updateData.daily_minutes_limit = daily_minutes_limit;
  if (daily_minutes_enabled !== undefined) updateData.daily_minutes_enabled = daily_minutes_enabled;
  if (access_code !== undefined) updateData.access_code = access_code;
  if (require_access_code !== undefined) updateData.require_access_code = require_access_code;
  if (widget_type !== undefined) updateData.widget_type = widget_type;
  if (display_text !== undefined) updateData.display_text = display_text;
  if (outbound_phone_number !== undefined) updateData.outbound_phone_number = outbound_phone_number;

  console.log('📝 Update data:', { access_code, require_access_code, updateData });

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
}

export const GET = withAuthAsync(getWidget, { validateUUID: 'id' });
export const PUT = withAuthAsync(updateWidget, { validateUUID: 'id' });
export const DELETE = withAuthAsync(deleteWidget, { validateUUID: 'id' });