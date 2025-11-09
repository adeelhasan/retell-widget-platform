'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import { AppLayout } from '@/components/layouts/AppLayout';
import { PageHeader } from '@/components/sections/PageHeader';
import { WidgetGrid } from '@/components/sections/WidgetGrid';
import { EmptyState } from '@/components/sections/EmptyState';
import { EmbedCodeModal } from '@/components/features/EmbedCodeModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Widget } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      await loadWidgets();
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const loadWidgets = async () => {
    try {
      const widgets = await apiClient.getWidgets();
      setWidgets(widgets);
    } catch (error) {
      console.error('Failed to load widgets:', error);
    }
  };

  const handleDeleteWidget = async (id: string) => {
    try {
      await apiClient.deleteWidget(id);
      setWidgets(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Failed to delete widget:', error);
      alert('Failed to delete widget. Please try again.');
    }
  };

  const handleCopyEmbed = (widget: Widget) => {
    setSelectedWidget(widget);
    setShowEmbedModal(true);
  };

  const handleCloseEmbedModal = () => {
    setShowEmbedModal(false);
    setSelectedWidget(null);
  };

  const handleEditWidget = (widget: Widget) => {
    router.push(`/dashboard/widgets/${widget.id}/edit`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const headerAction = (
    <Button onClick={() => router.push('/dashboard/widgets/new')}>
      <Plus className="mr-2 h-4 w-4" />
      Create Widget
    </Button>
  );

  return (
    <AppLayout>
      <PageHeader 
        title="Your Widgets"
        description="Manage and deploy your Retell AI voice agents"
        action={headerAction}
      />
      
      {widgets.length > 0 ? (
        <WidgetGrid 
          widgets={widgets} 
          onDelete={handleDeleteWidget}
          onEdit={handleEditWidget}
          onCopyEmbed={handleCopyEmbed}
        />
      ) : (
        <EmptyState
          title="No widgets yet"
          description="Create your first widget to get started with voice AI demos"
          action={
            <Button onClick={() => router.push('/dashboard/widgets/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Widget
            </Button>
          }
        />
      )}

      <EmbedCodeModal
        widget={selectedWidget}
        open={showEmbedModal}
        onClose={handleCloseEmbedModal}
      />
    </AppLayout>
  );
}