import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAllowedDomains } from '@/lib/security';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Origin',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

export async function GET(request: NextRequest) {
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Origin',
  };

  try {
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get('widget_id');
    const origin = request.headers.get('origin');

    if (!widgetId) {
      return NextResponse.json({ error: 'Widget ID required' }, { status: 400, headers: corsHeaders });
    }

    // Get widget configuration
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: widget, error } = await supabase
      .from('widgets')
      .select('id, widget_type, button_text, display_text, allowed_domain, outbound_phone_number, require_access_code, contact_form_enabled')
      .eq('id', widgetId)
      .single();

    if (error || !widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404, headers: corsHeaders });
    }

    // Verify domain authorization
    console.log('🔍 Domain check:', { 
      origin, 
      allowed_domain: widget.allowed_domain,
      originHost: origin ? new URL(origin).hostname : 'NO_ORIGIN'
    });
    
    // Handle same-origin requests where Origin might be null for localhost
    let effectiveOrigin = origin;
    if (!effectiveOrigin) {
      const host = request.headers.get('host') || 'localhost:3002';
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      effectiveOrigin = `${protocol}://${host}`;
    }
    
    console.log('🔧 Using effective origin:', effectiveOrigin);

    if (!isAllowedDomains(effectiveOrigin, widget.allowed_domain)) {
      console.log('❌ Domain not authorized:', { origin, effectiveOrigin, allowed_domain: widget.allowed_domain });
      return NextResponse.json({ error: 'Domain not authorized' }, { status: 403, headers: corsHeaders });
    }

    console.log('✅ Domain authorized for widget:', widget.id);

    // Return widget configuration (excluding sensitive data like access_code value)
    const response: {
      id: string;
      widget_type: string;
      button_text: string;
      display_text: string | null;
      require_access_code: boolean;
      contact_form_enabled: boolean;
      outbound_phone_number?: string;
    } = {
      id: widget.id,
      widget_type: widget.widget_type,
      button_text: widget.button_text,
      display_text: widget.display_text,
      require_access_code: widget.require_access_code || false,
      contact_form_enabled: widget.contact_form_enabled || false
    };

    // Include outbound phone number for outbound phone widgets
    if (widget.widget_type === 'outbound_phone' && widget.outbound_phone_number) {
      response.outbound_phone_number = widget.outbound_phone_number;
    }

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error) {
    console.error('Widget config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}