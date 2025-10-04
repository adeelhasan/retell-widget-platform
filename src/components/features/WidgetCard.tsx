'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Copy, Edit, Trash, Phone } from 'lucide-react';
import { Widget, WidgetType } from '@/lib/types';
import { formatDate } from '@/lib/utils-helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WidgetCardProps {
  widget: Widget;
  onDelete?: (id: string) => void;
  onEdit?: (widget: Widget) => void;
  onCopyEmbed?: (widget: Widget) => void;
}

export function WidgetCard({ widget, onDelete, onEdit, onCopyEmbed }: WidgetCardProps) {
  const handleCopyEmbed = () => {
    if (onCopyEmbed) {
      onCopyEmbed(widget);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(widget);
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this widget?')) {
      onDelete(widget.id);
    }
  };

  const getWidgetTypeDisplay = (type: WidgetType) => {
    const typeMap = {
      'inbound_web': { icon: '🎤', label: 'Inbound Web', color: 'bg-blue-100 text-blue-700' },
      'inbound_phone': { icon: '📞', label: 'Inbound Phone', color: 'bg-green-100 text-green-700' },
      'outbound_phone': { icon: '📱', label: 'Outbound Phone', color: 'bg-purple-100 text-purple-700' },
      'outbound_web': { icon: '🔔', label: 'Outbound Web', color: 'bg-orange-100 text-orange-700' },
    };
    return typeMap[type] || typeMap['inbound_web'];
  };

  const widgetTypeInfo = getWidgetTypeDisplay(widget.widget_type || 'inbound_web');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-lg font-medium">{widget.name}</CardTitle>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${widgetTypeInfo.color}`}>
              {widgetTypeInfo.icon} {widgetTypeInfo.label}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopyEmbed}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Embed Code
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Widget
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash className="mr-2 h-4 w-4" />
              Delete Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <p className="flex items-center gap-2">
            <span className="font-medium">Widget ID:</span>
            <span className="font-mono text-xs">{widget.id}</span>
            <button
              onClick={() => navigator.clipboard.writeText(widget.id)}
              className="p-1 hover:bg-gray-100 rounded"
              title="Copy widget ID"
            >
              <Copy className="h-3 w-3" />
            </button>
          </p>
          <p><span className="font-medium">Domain:</span> {widget.allowed_domain}</p>
          <p><span className="font-medium">Agent ID:</span> {widget.agent_id}</p>
          <p><span className="font-medium">Created:</span> {formatDate(widget.created_at)}</p>

          {/* Show inbound phone number for inbound_phone widgets */}
          {widget.widget_type === 'inbound_phone' && widget.inbound_phone_number && (
            <p className="flex items-center gap-2">
              <span className="font-medium">Phone Number:</span>
              <a
                href={`tel:${widget.inbound_phone_number}`}
                className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
              >
                <Phone className="h-3 w-3" />
                {widget.inbound_phone_number}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(widget.inbound_phone_number || '')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy phone number"
              >
                <Copy className="h-3 w-3" />
              </button>
            </p>
          )}

          {/* Show outbound phone number for outbound_phone widgets */}
          {widget.widget_type === 'outbound_phone' && widget.outbound_phone_number && (
            <p className="flex items-center gap-2">
              <span className="font-medium">From Number:</span>
              <span className="text-purple-600 font-mono flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {widget.outbound_phone_number}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(widget.outbound_phone_number || '')}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy phone number"
              >
                <Copy className="h-3 w-3" />
              </button>
            </p>
          )}

          {/* Show agent persona for outbound_web widgets */}
          {widget.widget_type === 'outbound_web' && widget.agent_persona && (
            <p><span className="font-medium">Agent Persona:</span> {widget.agent_persona}</p>
          )}

          {widget.rate_limit_calls_per_hour && (
            <p><span className="font-medium">Rate Limit:</span> {widget.rate_limit_calls_per_hour}/hour</p>
          )}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={handleCopyEmbed}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Embed Code
        </Button>
      </CardContent>
    </Card>
  );
}