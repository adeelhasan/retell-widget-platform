export type WidgetType = 'inbound_web' | 'inbound_phone' | 'outbound_phone' | 'outbound_web';

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
  access_code?: string | null;
  require_access_code: boolean;
  widget_type: WidgetType;
  display_text?: string;
  agent_persona?: string;
  opening_message?: string;
  inbound_phone_number?: string;
  outbound_phone_number?: string;
  created_at: string;
}

export interface CreateWidgetRequest {
  name: string;
  retell_api_key: string;
  agent_id: string;
  allowed_domain: string;
  button_text?: string;
  rate_limit_calls_per_hour?: number;
  access_code?: string;
  require_access_code?: boolean;
  widget_type?: WidgetType;
  display_text?: string;
  agent_persona?: string;
  opening_message?: string;
  outbound_phone_number?: string;
}

export interface UpdateWidgetRequest {
  name?: string;
  retell_api_key?: string;
  agent_id?: string;
  allowed_domain?: string;
  button_text?: string;
  rate_limit_calls_per_hour?: number;
  access_code?: string;
  require_access_code?: boolean;
  widget_type?: WidgetType;
  display_text?: string;
  agent_persona?: string;
  opening_message?: string;
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