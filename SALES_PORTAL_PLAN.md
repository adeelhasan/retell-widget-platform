# Session-Based Sales Portal Implementation Plan

## Overview
Build a sales intelligence portal where contact form submissions become "sessions", linking all subsequent calls made during that session. Sales people can review transcripts, recordings, and track engagement depth.

---

## Phase 1: Database Schema & Sales People Setup

### 1.1 Create Sales People Table
**New migration:** `migrations/add_sales_people_table.sql`

```sql
CREATE TABLE sales_people (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Users can only see their own sales people
CREATE POLICY "Users manage own sales people" ON sales_people
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_sales_people_user_id ON sales_people(user_id);
```

### 1.2 Add Session Tracking Fields
**New migration:** `migrations/add_sales_session_tracking.sql`

```sql
-- Add sales_person_id to widgets
ALTER TABLE widgets ADD COLUMN sales_person_id TEXT REFERENCES sales_people(id) ON DELETE SET NULL;
CREATE INDEX idx_widgets_sales_person ON widgets(sales_person_id);

-- Link calls to contact form sessions
ALTER TABLE call_logs ADD COLUMN contact_form_submission_id UUID REFERENCES contact_form_submissions(id) ON DELETE SET NULL;
CREATE INDEX idx_call_logs_session ON call_logs(contact_form_submission_id);

-- Cache Retell API data in call_logs
ALTER TABLE call_logs ADD COLUMN transcript TEXT;
ALTER TABLE call_logs ADD COLUMN recording_url TEXT;
ALTER TABLE call_logs ADD COLUMN call_analysis JSONB;
ALTER TABLE call_logs ADD COLUMN retell_data_fetched_at TIMESTAMP WITH TIME ZONE;

-- Add session metadata to contact_form_submissions
ALTER TABLE contact_form_submissions ADD COLUMN total_calls INTEGER DEFAULT 0;
ALTER TABLE contact_form_submissions ADD COLUMN last_call_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contact_form_submissions ADD COLUMN session_notes TEXT;

-- Add global session timeout config (in hours)
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO platform_settings (key, value) VALUES ('session_timeout_hours', '4');
```

---

## Phase 2: Widget Form - Add Sales Person Selection

### 2.1 Update Widget Form UI
**File:** `src/components/features/WidgetForm.tsx`

- Add sales person dropdown field (loads from `sales_people` table)
- Shows existing sales people + option to create new inline
- Saves `sales_person_id` with widget

### 2.2 API Support
**File:** `src/app/api/sales-people/route.ts` (NEW)

```typescript
GET /api/sales-people
  - List all sales people for current user
  - Returns: { id, name, email }

POST /api/sales-people
  - Create new sales person
  - Body: { id, name, email }
```

---

## Phase 3: Widget Script - Session Tracking

### 3.1 Contact Form Submission Changes
**File:** `src/app/api/widgets/[id]/contact-form/route.ts`

Return `submission_id` after creating contact form entry:

```typescript
const { data: submission } = await supabaseAdmin
  .from('contact_form_submissions')
  .insert({ widget_id, user_id, name, company, email })
  .select('id')
  .single();

return NextResponse.json({
  success: true,
  submission_id: submission.id  // NEW - return to frontend
});
```

### 3.2 Widget Script Updates
**File:** `src/app/api/widget-simple/route.ts`

In `promptForContactInfo()`, store session ID after successful submission:

```javascript
const response = await fetch(`${this.baseUrl}/api/widgets/${this.widgetId}/contact-form`, ...);
const { submission_id } = await response.json();

// Store session ID for linking future calls
sessionStorage.setItem(`retell_session_id_${this.widgetId}`, submission_id);
```

In `startInboundWebCall()` and `startOutboundWebCall()`, include session ID:

```javascript
const sessionId = sessionStorage.getItem(`retell_session_id_${this.widgetId}`);

const response = await fetch(`${this.baseUrl}/api/v1/register-call`, {
  body: JSON.stringify({
    widget_id: this.widgetId,
    contact_form_submission_id: sessionId,  // NEW - link to session
    metadata: this.getMetadata()
  })
});
```

### 3.3 Session Expiry Logic
**File:** `src/app/api/widget-simple/route.ts`

Check session expiry before using cached session:

```javascript
const sessionId = sessionStorage.getItem(`retell_session_id_${this.widgetId}`);
const sessionTimestamp = sessionStorage.getItem(`retell_session_timestamp_${this.widgetId}`);

if (sessionId && sessionTimestamp) {
  const hoursElapsed = (Date.now() - parseInt(sessionTimestamp)) / (1000 * 60 * 60);
  const timeoutHours = 4; // Could fetch from config endpoint

  if (hoursElapsed > timeoutHours) {
    // Session expired - clear and prompt for new contact form
    sessionStorage.removeItem(`retell_session_id_${this.widgetId}`);
    sessionStorage.removeItem(`retell_session_timestamp_${this.widgetId}`);
    sessionStorage.removeItem(`retell_contact_info_${this.widgetId}`);
  }
}
```

