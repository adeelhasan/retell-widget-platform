'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Widget, CreateWidgetRequest } from '@/lib/types';

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
    button_text: widget?.button_text || 'Start Voice Demo',
    rate_limit_calls_per_hour: widget?.rate_limit_calls_per_hour || undefined
  });

  const isEditMode = mode === 'edit' || !!widget;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreateWidgetRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'rate_limit_calls_per_hour' 
        ? (value ? parseInt(value) : undefined)
        : value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Widget' : 'Create New Widget'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              type="url" 
              placeholder="https://example.com" 
              value={formData.allowed_domain}
              onChange={handleChange('allowed_domain')}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="buttonText">Button Text</Label>
            <Input 
              id="buttonText" 
              placeholder="Start Voice Demo"
              value={formData.button_text}
              onChange={handleChange('button_text')}
              maxLength={50}
            />
          </div>

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