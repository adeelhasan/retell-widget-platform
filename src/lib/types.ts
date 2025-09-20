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
  created_at: string;
}

export interface CreateWidgetRequest {
  name: string;
  retell_api_key: string;
  agent_id: string;
  allowed_domain: string;
  button_text?: string;
  rate_limit_calls_per_hour?: number;
}

export interface UpdateWidgetRequest {
  name?: string;
  retell_api_key?: string;
  agent_id?: string;
  allowed_domain?: string;
  button_text?: string;
  rate_limit_calls_per_hour?: number;
}

export interface RegisterCallRequest {
  widget_id: string;
  metadata?: Record<string, unknown>;
}

export interface RegisterCallResponse {
  call_id: string;
  access_token?: string;
}

export interface ApiError {
  error: string;
  details?: string;
}