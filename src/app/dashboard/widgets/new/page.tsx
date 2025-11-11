'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layouts/AppLayout';
import { WidgetForm } from '@/components/features/WidgetForm';
import { apiClient } from '@/lib/api-client';
import { CreateWidgetRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewWidgetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Create Widget - Retell Widget Platform';
  }, []);

  const handleSubmit = async (data: CreateWidgetRequest) => {
    setLoading(true);
    try {
      await apiClient.createWidget(data);
      toast.success('Widget created successfully!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create widget');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

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
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode="create"
          showCard={true}
        />
      </div>
    </AppLayout>
  );
}
