import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { CONFIG } from '@/lib/config';
import { isAllowedDomain } from '@/lib/security';

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
    const normalizedPhone = phone_number.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return NextResponse.json({ 
        error: 'Invalid phone number format',
        details: 'Please enter a valid phone number with country code (e.g., +1234567890)'
      }, { status: 400 });
    }

    // Ensure phone number starts with +
    const formattedPhone = normalizedPhone.startsWith('+') ? normalizedPhone : `+${normalizedPhone}`;

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

    // Call Retell AI API to initiate outbound call
    console.log('📞 Calling Retell AI API to initiate outbound call to:', formattedPhone);
    
    try {
      const retellResponse = await fetch('https://api.retellai.com/v2/create-phone-call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${widget.retell_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: widget.agent_id,
          to_number: formattedPhone,
          from_number: widget.outbound_phone_number,
          metadata: mergedMetadata,
          retell_llm_dynamic_variables: mergedMetadata
        }),
        signal: AbortSignal.timeout(CONFIG.SECURITY.RETELL_TIMEOUT_MS),
      });

      if (!retellResponse.ok) {
        const errorData = await retellResponse.json().catch(() => ({}));
        console.error('Retell AI API error:', errorData);
        
        if (retellResponse.status === 400) {
          if (errorData.message?.includes('phone number') || errorData.message?.includes('invalid')) {
            return NextResponse.json({
              error: 'Invalid phone number',
              details: errorData.message || 'The phone number format is not supported.'
            }, { status: 400 });
          } else if (errorData.message?.includes('agent')) {
            return NextResponse.json({
              error: 'Agent configuration error',
              details: 'The agent is not configured for outbound calls. Please check your Retell dashboard.'
            }, { status: 400 });
          } else {
            return NextResponse.json({
              error: 'Invalid request',
              details: errorData.message || 'Please check your configuration.'
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

