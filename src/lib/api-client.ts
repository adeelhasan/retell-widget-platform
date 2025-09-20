import { supabase } from './supabase';
import { Widget, CreateWidgetRequest, UpdateWidgetRequest, RegisterCallRequest, RegisterCallResponse } from './types';

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    console.log('API Request:', {
      endpoint,
      method: options.method || 'GET',
      hasToken: !!token,
      body: options.body
    });
    
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error('API Error Details:', error);
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Widget CRUD operations
  async getWidgets(): Promise<Widget[]> {
    return this.request<Widget[]>('/api/widgets');
  }

  async createWidget(data: CreateWidgetRequest): Promise<Widget> {
    return this.request<Widget>('/api/widgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWidget(id: string): Promise<Widget> {
    return this.request<Widget>(`/api/widgets/${id}`);
  }

  async updateWidget(id: string, data: UpdateWidgetRequest): Promise<Widget> {
    return this.request<Widget>(`/api/widgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWidget(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/widgets/${id}`, {
      method: 'DELETE',
    });
  }

  // Public call registration (no auth required)
  async registerCall(data: RegisterCallRequest): Promise<RegisterCallResponse> {
    const response = await fetch('/api/v1/register-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();