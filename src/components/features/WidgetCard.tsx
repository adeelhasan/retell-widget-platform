'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Copy, Edit, Trash, ExternalLink } from 'lucide-react';
import { Widget } from '@/lib/types';
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
  onCopyEmbed?: (widget: Widget) => void;
}

export function WidgetCard({ widget, onDelete, onCopyEmbed }: WidgetCardProps) {
  const handleCopyEmbed = () => {
    if (onCopyEmbed) {
      onCopyEmbed(widget);
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this widget?')) {
      onDelete(widget.id);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{widget.name}</CardTitle>
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
            <DropdownMenuItem>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Details
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
          <p><span className="font-medium">Domain:</span> {widget.allowed_domain}</p>
          <p><span className="font-medium">Agent ID:</span> {widget.agent_id}</p>
          <p><span className="font-medium">Created:</span> {formatDate(widget.created_at)}</p>
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