import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { RegisterCallRequest, RegisterCallResponse } from '@/lib/types';
import { CONFIG } from '@/lib/config';
import { validateMetadata } from '@/lib/utils-helpers';

// Create security and rate limiting utilities
import { isAllowedDomain, checkRateLimit } from '@/lib/security';
import { checkDailyMinutesLimit, reserveCallSlot, updateCallId, releaseCallSlot } from '@/lib/usage-tracking';

// POST /api/v1/register-call - Public endpoint for widget call registration
export async function POST(request: NextRequest) {
  try {
    // Get origin for domain verification
    const origin = request.headers.get('origin');
    
    if (!origin) {
      return NextResponse.json(
        { error: 'Missing origin header' }, 
        { status: 400 }
      );
    }

    // Parse request body
    const body: RegisterCallRequest = await request.json();
    const { widget_id, metadata } = body;

    // Validate widget_id format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!widget_id || !uuidRegex.test(widget_id)) {
      return NextResponse.json(
        { error: 'Invalid widget ID format' }, 
        { status: 400 }
      );
    }

    // Validate metadata
    if (metadata && !validateMetadata(metadata)) {
      return NextResponse.json(
        { error: 'Invalid metadata format or size' }, 
        { status: 400 }
      );
    }

    // Fetch widget configuration
    const { data: widget, error: widgetError } = await supabaseAdmin
      .from('widgets')
      .select('*')
      .eq('id', widget_id)
      .single();

    if (widgetError || !widget) {
      return NextResponse.json(
        { error: 'Widget not found' }, 
        { status: 404 }
      );
    }

    // Verify domain authorization
    if (!isAllowedDomain(origin, widget.allowed_domain)) {
      return NextResponse.json(
        { error: 'Domain not authorized for this widget' }, 
        { status: 403 }
      );
    }

    // Check access code if required
    if (widget.require_access_code) {
      const { access_code } = body;
      if (!access_code || access_code !== widget.access_code) {
        return NextResponse.json(
          {
            error: 'Access denied',
            details: 'Invalid or missing access code. Please enter the correct access code to use this widget.'
          },
          { status: 403 }
        );
      }
    }

    // Check rate limiting if enabled
    if (widget.rate_limit_enabled) {
      const rateLimit = widget.rate_limit_calls_per_hour || CONFIG.RATE_LIMITING.CALLS_PER_HOUR;
      const canMakeCall = await checkRateLimit(widget_id, rateLimit);
      if (!canMakeCall) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Check daily minutes limit
    if (widget.daily_minutes_enabled) {
      const canMakeCall = await checkDailyMinutesLimit(
        widget_id,
        widget.daily_minutes_limit,
        widget.daily_minutes_enabled
      );

      if (!canMakeCall) {
        return NextResponse.json(
          { error: 'Daily minutes limit exceeded. Try again tomorrow.' },
          { status: 429 }
        );
      }
    }

    // 🔒 CRITICAL: Reserve a call slot IMMEDIATELY to prevent race conditions
    // This creates a placeholder entry in call_logs that counts toward rate limits
    const tempCallId = await reserveCallSlot({
      widgetId: widget_id,
      userId: widget.user_id,
      callType: 'inbound_web'
    });

    // Convert all metadata values to strings for Retell API
    const stringifyMetadata = (obj: Record<string, unknown>): Record<string, string> => {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
          result[key] = '';
        } else if (typeof value === 'object') {
          result[key] = JSON.stringify(value);
        } else {
          result[key] = String(value);
        }
      }
      return result;
    };

    const cleanMetadata = metadata ? stringifyMetadata(metadata) : {};

    console.log('📞 Calling Retell AI API to create call...');
    console.log('📊 Metadata being sent:', cleanMetadata);

    try {
      const retellResponse = await fetch('https://api.retellai.com/v2/create-web-call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${widget.retell_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: widget.agent_id,
          metadata: cleanMetadata,
          retell_llm_dynamic_variables: cleanMetadata
        }),
        signal: AbortSignal.timeout(CONFIG.SECURITY.RETELL_TIMEOUT_MS),
      });

      if (!retellResponse.ok) {
        const errorData = await retellResponse.json().catch(() => ({}));
        console.error('Retell AI API error:', errorData);

        // Release the call slot since the call failed
        await releaseCallSlot(tempCallId);

        throw new Error(`Retell AI API error: ${retellResponse.status} ${errorData.message || retellResponse.statusText}`);
      }

      const retellData = await retellResponse.json();
      console.log('✅ Retell call created:', retellData.call_id);

      // Update the placeholder with the actual Retell call ID
      await updateCallId(tempCallId, retellData.call_id);

      const response: RegisterCallResponse = {
        call_id: retellData.call_id,
        access_token: retellData.access_token
      };

      return NextResponse.json(response, { status: 200 });

    } catch (error) {
      console.error('Failed to create Retell call:', error);

      // Release the call slot since an error occurred
      await releaseCallSlot(tempCallId);

      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Retell AI API timeout' },
          { status: 408 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create voice call. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Handle preflight OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // For now, allow all origins (in production, you'd want to be more restrictive)
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Origin',
      'Access-Control-Max-Age': '86400',
    },
  });
}