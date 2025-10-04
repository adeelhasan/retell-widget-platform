import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get('widget_id');
    const origin = request.headers.get('origin');

    if (!widgetId) {
      return NextResponse.json({ error: 'Widget ID required' }, { status: 400 });
    }

    // Get widget configuration
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: widget, error } = await supabase
      .from('widgets')
      .select('id, widget_type, button_text, display_text, agent_persona, opening_message, allowed_domain, outbound_phone_number, default_agent_name, default_property_type, default_lead_source, default_contact_email, default_notes')
      .eq('id', widgetId)
      .single();

    if (error || !widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
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
    
    if (!isAllowedDomain(effectiveOrigin, widget.allowed_domain)) {
      console.log('❌ Domain not authorized:', { origin, effectiveOrigin, allowed_domain: widget.allowed_domain });
      return NextResponse.json({ error: 'Domain not authorized' }, { status: 403 });
    }
    
    console.log('✅ Domain authorized for widget:', widget.id);

    // Return widget configuration (excluding sensitive data)
    const response: {
      id: string;
      widget_type: string;
      button_text: string;
      display_text: string | null;
      agent_persona: string | null;
      opening_message: string | null;
      default_metadata: {
        agent_name: string | null;
        property_type: string | null;
        lead_source: string | null;
        contact_email: string | null;
        notes: string | null;
      };
      outbound_phone_number?: string;
    } = {
      id: widget.id,
      widget_type: widget.widget_type,
      button_text: widget.button_text,
      display_text: widget.display_text,
      agent_persona: widget.agent_persona,
      opening_message: widget.opening_message,
      default_metadata: {
        agent_name: widget.default_agent_name,
        property_type: widget.default_property_type,
        lead_source: widget.default_lead_source,
        contact_email: widget.default_contact_email,
        notes: widget.default_notes
      }
    };

    // Include outbound phone number for outbound phone widgets
    if (widget.widget_type === 'outbound_phone' && widget.outbound_phone_number) {
      response.outbound_phone_number = widget.outbound_phone_number;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Widget config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function isAllowedDomain(origin: string | null, allowedDomain: string): boolean {
  if (!origin || !allowedDomain) return false;
  
  const originHost = new URL(origin).hostname;
  
  // Handle exact matches
  if (originHost === allowedDomain) return true;
  
  // Handle wildcard patterns
  if (allowedDomain.includes('*')) {
    const pattern = allowedDomain
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(originHost);
  }
  
  // Handle localhost for development
  if (allowedDomain === 'localhost' && (originHost === 'localhost' || originHost.startsWith('127.0.0.1'))) {
    return true;
  }
  
  return false;
}