'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check } from 'lucide-react';
import { Widget } from '@/lib/types';
import { generateEmbedCode } from '@/lib/utils-helpers';

interface EmbedCodeModalProps {
  widget: Widget | null;
  open: boolean;
  onClose: () => void;
}

export function EmbedCodeModal({ widget, open, onClose }: EmbedCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [customButtonText, setCustomButtonText] = useState('');

  if (!widget) return null;

  const embedCode = generateEmbedCode(
    widget.id,
    customButtonText || widget.button_text
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleClose = () => {
    setCustomButtonText('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Embed Code for &quot;{widget.name}&quot;</DialogTitle>
          <DialogDescription>
            Copy this code and paste it into your website where you want the voice widget to appear.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Generated Embed Code - MOVED TO TOP */}
          <div className="space-y-2">
            <Label htmlFor="embedCode">Embed Code</Label>
            <div className="relative">
              <Textarea
                id="embedCode"
                value={embedCode}
                readOnly
                rows={6}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCopy}
                size="sm"
                className="absolute top-2 right-2"
                variant="outline"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t pt-6">
            {/* Customization Options - MOVED TO BOTTOM */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Optional: Customize This Embed Code</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  These customizations are <strong>not saved</strong> to your widget. They only affect this specific embed code snippet.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buttonText">Custom Button Text</Label>
                <Input
                  id="buttonText"
                  placeholder={`Leave empty to use widget default: "${widget.button_text || 'Start Voice Demo'}"`}
                  value={customButtonText}
                  onChange={(e) => setCustomButtonText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Override the button text for this specific embed code only
                </p>
              </div>
            </div>
          </div>

          {/* Metadata Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">Pass Dynamic Data to Your Agent</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              To send context from your webpage to the voice agent (customer name, product details, etc.), add a metadata form:
            </p>
            <div className="bg-white dark:bg-gray-900 p-3 rounded border border-blue-200 dark:border-blue-700">
              <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
{`<form class="retell-metadata" data-widget-id="${widget.id}">
  <input type="hidden" name="customer_name" value="">
  <input type="hidden" name="product_id" value="">
  <input type="hidden" name="lead_source" value="Contact Page">
</form>`}
              </pre>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              Your page can populate these values dynamically before the call starts. Use the field names in your agent prompt as {`{{customer_name}}`}, {`{{product_id}}`}, etc.
            </p>
          </div>

          {/* Usage Instructions */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Usage Instructions</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy the embed code above</li>
              <li>Paste it into your website&apos;s HTML where you want the widget</li>
              <li>Optionally add a metadata form to pass context to your agent</li>
              <li>The widget will automatically initialize when the page loads</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}