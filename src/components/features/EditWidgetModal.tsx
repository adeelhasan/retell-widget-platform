'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Widget, UpdateWidgetRequest } from '@/lib/types';
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

  const handleSubmit = async (data: UpdateWidgetRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedWidget = await apiClient.updateWidget(widget.id, data);
      
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
        />
      </DialogContent>
    </Dialog>
  );
}