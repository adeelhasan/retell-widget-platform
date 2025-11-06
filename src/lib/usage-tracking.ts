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
