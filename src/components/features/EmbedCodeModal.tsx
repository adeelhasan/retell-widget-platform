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
  const [customMetadata, setCustomMetadata] = useState('');

  if (!widget) return null;

  const metadata = customMetadata ? (() => {
    try {
      return JSON.parse(customMetadata);
    } catch {
      return null;
    }
  })() : null;

  const embedCode = generateEmbedCode(
    widget.id,
    customButtonText || widget.button_text,
    metadata
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
    setCustomMetadata('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Embed Code for "{widget.name}"</DialogTitle>
          <DialogDescription>
            Copy this code and paste it into your website where you want the voice widget to appear.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customization Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Customization (Optional)</h4>
            
            <div className="space-y-2">
              <Label htmlFor="buttonText">Custom Button Text</Label>
              <Input
                id="buttonText"
                placeholder={widget.button_text}
                value={customButtonText}
                onChange={(e) => setCustomButtonText(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metadata">Custom Metadata (JSON)</Label>
              <Textarea
                id="metadata"
                placeholder='{"property_id": "123", "user_type": "premium"}'
                value={customMetadata}
                onChange={(e) => setCustomMetadata(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional JSON data to pass to your voice agent
              </p>
            </div>
          </div>

          {/* Generated Embed Code */}
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

          {/* Usage Instructions */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Usage Instructions</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy the embed code above</li>
              <li>Paste it into your website's HTML where you want the widget</li>
              <li>The widget will automatically initialize when the page loads</li>
              <li>Visitors can click the button to start a voice conversation</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}