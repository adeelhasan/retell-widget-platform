'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Widget, CreateWidgetRequest, UpdateWidgetRequest } from '@/lib/types';
import { WidgetForm } from './WidgetForm';
import { apiClient } from '@/lib/api-client';

interface EditWidgetModalProps {
  widget: Widget | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: (updatedWidget: Widget) => void;
}

export function EditWidgetModal({ widget, open, onClose, onSuccess }: EditWidgetModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!widget) return null;

  const handleSubmit = async (data: CreateWidgetRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert CreateWidgetRequest to UpdateWidgetRequest for the API
      const updateData: UpdateWidgetRequest = {
        name: data.name,
        retell_api_key: data.retell_api_key,
        agent_id: data.agent_id,
        allowed_domain: data.allowed_domain,
        button_text: data.button_text,
        rate_limit_calls_per_hour: data.rate_limit_calls_per_hour,
        daily_minutes_limit: data.daily_minutes_limit,
        daily_minutes_enabled: data.daily_minutes_enabled,
        access_code: data.access_code,
        require_access_code: data.require_access_code,
        widget_type: data.widget_type,
        display_text: data.display_text,
        agent_persona: data.agent_persona,
        opening_message: data.opening_message,
        outbound_phone_number: data.outbound_phone_number
      };
      
      const updatedWidget = await apiClient.updateWidget(widget.id, updateData);
      
      if (onSuccess) {
        onSuccess(updatedWidget);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to update widget:', error);
      setError(error instanceof Error ? error.message : 'Failed to update widget');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Widget</DialogTitle>
          <DialogDescription>
            Update the settings for &quot;{widget.name}&quot;
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm rounded-md p-3 mb-4">
            {error}
          </div>
        )}
        
        <WidgetForm
          widget={widget}
          mode="edit"
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={loading}
          showCard={false}
        />
      </DialogContent>
    </Dialog>
  );
}