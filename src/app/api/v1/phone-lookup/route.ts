import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { CONFIG } from '@/lib/config';
import { isAllowedDomain, checkRateLimit } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get('widget_id');
    const origin = request.headers.get('origin');

    if (!widgetId) {
      return NextResponse.json({ error: 'Widget ID required' }, { status: 400 });
    }

    // Validate widget_id format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(widgetId)) {
      return NextResponse.json({ error: 'Invalid widget ID format' }, { status: 400 });
    }

    // Get widget configuration
    const { data: widget, error } = await supabaseAdmin
      .from('widgets')
      .select('*')
      .eq('id', widgetId)
      .single();

    if (error || !widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // Verify widget type
    if (widget.widget_type !== 'inbound_phone') {
      return NextResponse.json({ error: 'Widget not configured for phone calls' }, { status: 400 });
    }

    // Verify domain authorization
    // For same-origin requests (no Origin header), use the referrer
    const requestOrigin = origin || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || '';

    if (!requestOrigin) {
      return NextResponse.json({ error: 'Missing origin header' }, { status: 400 });
    }

    if (!isAllowedDomain(requestOrigin, widget.allowed_domain)) {
      return NextResponse.json({ error: 'Domain not authorized' }, { status: 403 });
    }

    // Check rate limiting to prevent phone number lookup abuse
    const rateLimit = widget.rate_limit_calls_per_hour || CONFIG.RATE_LIMITING.CALLS_PER_HOUR;
    if (!checkRateLimit(widgetId, rateLimit)) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        details: 'Too many lookup requests. Please try again later.'
      }, { status: 429 });
    }

    // Call Retell AI API to list phone numbers and find one linked to this agent
    console.log('📞 Calling Retell AI API to find phone number for agent:', widget.agent_id);

    try {
      const retellResponse = await fetch('https://api.retellai.com/list-phone-numbers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${widget.retell_api_key}`,
        },
        signal: AbortSignal.timeout(CONFIG.SECURITY.RETELL_TIMEOUT_MS),
      });

      if (!retellResponse.ok) {
        const errorData = await retellResponse.json().catch(() => ({}));
        console.error('Retell AI API error:', errorData);

        if (retellResponse.status === 401) {
          return NextResponse.json({
            error: 'Invalid API credentials. Please check your Retell API key.',
            details: 'The provided API key is invalid or has insufficient permissions.'
          }, { status: 401 });
        } else {
          throw new Error(`Retell AI API error: ${retellResponse.status} ${errorData.message || retellResponse.statusText}`);
        }
      }

      const phoneNumbersData = await retellResponse.json();
      console.log('✅ Phone numbers retrieved from Retell AI');
      console.log('📋 Full response:', JSON.stringify(phoneNumbersData, null, 2));

      // Find phone number linked to this agent
      const phoneNumbers = phoneNumbersData.phone_numbers || phoneNumbersData;
      console.log('📞 Phone numbers array:', phoneNumbers);
      console.log('🔍 Looking for agent_id:', widget.agent_id);

      // Log each phone number's agent_id
      if (Array.isArray(phoneNumbers)) {
        phoneNumbers.forEach((pn: Record<string, unknown>, idx: number) => {
          console.log(`  Phone ${idx + 1}: ${pn.phone_number || pn.number}, inbound_agent_id: ${pn.inbound_agent_id || 'NONE'}`);
        });
      }

      const matchingPhoneNumber = phoneNumbers.find((pn: Record<string, unknown>) => pn.inbound_agent_id === widget.agent_id);

      if (!matchingPhoneNumber) {
        console.error('❌ No matching phone number found for agent:', widget.agent_id);
        return NextResponse.json({
          error: 'No phone number linked to this agent.',
          details: 'This agent is not configured with a phone number. Please link a phone number to this agent in your Retell dashboard.'
        }, { status: 400 });
      }

      const phoneNumber = matchingPhoneNumber.phone_number || matchingPhoneNumber.number;
      console.log('✅ Found matching phone number:', phoneNumber);

      return NextResponse.json({
        phone_number: phoneNumber,
        display_text: widget.display_text || `Call ${phoneNumber}`,
        widget_type: widget.widget_type
      });

    } catch (error) {
      console.error('Failed to retrieve agent phone number:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({
          error: 'Retell AI API timeout',
          details: 'Unable to retrieve phone number due to network timeout.'
        }, { status: 408 });
      }
      
      return NextResponse.json({
        error: 'Unable to retrieve phone number. Please try again later.',
        details: 'There was an issue connecting to the voice service.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Phone lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

