import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Security: Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting call sync & cleanup job...');

    // ===== PART 1: SYNC CALL DURATIONS =====
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const { data: pendingCalls, error: fetchError } = await supabaseAdmin
      .from('call_logs')
      .select(`
        *,
        widgets (
          retell_api_key
        )
      `)
      .is('duration_seconds', null)
      .lt('started_at', fiveMinutesAgo.toISOString())
      .limit(100); // Process max 100 calls per run

    if (fetchError) {
      console.error('❌ Failed to fetch pending calls:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const callCount = pendingCalls?.length || 0;
    console.log(`📋 Found ${callCount} calls to sync`);

    let syncedCount = 0;
    let errorCount = 0;

    // Poll Retell API for each pending call
    for (const call of pendingCalls || []) {
      try {
        console.log(`🔍 Checking call ${call.call_id}...`);

        const response = await fetch(
          `https://api.retellai.com/v2/get-call/${call.call_id}`,
          {
            headers: {
              'Authorization': `Bearer ${call.widgets.retell_api_key}`
            }
          }
        );

        if (!response.ok) {
          console.error(`⚠️ Retell API error for call ${call.call_id}: ${response.status}`);
          errorCount++;
          continue;
        }

        const callData = await response.json();
        console.log(`📞 Call ${call.call_id} status: ${callData.call_status}`);

        // Update if call has ended
        if (callData.call_status === 'ended' && callData.duration_ms) {
          const durationSeconds = Math.floor(callData.duration_ms / 1000);

          const { error: updateError } = await supabaseAdmin
            .from('call_logs')
            .update({
              duration_seconds: durationSeconds,
              call_status: 'ended',
              updated_at: new Date().toISOString()
            })
            .eq('id', call.id);

          if (updateError) {
            console.error(`❌ Failed to update call ${call.call_id}:`, updateError);
            errorCount++;
          } else {
            console.log(`✅ Synced call ${call.call_id}: ${durationSeconds}s`);
            syncedCount++;
          }
        } else if (callData.call_status === 'error') {
          // Mark as error
          await supabaseAdmin
            .from('call_logs')
            .update({
              call_status: 'error',
              updated_at: new Date().toISOString()
            })
            .eq('id', call.id);

          console.log(`⚠️ Call ${call.call_id} ended with error`);
          syncedCount++;
        }
        // If still ongoing, we'll check again next run

      } catch (error) {
        console.error(`❌ Error processing call ${call.call_id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Sync complete: ${syncedCount} synced, ${errorCount} errors`);

    // ===== PART 2: CLEANUP OLD CALLS =====
    const retentionDays = parseInt(process.env.CALL_LOGS_RETENTION_DAYS || '7');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`🧹 Deleting calls older than ${cutoffDate.toISOString()} (${retentionDays} days)...`);

    const { error: deleteError, count: deletedCount } = await supabaseAdmin
      .from('call_logs')
      .delete()
      .lt('started_at', cutoffDate.toISOString());

    if (deleteError) {
      console.error('⚠️ Failed to cleanup old calls:', deleteError);
    } else {
      console.log(`✅ Deleted ${deletedCount || 0} old call records`);
    }

    // ===== RETURN RESULTS =====
    return NextResponse.json({
      success: true,
      sync: {
        checked: callCount,
        synced: syncedCount,
        errors: errorCount
      },
      cleanup: {
        deleted: deletedCount || 0,
        retentionDays
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      {
        error: 'Job failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
