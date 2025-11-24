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
 * Send email notification via Resend
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
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not configured - email not sent');
    throw new Error('Email service not configured');
  }

  // Use widget name as display name, fallback to env var or default
  const baseFromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@yourdomain.com';

  // If RESEND_FROM_EMAIL already has a display name format, extract just the email
  const emailMatch = baseFromEmail.match(/<(.+)>/);
  const emailAddress = emailMatch ? emailMatch[1] : baseFromEmail;

  // Create from address with widget name as display name
  const fromEmail = `${widgetName} <${emailAddress}>`;

  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: collectorEmail,
        subject: `New Contact Form Submission - ${widgetName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
            </div>

            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                You received a new contact from your widget: <strong style="color: #1f2937;">${widgetName}</strong>
              </p>

              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #3b82f6;">
                <div style="margin-bottom: 16px;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Name</p>
                  <p style="color: #1f2937; font-size: 16px; margin: 0; font-weight: 600;">${formData.name}</p>
                </div>

                <div style="margin-bottom: 16px;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Company</p>
                  <p style="color: #1f2937; font-size: 16px; margin: 0; font-weight: 600;">${formData.company}</p>
                </div>

                <div>
                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Email</p>
                  <p style="margin: 0;">
                    <a href="mailto:${formData.email}" style="color: #3b82f6; font-size: 16px; font-weight: 600; text-decoration: none;">
                      ${formData.email}
                    </a>
                  </p>
                </div>
              </div>

              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                  <strong>Submitted:</strong> ${timestamp}
                </p>
              </div>
            </div>

            <div style="margin-top: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This notification was sent from your Retell Widget Platform
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Resend API error:', errorData);
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully via Resend');
    console.log(`   Email ID: ${result.id}`);
    console.log(`   To: ${collectorEmail}`);
    console.log(`   Widget: ${widgetName}`);

  } catch (error) {
    console.error('❌ Failed to send contact form email:', error);
    throw error; // Re-throw so caller knows it failed
  }
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
