import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { SubmitContactFormRequest } from '@/lib/types';
import { isAllowedDomains } from '@/lib/security';

// Rate limiting map for contact form submissions (in-memory for now)
// TODO: Move to Redis or database for production
const submissionRateLimits = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_HOUR = 5; // Limit to 5 submissions per hour per IP

/**
 * Simple rate limiting for contact form submissions
 */
function checkContactFormRateLimit(ipAddress: string): boolean {
  const now = Date.now();
  const timestamps = submissionRateLimits.get(ipAddress) || [];

  // Remove timestamps older than the window
  const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  // Check if limit exceeded
  if (recentTimestamps.length >= MAX_SUBMISSIONS_PER_HOUR) {
    return false;
  }

  // Add new timestamp
  recentTimestamps.push(now);
  submissionRateLimits.set(ipAddress, recentTimestamps);

  return true;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Send email notification (placeholder for now)
 * TODO: Implement actual email sending via Resend/SendGrid
 */
async function sendContactFormEmail(
  collectorEmail: string,
  formData: {
    name: string;
    company: string;
    email: string;
  },
  widgetName: string
): Promise<void> {
  // TODO: Implement email sending
  console.log('📧 Contact form submission received:');
  console.log(`   Widget: ${widgetName}`);
  console.log(`   To: ${collectorEmail}`);
  console.log(`   From: ${formData.name} (${formData.email})`);
  console.log(`   Company: ${formData.company}`);

  // For now, just log. In production, integrate with Resend, SendGrid, or similar
  // Example with Resend:
  // await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     from: 'noreply@yourdomain.com',
  //     to: collectorEmail,
  //     subject: `New Contact Form Submission - ${widgetName}`,
  //     html: `
  //       <h2>New Contact Form Submission</h2>
  //       <p><strong>Name:</strong> ${formData.name}</p>
  //       <p><strong>Company:</strong> ${formData.company}</p>
  //       <p><strong>Email:</strong> ${formData.email}</p>
  //     `
  //   })
  // });
}

// OPTIONS /api/widgets/[id]/contact-form - Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Origin',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

// POST /api/widgets/[id]/contact-form - Submit contact form
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: widgetId } = await params;

    // Get origin for domain verification
    const origin = request.headers.get('origin') || '';

    // CORS headers for response
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Origin',
    };

    if (!origin) {
      return NextResponse.json(
        { error: 'Missing origin header' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get IP address for rate limiting
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown';

    // Check rate limit
    if (!checkContactFormRateLimit(ipAddress)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: corsHeaders }
      );
    }

    // Parse and validate request body
    const body: SubmitContactFormRequest = await request.json();
    const { name, company, email } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!company || company.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!email || !isValidEmail(email.trim())) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Trim all inputs
    const cleanData = {
      name: name.trim().substring(0, 100),
      company: company.trim().substring(0, 100),
      email: email.trim().toLowerCase()
    };

    // Validate widget ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(widgetId)) {
      return NextResponse.json(
        { error: 'Invalid widget ID format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch widget configuration
    const { data: widget, error: widgetError } = await supabaseAdmin
      .from('widgets')
      .select('*')
      .eq('id', widgetId)
      .single();

    if (widgetError || !widget) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify domain authorization
    if (!isAllowedDomains(origin, widget.allowed_domain)) {
      return NextResponse.json(
        { error: 'Domain not authorized for this widget' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if contact form is enabled
    if (!widget.contact_form_enabled) {
      return NextResponse.json(
        { error: 'Contact form not enabled for this widget' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify collector email is configured (optional - allow submission without email)
    if (!widget.collector_email) {
      console.log('ℹ️ Contact form enabled but no collector email configured for widget:', widgetId);
      // Don't fail - just log and continue to save the submission
    }

    // Store submission in database
    const { error: insertError } = await supabaseAdmin
      .from('contact_form_submissions')
      .insert({
        widget_id: widgetId,
        user_id: widget.user_id,
        name: cleanData.name,
        company: cleanData.company,
        email: cleanData.email,
      });

    if (insertError) {
      console.error('Failed to store contact form submission:', insertError);
      return NextResponse.json(
        { error: 'Failed to process submission' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Send email notification (only if collector_email is configured)
    if (widget.collector_email) {
      try {
        await sendContactFormEmail(
          widget.collector_email,
          cleanData,
          widget.name
        );
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email sending fails
        // The submission is already stored in the database
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Contact form submitted successfully'
      },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Origin',
        }
      }
    );
  }
}
