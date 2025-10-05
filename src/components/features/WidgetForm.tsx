'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Widget, CreateWidgetRequest, WidgetType } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface WidgetFormProps {
  widget?: Widget;
  onSubmit: (data: CreateWidgetRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

export function WidgetForm({ widget, onSubmit, onCancel, loading, mode = 'create' }: WidgetFormProps) {
  const [formData, setFormData] = useState<CreateWidgetRequest>({
    name: widget?.name || '',
    retell_api_key: widget?.retell_api_key || '',
    agent_id: widget?.agent_id || '',
    allowed_domain: widget?.allowed_domain || '',
    button_text: widget?.button_text || getDefaultButtonText(widget?.widget_type || 'inbound_web'),
    rate_limit_calls_per_hour: widget?.rate_limit_calls_per_hour || undefined,
    widget_type: widget?.widget_type || 'inbound_web',
    display_text: widget?.display_text || '',
    agent_persona: widget?.agent_persona || '',
    opening_message: widget?.opening_message || '',
    outbound_phone_number: widget?.outbound_phone_number || ''
  });

  const isEditMode = mode === 'edit' || !!widget;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Trim all string fields to prevent whitespace issues
    const trimmedData = {
      ...formData,
      name: formData.name.trim(),
      retell_api_key: formData.retell_api_key.trim(),
      agent_id: formData.agent_id.trim(),
      allowed_domain: formData.allowed_domain.trim(),
      button_text: formData.button_text?.trim() || '',
      display_text: formData.display_text?.trim(),
      agent_persona: formData.agent_persona?.trim(),
      opening_message: formData.opening_message?.trim(),
      outbound_phone_number: formData.outbound_phone_number?.trim()
    };

    onSubmit(trimmedData);
  };

  const handleChange = (field: keyof CreateWidgetRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'rate_limit_calls_per_hour' 
        ? (value ? parseInt(value) : undefined)
        : value
    }));
  };

  const handleSelectChange = (field: keyof CreateWidgetRequest) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Update button text when widget type changes
      ...(field === 'widget_type' ? { button_text: getDefaultButtonText(value as WidgetType) } : {})
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Widget' : 'Create New Widget'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Widget Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="widget_type">Widget Type</Label>
            <Select value={formData.widget_type} onValueChange={handleSelectChange('widget_type')}>
              <SelectTrigger>
                <SelectValue placeholder="Select widget type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound_web">
                  <div className="flex items-center gap-2">
                    🎤 Inbound WebCall
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Current</span>
                  </div>
                </SelectItem>
                <SelectItem value="inbound_phone">
                  <div className="flex items-center gap-2">
                    📞 Inbound PhoneCall
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">New</span>
                  </div>
                </SelectItem>
                <SelectItem value="outbound_phone">
                  <div className="flex items-center gap-2">
                    📱 Outbound PhoneCall
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">New</span>
                  </div>
                </SelectItem>
                <SelectItem value="outbound_web">
                  <div className="flex items-center gap-2">
                    🔔 Outbound WebCall
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">New</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getWidgetTypeDescription(formData.widget_type || 'inbound_web')}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Widget Name</Label>
            <Input 
              id="name" 
              placeholder="My Voice Demo Widget" 
              value={formData.name}
              onChange={handleChange('name')}
              required
              maxLength={100}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">Retell API Key</Label>
            <Input 
              id="apiKey" 
              type="password" 
              placeholder="key_..." 
              value={formData.retell_api_key}
              onChange={handleChange('retell_api_key')}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agentId">Agent ID</Label>
            <Input 
              id="agentId" 
              placeholder="agent_..." 
              value={formData.agent_id}
              onChange={handleChange('agent_id')}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="domain">Allowed Domain</Label>
            <Input 
              id="domain" 
              type="text" 
              placeholder="domain.com or *.domain.com" 
              value={formData.allowed_domain}
              onChange={handleChange('allowed_domain')}
              required
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Supported formats:</p>
              <ul className="ml-4 space-y-0.5">
                <li>• <code className="bg-muted px-1 rounded">x.ai</code> - exact domain</li>
                <li>• <code className="bg-muted px-1 rounded">*.x.ai</code> - any subdomain of x.ai</li>
                <li>• <code className="bg-muted px-1 rounded">*.domain.*</code> - domain with any TLD</li>
                <li>• <code className="bg-muted px-1 rounded">localhost</code> - for development</li>
              </ul>
            </div>
          </div>
          
          {/* Dynamic fields based on widget type */}
          {renderTypeSpecificFields(formData.widget_type || 'inbound_web', formData, handleChange, handleSelectChange)}

          <div className="space-y-2">
            <Label htmlFor="buttonText">Button Text</Label>
            <Input
              id="buttonText"
              placeholder={getButtonTextPlaceholder(formData.widget_type || 'inbound_web')}
              value={formData.button_text}
              onChange={handleChange('button_text')}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {getButtonTextDescription(formData.widget_type || 'inbound_web')}
            </p>
          </div>

          {/* Rate limiting only for web calls */}
          {(formData.widget_type === 'inbound_web' || formData.widget_type === 'outbound_web') && (
            <div className="space-y-2">
              <Label htmlFor="rateLimit">Rate Limit (calls per hour)</Label>
              <Input 
                id="rateLimit" 
                type="number"
                placeholder="10"
                min="1"
                max="1000"
                value={formData.rate_limit_calls_per_hour || ''}
                onChange={handleChange('rate_limit_calls_per_hour')}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use global default (10 calls/hour)
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditMode ? 'Update Widget' : 'Create Widget'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function getDefaultButtonText(widgetType: WidgetType): string {
  switch (widgetType) {
    case 'inbound_web':
      return 'Start Voice Demo';
    case 'inbound_phone':
      return 'Call Us Now';
    case 'outbound_phone':
      return 'Call Me Now';
    case 'outbound_web':
      return 'Answer Call';
    default:
      return 'Start Voice Demo';
  }
}

function getWidgetTypeDescription(widgetType: WidgetType): string {
  switch (widgetType) {
    case 'inbound_web':
      return 'User clicks button to start voice call in browser';
    case 'inbound_phone':
      return 'User clicks to call a phone number';
    case 'outbound_phone':
      return 'User enters phone number to receive a call';
    case 'outbound_web':
      return 'Simulated incoming call experience in browser';
    default:
      return '';
  }
}

function getButtonTextPlaceholder(widgetType: WidgetType): string {
  switch (widgetType) {
    case 'inbound_web':
      return 'Start Voice Demo';
    case 'inbound_phone':
      return 'Call Us Now';
    case 'outbound_phone':
      return 'Call Me Now';
    case 'outbound_web':
      return 'Answer Call';
    default:
      return 'Start Voice Demo';
  }
}

function getButtonTextDescription(widgetType: WidgetType): string {
  switch (widgetType) {
    case 'inbound_web':
      return 'Text shown on the button users click to start the call';
    case 'inbound_phone':
      return 'Button label. The phone number will be auto-detected from your agent and displayed on the button.';
    case 'outbound_phone':
      return 'Text shown on the button to request a callback';
    case 'outbound_web':
      return 'Text shown on the button to simulate answering an incoming call';
    default:
      return '';
  }
}

function renderTypeSpecificFields(
  widgetType: WidgetType, 
  formData: CreateWidgetRequest, 
  handleChange: (field: keyof CreateWidgetRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
  handleSelectChange: (field: keyof CreateWidgetRequest) => (value: string) => void
) {
  switch (widgetType) {
    case 'inbound_web':
      return null; // No additional fields needed
      
    case 'inbound_phone':
      return null; // Phone number is auto-detected, button text is configured below
      
    case 'outbound_phone':
      return (
        <div className="space-y-2">
          <Label htmlFor="outbound_phone_number">Outbound Phone Number</Label>
          <Input
            id="outbound_phone_number"
            placeholder="+12025551234"
            value={formData.outbound_phone_number || ''}
            onChange={handleChange('outbound_phone_number')}
            required
            pattern="^\+[1-9]\d{10,14}$"
          />
          <p className="text-xs text-muted-foreground">
            Your Retell phone number in E.164 format (e.g., +12025551234). This is the number that will call your users.
          </p>
        </div>
      );
      
    case 'outbound_web':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent_persona">Agent Persona</Label>
            <Input 
              id="agent_persona" 
              placeholder="Sarah from Acme Corp"
              value={formData.agent_persona || ''}
              onChange={handleChange('agent_persona')}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Who is calling? This will be displayed to the user.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="opening_message">Opening Message</Label>
            <Textarea 
              id="opening_message" 
              placeholder="Hi! This is Sarah calling about your recent inquiry..."
              value={formData.opening_message || ''}
              onChange={handleChange('opening_message')}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              The message your agent will start with when the call begins.
            </p>
          </div>
        </div>
      );
      
    default:
      return null;
  }
}