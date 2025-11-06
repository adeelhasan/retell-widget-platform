import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { CONFIG } from '@/lib/config';
import { isAllowedDomain, checkRateLimit } from '@/lib/security';
import { checkDailyMinutesLimit, logCallStart } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    const body = await request.json();
    const { widget_id, phone_number, metadata } = body;

    if (!widget_id) {
      return NextResponse.json({ error: 'Widget ID required' }, { status: 400 });
    }

    if (!phone_number) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Validate widget_id format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(widget_id)) {
      return NextResponse.json({ error: 'Invalid widget ID format' }, { status: 400 });
    }

    // Validate and normalize phone number format
    // Step 1: Strip all formatting characters including +
    const normalizedPhone = phone_number.replace(/[\s\-\(\)\+]/g, '');

    // Step 2: Detect US numbers (10 digits starting with 2-9)
    const isUSNumber = /^[2-9]\d{9}$/.test(normalizedPhone);

    // Step 3: Add country code if US number
    const withCountryCode = isUSNumber ? `1${normalizedPhone}` : normalizedPhone;

    // Step 4: Validate E.164 format (11-15 digits total)
    const phoneRegex = /^[1-9]\d{10,14}$/;
    if (!phoneRegex.test(withCountryCode)) {
      return NextResponse.json({
        error: 'Invalid phone number format',
        details: 'Please enter a valid phone number (10 digits for US numbers, or international with country code)'
      }, { status: 400 });
    }

    // Step 5: Add + prefix for E.164 format
    const formattedPhone = `+${withCountryCode}`;

    console.log('📞 Phone normalization:', {
      input: phone_number,
      normalized: normalizedPhone,
      isUS: isUSNumber,
      final: formattedPhone
    });

    // Get widget configuration including default metadata
    const { data: widget, error } = await supabaseAdmin
      .from('widgets')
      .select('*, default_agent_name, default_property_type, default_lead_source, default_contact_email, default_notes')
      .eq('id', widget_id)
      .single();

    if (error || !widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // Verify widget type
    if (widget.widget_type !== 'outbound_phone') {
      return NextResponse.json({ error: 'Widget not configured for outbound calls' }, { status: 400 });
    }

    // Verify outbound phone number is configured
    if (!widget.outbound_phone_number) {
      return NextResponse.json({ 
        error: 'Outbound phone number not configured',
        details: 'This widget requires an outbound phone number to be configured by the administrator.'
      }, { status: 400 });
    }

    // Verify domain authorization
    if (!origin) {
      return NextResponse.json({ error: 'Missing origin header' }, { status: 400 });
    }
    
    if (!isAllowedDomain(origin, widget.allowed_domain)) {
      return NextResponse.json({ error: 'Domain not authorized' }, { status: 403 });
    }

    // Check access code if required
    if (widget.require_access_code) {
      const { access_code } = body;
      if (!access_code || access_code !== widget.access_code) {
        return NextResponse.json({
          error: 'Access denied',
          details: 'Invalid or missing access code. Please enter the correct access code to use this widget.'
        }, { status: 403 });
      }
    }

    // Check rate limiting (important for outbound calls as they cost money!)
    // Use stricter limit for outbound calls - use widget setting or default
    const rateLimit = widget.rate_limit_calls_per_hour || CONFIG.RATE_LIMITING.CALLS_PER_HOUR;
    if (!checkRateLimit(widget_id, rateLimit)) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        details: 'Too many calls requested. Please try again later.',
        retry_after: 'Please wait before making another call request.'
      }, { status: 429 });
    }

    // Check daily minutes limit
    if (widget.daily_minutes_enabled) {
      const canMakeCall = await checkDailyMinutesLimit(
        widget_id,
        widget.daily_minutes_limit,
        widget.daily_minutes_enabled
      );

      if (!canMakeCall) {
        return NextResponse.json({
          error: 'Daily minutes limit exceeded',
          details: 'Daily call minutes limit reached. Try again tomorrow.'
        }, { status: 429 });
      }
    }

    // TODO: In Phase 5, add SMS verification check here
    // For now, we'll skip verification for demo purposes

    // Merge metadata: Page-level data takes precedence over widget defaults
    const mergedMetadata = {
      // Start with widget defaults
      agent_name: widget.default_agent_name,
      property_type: widget.default_property_type,
      lead_source: widget.default_lead_source,
      contact_email: widget.default_contact_email,
      notes: widget.default_notes,
      // Override with page-level metadata if provided
      ...(metadata || {}),
      // Always include system metadata
      widget_id,
      origin,
      timestamp: new Date().toISOString(),
      phone_number: formattedPhone
    };

    console.log('📊 Merged metadata:', mergedMetadata);

    // Filter out null/undefined values - Retell API doesn't accept null values
    const filterNullValues = (obj: Record<string, any>): Record<string, any> => {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
    };

    const cleanMetadata = filterNullValues(mergedMetadata);

    // Call Retell AI API to initiate outbound call
    console.log('📞 Calling Retell AI API to initiate outbound call to:', formattedPhone);

    const retellPayload = {
      from_number: widget.outbound_phone_number,
      to_number: formattedPhone,
      override_agent_id: widget.agent_id,
      metadata: cleanMetadata,
      retell_llm_dynamic_variables: cleanMetadata
    };

    console.log('📤 Retell API payload:', JSON.stringify(retellPayload, null, 2));

    try {
      const retellResponse = await fetch('https://api.retellai.com/v2/create-phone-call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${widget.retell_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(retellPayload),
        signal: AbortSignal.timeout(CONFIG.SECURITY.RETELL_TIMEOUT_MS),
      });

      if (!retellResponse.ok) {
        const errorData = await retellResponse.json().catch(() => ({}));
        console.error('Retell AI API error:', errorData);

        // Extract error message from Retell API response (they use different field names)
        const retellErrorMessage = errorData.error_message || errorData.message || errorData.detail;

        if (retellResponse.status === 400) {
          if (retellErrorMessage?.includes('phone number') || retellErrorMessage?.includes('invalid')) {
            return NextResponse.json({
              error: 'Invalid phone number',
              details: retellErrorMessage || 'The phone number format is not supported.'
            }, { status: 400 });
          } else if (retellErrorMessage?.includes('agent')) {
            return NextResponse.json({
              error: 'Agent configuration error',
              details: retellErrorMessage || 'The agent is not configured for outbound calls. Please check your Retell dashboard.'
            }, { status: 400 });
          } else {
            return NextResponse.json({
              error: 'Invalid request',
              details: retellErrorMessage || 'Please check your configuration.'
            }, { status: 400 });
          }
        } else if (retellResponse.status === 401) {
          return NextResponse.json({
            error: 'Invalid API credentials',
            details: 'Please check your Retell API key configuration.'
          }, { status: 401 });
        } else if (retellResponse.status === 402) {
          return NextResponse.json({
            error: 'Insufficient credits',
            details: 'Your Retell account does not have sufficient credits for outbound calls.'
          }, { status: 402 });
        } else if (retellResponse.status === 404) {
          return NextResponse.json({
            error: 'Agent not found',
            details: 'The specified agent ID does not exist in your Retell account.'
          }, { status: 404 });
        } else {
          throw new Error(`Retell AI API error: ${retellResponse.status} ${errorData.message || retellResponse.statusText}`);
        }
      }

      const retellData = await retellResponse.json();
      console.log('✅ Outbound call initiated:', retellData.call_id);

      // Log call start for usage tracking
      await logCallStart({
        widgetId: widget_id,
        userId: widget.user_id,
        callId: retellData.call_id,
        callType: 'outbound_phone'
      });

      return NextResponse.json({
        success: true,
        call_id: retellData.call_id,
        status: 'initiated',
        message: 'Call initiated successfully! You should receive a call shortly.'
      });

    } catch (error) {
      console.error('Failed to initiate outbound call:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({
          error: 'Request timeout',
          details: 'Unable to initiate call due to network timeout. Please try again.'
        }, { status: 408 });
      }
      
      return NextResponse.json({
        error: 'Failed to initiate call',
        details: 'There was an issue connecting to the voice service. Please try again later.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Outbound call error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

