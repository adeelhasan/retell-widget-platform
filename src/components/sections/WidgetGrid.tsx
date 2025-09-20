import { WidgetCard } from '@/components/features/WidgetCard';
import { Widget } from '@/lib/types';

interface WidgetGridProps {
  widgets: Widget[];
  onDelete?: (id: string) => void;
  onEdit?: (widget: Widget) => void;
  onCopyEmbed?: (widget: Widget) => void;
}

export function WidgetGrid({ widgets, onDelete, onEdit, onCopyEmbed }: WidgetGridProps) {
  return (
    <section>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {widgets.map((widget) => (
          <WidgetCard 
            key={widget.id} 
            widget={widget} 
            onDelete={onDelete}
            onEdit={onEdit}
            onCopyEmbed={onCopyEmbed}
          />
        ))}
      </div>
    </section>
  );
}