Store timestamp when session created:

```javascript
sessionStorage.setItem(`retell_session_id_${this.widgetId}`, submission_id);
sessionStorage.setItem(`retell_session_timestamp_${this.widgetId}`, Date.now().toString());
```

---

## Phase 4: Call Registration - Link to Sessions

### 4.1 Update Register Call Endpoint
**File:** `src/app/api/v1/register-call/route.ts`

Accept and store `contact_form_submission_id`:

```typescript
const { contact_form_submission_id } = await request.json();

// Create call log with session link
const { data: callLog } = await supabase
  .from('call_logs')
  .insert({
    widget_id,
    user_id: widget.user_id,
    call_id: retellCallId,
    contact_form_submission_id,  // NEW - link to session
    call_type: widget.widget_type,
    started_at: new Date().toISOString()
  })
  .select()
  .single();

// Update session metadata
if (contact_form_submission_id) {
  await supabase
    .from('contact_form_submissions')
    .update({
      total_calls: sql`total_calls + 1`,
      last_call_at: new Date().toISOString()
    })
    .eq('id', contact_form_submission_id);
}
```

---

## Phase 5: Retell API Integration

### 5.1 Retell API Helper
**New file:** `src/lib/retell-api.ts`

```typescript
export async function fetchRetellCallData(callId: string, apiKey: string) {
  const response = await fetch(`https://api.retellai.com/v2/get-call/${callId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) throw new Error('Failed to fetch Retell data');

  const data = await response.json();

  return {
    transcript: data.transcript || null,
    recording_url: data.recording_url || null,
    duration_ms: data.duration_ms || null,
    call_status: data.call_status, // ongoing, ended, error
    call_analysis: {
      summary: data.call_analysis?.summary,
      sentiment: data.call_analysis?.sentiment,
      success_indicator: data.call_analysis?.success_indicator
    },
    start_timestamp: data.start_timestamp,
    end_timestamp: data.end_timestamp
  };
}
```

### 5.2 Fetch Retell Data API
**New file:** `src/app/api/calls/[callId]/retell-data/route.ts`

```typescript
export const GET = withAuthAsync(async (request, user, params) => {
  const { callId } = params;

  // Get call log with widget (for API key)
  const { data: call } = await supabase
    .from('call_logs')
    .select('*, widgets!inner(retell_api_key, user_id)')
    .eq('call_id', callId)
    .eq('widgets.user_id', user.id)  // RLS: user must own widget
    .single();

  if (!call) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Return cached data if already fetched and call ended
  if (call.retell_data_fetched_at && call.transcript) {
    return NextResponse.json({
      transcript: call.transcript,
      recording_url: call.recording_url,
      call_analysis: call.call_analysis,
      cached: true
    });
  }

  // Fetch from Retell API
  try {
    const retellData = await fetchRetellCallData(callId, call.widgets.retell_api_key);

    // Only cache if call has ended (has transcript + recording)
    if (retellData.call_status === 'ended' && retellData.transcript) {
      await supabase
        .from('call_logs')
        .update({
          transcript: retellData.transcript,
          recording_url: retellData.recording_url,
          duration_seconds: Math.round(retellData.duration_ms / 1000),
          call_analysis: retellData.call_analysis,
          call_status: 'ended',
          retell_data_fetched_at: new Date().toISOString()
        })
        .eq('id', call.id);
    }

    return NextResponse.json({ ...retellData, cached: false });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch from Retell',
      details: error.message
    }, { status: 500 });
  }
});
```

---

## Phase 6: Sales Portal UI

### 6.1 Navigation Updates
**File:** `src/components/layouts/Header.tsx`

Add "Sales Portal" link to main navigation (after Dashboard, before Settings)

### 6.2 Sessions List Page
**New file:** `src/app/dashboard/sales-portal/page.tsx`

Main sales portal landing page showing all sessions:

```tsx
- Page title: "Sales Portal"
- Filter bar:
  - Sales person dropdown (All / specific person)
  - Date range picker
  - Search by name/company/email
- Table columns:
  - Contact (Name, Company, Email)
  - Sales Person
  - Total Calls
  - Total Duration (sum of all calls)
  - Last Call At
  - Submitted At
  - Actions: [View Session]
- Pagination (20 per page)
```

**New API:** `GET /api/sales-portal/sessions`

```typescript
Query params:
  - sales_person_id (optional)
  - date_from / date_to (optional)
  - search (optional)
  - page, limit

