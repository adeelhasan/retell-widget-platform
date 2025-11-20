export type WidgetType = 'inbound_web' | 'inbound_phone' | 'outbound_phone' | 'outbound_web';
export type CallType = 'inbound_web' | 'inbound_phone' | 'outbound_phone' | 'outbound_web';
export type CallStatus = 'ongoing' | 'ended' | 'error';

export interface Widget {
  id: string;
  user_id: string;
  name: string;
  retell_api_key: string;
  agent_id: string;
  allowed_domain: string;
  button_text: string;
  rate_limit_calls_per_hour: number | null;
  rate_limit_enabled: boolean;
  daily_minutes_limit: number | null;
  daily_minutes_enabled: boolean;
  access_code?: string | null;
  require_access_code: boolean;
  contact_form_enabled: boolean;
  collector_email?: string | null;
  widget_type: WidgetType;
  display_text?: string;
  inbound_phone_number?: string;
  outbound_phone_number?: string;
  created_at: string;
}

export interface CallLog {
  id: string;
  widget_id: string;
  user_id: string;
  call_id: string;
  call_type: CallType;
  started_at: string;
  duration_seconds: number | null;
  call_status: CallStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateWidgetRequest {
  name: string;
  retell_api_key: string;
  agent_id: string;
  allowed_domain: string;
  button_text?: string;
  rate_limit_calls_per_hour?: number;
  daily_minutes_limit?: number;
  daily_minutes_enabled?: boolean;
  access_code?: string;
  require_access_code?: boolean;
  contact_form_enabled?: boolean;
  collector_email?: string;
  widget_type?: WidgetType;
  display_text?: string;
  outbound_phone_number?: string;
}

export interface UpdateWidgetRequest {
  name?: string;
  retell_api_key?: string;
  agent_id?: string;
  allowed_domain?: string;
  button_text?: string;
  rate_limit_calls_per_hour?: number;
  daily_minutes_limit?: number;
  daily_minutes_enabled?: boolean;
  access_code?: string;
  require_access_code?: boolean;
  contact_form_enabled?: boolean;
  collector_email?: string;
  widget_type?: WidgetType;
  display_text?: string;
  outbound_phone_number?: string;
}

export interface RegisterCallRequest {
  widget_id: string;
  metadata?: Record<string, unknown>;
  access_code?: string;
}

export interface RegisterCallResponse {
  call_id: string;
  access_token?: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

export interface PhoneVerification {
  id: string;
  phone_number: string;
  verification_code: string;
  widget_id: string;
  verified_at?: string;
  expires_at: string;
  created_at: string;
}

export interface ContactFormSubmission {
  id: string;
  widget_id: string;
  user_id: string;
  name: string;
  company: string;
  email: string;
  submitted_at: string;
  created_at: string;
}

export interface SubmitContactFormRequest {
  name: string;
  company: string;
  email: string;
}

export interface SubmitContactFormResponse {
  success: boolean;
  message: string;
}