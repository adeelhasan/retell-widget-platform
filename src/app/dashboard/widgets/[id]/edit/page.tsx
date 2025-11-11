'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/layouts/AppLayout';
import { WidgetForm } from '@/components/features/WidgetForm';
import { apiClient } from '@/lib/api-client';
import { Widget, CreateWidgetRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditWidgetPage() {
  const router = useRouter();
  const params = useParams();
  const widgetId = params.id as string;

  const [widget, setWidget] = useState<Widget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Edit Widget - Retell Widget Platform';

    async function fetchWidget() {
      try {
        const data = await apiClient.getWidget(widgetId);
        setWidget(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load widget');
        toast.error('Failed to load widget');
      } finally {
        setLoading(false);
      }
    }

    fetchWidget();
  }, [widgetId]);

  const handleSubmit = async (data: CreateWidgetRequest) => {
    setSaving(true);
    try {
      await apiClient.updateWidget(widgetId, data);
      toast.success('Widget updated successfully!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update widget');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error || !widget) {
    return (
      <AppLayout>
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error || 'Widget not found'}</p>
          <Button onClick={handleCancel}>Return to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <WidgetForm
          widget={widget}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={saving}
          mode="edit"
          showCard={true}
        />
      </div>
    </AppLayout>
  );
}
