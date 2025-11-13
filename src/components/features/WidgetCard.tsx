'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Edit, Trash, Phone, Lock } from 'lucide-react';
import { Widget, WidgetType } from '@/lib/types';
import { formatDate } from '@/lib/utils-helpers';

interface WidgetCardProps {
  widget: Widget;
  onDelete?: (id: string) => void;
  onEdit?: (widget: Widget) => void;
  onCopyEmbed?: (widget: Widget) => void;
}

// Delimiter for parsing multiple domains (matches backend)
const DOMAIN_DELIMITER = '|||';

// Parse domains from delimited string
const parseDomains = (domainsStr: string): string[] => {
  if (!domainsStr) return [];
  return domainsStr.split(DOMAIN_DELIMITER).map(d => d.trim()).filter(d => d);
};

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
            {widget.require_access_code && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700" title="Access code required">
                <Lock className="h-3 w-3" /> Protected
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            title="Edit widget"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
            title="Delete widget"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
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
          <div>
            <span className="font-medium block mb-1">
              {parseDomains(widget.allowed_domain).length > 1 ? 'Domains:' : 'Domain:'}
            </span>
            <div className="flex flex-wrap gap-1">
              {parseDomains(widget.allowed_domain).map((domain, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  {domain}
                </span>
              ))}
            </div>
          </div>
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