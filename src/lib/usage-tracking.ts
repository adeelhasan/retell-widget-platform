import { supabaseAdmin } from './supabase-server';

/**
 * Get total minutes used today for a widget
 * Only counts completed calls (where duration_seconds is not null)
 */
export async function getDailyMinutesUsed(widgetId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabaseAdmin
    .from('call_logs')
    .select('duration_seconds')
    .eq('widget_id', widgetId)
    .gte('started_at', startOfDay.toISOString())
    .not('duration_seconds', 'is', null); // Only completed calls

  if (error) {
    console.error('Error fetching daily usage:', error);
    return 0;
  }

  const totalSeconds = data?.reduce((sum, call) =>
    sum + (call.duration_seconds || 0), 0
  ) || 0;

  return Math.floor(totalSeconds / 60); // Convert to minutes
}

/**
 * Check if widget has exceeded daily minutes limit
 * Returns true if call is allowed, false if limit exceeded
 */
export async function checkDailyMinutesLimit(
  widgetId: string,
  dailyMinutesLimit: number | null,
  dailyMinutesEnabled: boolean
): Promise<boolean> {
  // If limit not enabled, allow
  if (!dailyMinutesEnabled || !dailyMinutesLimit) {
    return true;
  }

  const minutesUsed = await getDailyMinutesUsed(widgetId);
  return minutesUsed < dailyMinutesLimit;
}

/**
 * Create a placeholder call log entry BEFORE making the actual call
 * This prevents race conditions in rate limiting
 * Returns a temporary ID that can be updated later
 */
export async function reserveCallSlot(params: {
  widgetId: string;
  userId: string;
  callType: 'inbound_web' | 'inbound_phone' | 'outbound_phone' | 'outbound_web';
}): Promise<string> {
  // Create a temporary call_id that will be updated after Retell API call
  const tempCallId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const { error } = await supabaseAdmin
    .from('call_logs')
    .insert({
      widget_id: params.widgetId,
      user_id: params.userId,
      call_id: tempCallId,
      call_type: params.callType,
      started_at: new Date().toISOString(),
      duration_seconds: null,
      call_status: 'ongoing'
    });

  if (error) {
    console.error('Error reserving call slot:', error);
    throw error;
  }

  console.log(`🔒 Reserved call slot: ${tempCallId} for widget ${params.widgetId}`);
  return tempCallId;
}

/**
 * Update the placeholder entry with the actual Retell call ID
 */
export async function updateCallId(tempCallId: string, actualCallId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('call_logs')
    .update({ call_id: actualCallId })
    .eq('call_id', tempCallId);

  if (error) {
    console.error('Error updating call ID:', error);
    throw error;
  }

  console.log(`✅ Updated call ID from ${tempCallId} to ${actualCallId}`);
}

/**
 * Delete a placeholder entry if the actual call failed
 */
export async function releaseCallSlot(tempCallId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('call_logs')
    .delete()
    .eq('call_id', tempCallId);

  if (error) {
    console.error('Error releasing call slot:', error);
  }

  console.log(`🔓 Released call slot: ${tempCallId}`);
}

/**
 * Log call start to database
 * Duration will be filled later by cron job
 */
export async function logCallStart(params: {
  widgetId: string;
  userId: string;
  callId: string;
  callType: 'inbound_web' | 'inbound_phone' | 'outbound_phone' | 'outbound_web';
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from('call_logs')
    .insert({
      widget_id: params.widgetId,
      user_id: params.userId,
      call_id: params.callId,
      call_type: params.callType,
      started_at: new Date().toISOString(),
      duration_seconds: null,
      call_status: 'ongoing'
    });

  if (error) {
    console.error('Error logging call start:', error);
    throw error;
  }

  console.log(`✅ Logged call start: ${params.callId} for widget ${params.widgetId}`);
}