Returns: {
  sessions: [{
    id, name, company, email, submitted_at,
    total_calls, last_call_at,
    widget_name, sales_person_name,
    total_duration_seconds
  }],
  total, page, limit
}
```

### 6.3 Session Detail Page
**New file:** `src/app/dashboard/sales-portal/sessions/[id]/page.tsx`

Detailed view of one session:

```tsx
Layout:
┌─────────────────────────────────────────────┐
│ Contact Information Card                     │
│ - Name, Company, Email                       │
│ - Widget Name, Sales Person                  │
│ - Submitted At                               │
│ - Editable Notes field (session_notes)       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Session Statistics                           │
│ - Total Calls: 3                             │
│ - Total Duration: 12m 35s                    │
│ - Last Call: Jan 15, 3:15 PM                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Calls in This Session                        │
│                                              │
│ Call #1 - Jan 15, 2:35 PM                    │
│ Duration: 3m 42s | Status: Ended             │
│ Sentiment: Positive ✓                        │
│ Summary: Customer interested in pricing...   │
│ [View Transcript] [Play Recording]           │
│                                              │
│ Call #2 - Jan 15, 2:50 PM                    │
│ Duration: 5m 12s | Status: Ended             │
│ Sentiment: Neutral                           │
│ [View Transcript] [Play Recording]           │
│                                              │
│ Call #3 - Jan 15, 3:15 PM                    │
│ Duration: 3m 41s | Status: Ended             │
│ [View Transcript] [Play Recording]           │
└─────────────────────────────────────────────┘
```

**New API:** `GET /api/sales-portal/sessions/[id]`

```typescript
Returns: {
  session: { id, name, company, email, ... },
  calls: [{
    call_id, started_at, duration_seconds,
    call_status, // 'ongoing' or 'ended'
    has_transcript: boolean,
    call_analysis: { sentiment, summary }
  }],
  widget: { name, sales_person_name }
}
```

### 6.4 Transcript Viewer Component
**New file:** `src/components/features/TranscriptViewer.tsx`

Modal/expandable panel showing:
- Call metadata (date, duration, sentiment)
- Formatted transcript with timestamps
- "Fetch Transcript" button if not yet loaded
- Loading states for ongoing calls

Clicks "View Transcript" → Calls `/api/calls/[callId]/retell-data` → Displays

### 6.5 Audio Player Component
**New file:** `src/components/features/AudioPlayer.tsx`

- HTML5 audio player with recording URL
- Shows "Recording not available" for ongoing calls
- Play/pause, seek, volume controls
- Downloads recording URL from Retell via `/api/calls/[callId]/retell-data`

---

## Phase 7: API Endpoints Summary

**New endpoints:**
1. `GET /api/sales-people` - List sales people
2. `POST /api/sales-people` - Create sales person
3. `GET /api/sales-portal/sessions` - List all sessions (filterable)
4. `GET /api/sales-portal/sessions/[id]` - Session details + calls
5. `PATCH /api/sales-portal/sessions/[id]` - Update session notes
6. `GET /api/calls/[callId]/retell-data` - Fetch & cache Retell data

**Modified endpoints:**
- `POST /api/widgets/[id]/contact-form` - Returns submission_id
- `POST /api/v1/register-call` - Accepts contact_form_submission_id

---

## Implementation Order (12 Tasks)

**Task 1:** Database migrations (Phase 1)
**Task 2:** Sales people API endpoints
**Task 3:** Widget form - add sales person field
**Task 4:** Contact form API - return submission_id
**Task 5:** Widget script - store session ID
**Task 6:** Widget script - session expiry logic
**Task 7:** Register call API - link to session
**Task 8:** Retell API helper lib
**Task 9:** Fetch Retell data API endpoint
**Task 10:** Sales portal sessions list page
**Task 11:** Session detail page with calls
**Task 12:** Transcript viewer + audio player components

---

## Key Design Decisions

✅ **Metadata:** Set per-widget in dashboard (not per-embed)
✅ **Sales people:** Track ID, name, email
✅ **Session timeout:** Global setting (4 hours default)
✅ **Permissions:** Org-wide visibility, filterable by sales person
✅ **Retell fetching:** On-demand when viewing (not webhook auto-fetch)
✅ **Caching:** Store transcript/recording in DB to avoid repeated API calls
✅ **Ongoing calls:** Check call_status before displaying transcript/recording

---

## Future Integration Points

### GoHighLevel Integration (Optional)
Once the internal system is working, we can add webhook integration to sync data to GHL:

- Contact form submissions → Create/update GHL contact
- Call completions → Log activity in GHL
- Keep internal data as source of truth
- GHL becomes secondary sync for sales team workflows

This hybrid approach gives us flexibility to swap CRMs later while maintaining our own analytics.
