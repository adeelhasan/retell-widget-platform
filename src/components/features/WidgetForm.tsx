/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck - Multiple react-hook-form type declarations causing conflicts
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Widget, CreateWidgetRequest, WidgetType } from '@/lib/types';

interface WidgetFormProps {
  widget?: Widget;
  onSubmit: (data: CreateWidgetRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

// Zod validation schema with automatic trimming on all string fields
const widgetFormSchema = z.object({
  widget_type: z.enum(['inbound_web', 'inbound_phone', 'outbound_phone', 'outbound_web']),
  name: z.string()
    .trim()
    .min(1, "Widget name is required")
    .max(100, "Widget name must be 100 characters or less"),
  retell_api_key: z.string()
    .trim()
    .min(1, "Retell API key is required")
    .startsWith('key_', "API key must start with 'key_'"),
  agent_id: z.string()
    .trim()
    .min(1, "Agent ID is required")
    .startsWith('agent_', "Agent ID must start with 'agent_'"),
  allowed_domain: z.string()
    .trim()
    .min(1, "Allowed domain is required"),
  button_text: z.string()
    .trim()
    .max(50, "Button text must be 50 characters or less")
    .optional(),
  rate_limit_calls_per_hour: z.union([
    z.number().int().min(1, "Must be at least 1").max(1000, "Must be 1000 or less"),
    z.undefined()
  ]),
  daily_minutes_limit: z.union([
    z.number().int().min(1, "Must be at least 1").max(10000, "Must be 10000 or less"),
    z.undefined()
  ]),
  daily_minutes_enabled: z.boolean().default(false),
  require_access_code: z.boolean().default(false),
  access_code: z.string()
    .trim()
    .min(4, "Access code must be at least 4 characters")
    .max(50, "Access code must be 50 characters or less")
    .optional()
    .or(z.literal('')),
  display_text: z.string().trim().optional(),
  agent_persona: z.string().trim().max(100, "Agent persona must be 100 characters or less").optional(),
  opening_message: z.string().trim().max(500, "Opening message must be 500 characters or less").optional(),
  outbound_phone_number: z.string()
    .trim()
    .regex(/^\+[1-9]\d{10,14}$/, "Must be in E.164 format (e.g., +12025551234)")
    .optional(),
}).refine((data) => {
  // Outbound phone widgets require outbound_phone_number
  if (data.widget_type === 'outbound_phone' && !data.outbound_phone_number) {
    return false;
  }
  return true;
}, {
  message: "Outbound phone number is required for outbound phone widgets",
  path: ["outbound_phone_number"],
}).refine((data) => {
  // If require_access_code is true, access_code must be provided
  if (data.require_access_code && (!data.access_code || data.access_code === '')) {
    return false;
  }
  return true;
}, {
  message: "Access code is required when protection is enabled",
  path: ["access_code"],
});

type WidgetFormData = z.infer<typeof widgetFormSchema>;

export function WidgetForm({ widget, onSubmit, onCancel, loading, mode = 'create' }: WidgetFormProps) {
  const isEditMode = mode === 'edit' || !!widget;

  const form = useForm<WidgetFormData>({
    resolver: zodResolver(widgetFormSchema) as any,
    defaultValues: {
      widget_type: widget?.widget_type || 'inbound_web',
      name: widget?.name || '',
      retell_api_key: widget?.retell_api_key || '',
      agent_id: widget?.agent_id || '',
      allowed_domain: widget?.allowed_domain || '',
      button_text: widget?.button_text || '',
      rate_limit_calls_per_hour: widget?.rate_limit_calls_per_hour ?? undefined,
      daily_minutes_limit: widget?.daily_minutes_limit ?? undefined,
      daily_minutes_enabled: widget?.daily_minutes_enabled || false,
      require_access_code: widget?.require_access_code || false,
      access_code: widget?.access_code || '',
      display_text: widget?.display_text || '',
      agent_persona: widget?.agent_persona || '',
      opening_message: widget?.opening_message || '',
      outbound_phone_number: widget?.outbound_phone_number || '',
    },
  });

  const widgetType = form.watch('widget_type');

  // Update widget type (button text will use render-time defaults)
  const handleWidgetTypeChange = (value: WidgetType) => {
    form.setValue('widget_type', value);
    // Don't auto-fill button_text - let it stay empty to use render-time defaults
  };

  const handleFormSubmit = (data: WidgetFormData) => {
    // Data is already trimmed and validated by Zod
    onSubmit(data as CreateWidgetRequest);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Widget' : 'Create New Widget'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Widget Type Selection */}
            <FormField
              control={form.control}
              name="widget_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => handleWidgetTypeChange(value as WidgetType)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select widget type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inbound_web">
                        <div className="flex items-center gap-2">
                          🎤 Inbound WebCall
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Current</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="inbound_phone">
                        <div className="flex items-center gap-2">
                          📞 Inbound PhoneCall
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">New</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="outbound_phone">
                        <div className="flex items-center gap-2">
                          📱 Outbound PhoneCall
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">New</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="outbound_web">
                        <div className="flex items-center gap-2">
                          🔔 Outbound WebCall
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">New</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getWidgetTypeDescription(widgetType)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Widget Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Voice Demo Widget" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Retell API Key */}
            <FormField
              control={form.control}
              name="retell_api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retell API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="key_..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Agent ID */}
            <FormField
              control={form.control}
              name="agent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent ID</FormLabel>
                  <FormControl>
                    <Input placeholder="agent_..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Allowed Domain */}
            <FormField
              control={form.control}
              name="allowed_domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allowed Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="domain.com or *.domain.com" {...field} />
                  </FormControl>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Supported formats:</p>
                    <ul className="ml-4 space-y-0.5">
                      <li>• <code className="bg-muted px-1 rounded">x.ai</code> - exact domain</li>
                      <li>• <code className="bg-muted px-1 rounded">*.x.ai</code> - any subdomain of x.ai</li>
                      <li>• <code className="bg-muted px-1 rounded">*.domain.*</code> - domain with any TLD</li>
                      <li>• <code className="bg-muted px-1 rounded">localhost</code> - for development</li>
                    </ul>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type-specific fields */}
            {widgetType === 'outbound_phone' && (
              <FormField
                control={form.control}
                name="outbound_phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outbound Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+12025551234" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your Retell phone number in E.164 format (e.g., +12025551234). This is the number that will call your users.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {widgetType === 'outbound_web' && (
              <>
                <FormField<WidgetFormData>
                  control={form.control}
                  name="agent_persona"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Persona</FormLabel>
                      <FormControl>
                        <Input placeholder="Sarah from Acme Corp" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Who is calling? This will be displayed to the user.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<WidgetFormData>
                  control={form.control}
                  name="opening_message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Hi! This is Sarah calling about your recent inquiry..."
                          rows={3}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        The message your agent will start with when the call begins.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Button Text */}
            <FormField
              control={form.control}
              name="button_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Button Text</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={getButtonTextPlaceholder(widgetType)}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {getButtonTextDescription(widgetType)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rate Limiting - only for web calls */}
            {(widgetType === 'inbound_web' || widgetType === 'outbound_web') && (
              <FormField<WidgetFormData>
                control={form.control}
                name="rate_limit_calls_per_hour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Limit (calls per hour)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        min="1"
                        max="1000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty to use global default (10 calls/hour)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Daily Minutes Limit */}
            <div className="space-y-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="daily_minutes_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Daily Minutes Limit</FormLabel>
                      <FormDescription>
                        Limit total call minutes per day to control costs
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('daily_minutes_enabled') && (
                <>
                  <FormField<WidgetFormData>
                    control={form.control}
                    name="daily_minutes_limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Minutes Per Day</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="60"
                            min="1"
                            max="10000"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Total call minutes allowed per day (resets at midnight UTC). Set based on your Retell pricing plan.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="font-medium mb-1">ℹ️ How it works:</p>
                    <ul className="ml-4 space-y-1 text-xs">
                      <li>• Limits are enforced when calls start</li>
                      <li>• Call durations are synced once daily at midnight UTC</li>
                      <li>• Prevents budget overruns from long calls</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Access Code Protection */}
            <div className="space-y-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="require_access_code"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Require Access Code</FormLabel>
                      <FormDescription>
                        Users must enter a code before using this widget
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('require_access_code') && (
                <FormField
                  control={form.control}
                  name="access_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Code</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g., DEMO2024"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        4-50 characters. Share this code with users who should access the widget.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEditMode ? 'Update Widget' : 'Create Widget'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getDefaultButtonText(widgetType: WidgetType): string {
  switch (widgetType) {
    case 'inbound_web':
      return 'Start Voice Demo';
    case 'inbound_phone':
      return 'Call Us Now';
    case 'outbound_phone':
      return 'Call Me Now';
    case 'outbound_web':
      return 'Answer Call';
    default:
      return 'Start Voice Demo';
  }
}

function getWidgetTypeDescription(widgetType: WidgetType): string {
  switch (widgetType) {
    case 'inbound_web':
      return 'User clicks button to start voice call in browser';
    case 'inbound_phone':
      return 'User clicks to call a phone number';
    case 'outbound_phone':
      return 'User enters phone number to receive a call';
    case 'outbound_web':
      return 'Simulated incoming call experience in browser';
    default:
      return '';
  }
}

function getButtonTextPlaceholder(widgetType: WidgetType): string {
  switch (widgetType) {
    case 'inbound_web':
      return 'Start Voice Demo';
    case 'inbound_phone':
      return 'Call Us Now';
    case 'outbound_phone':
      return 'Call Me Now';
    case 'outbound_web':
      return 'Answer Call';
    default:
      return 'Start Voice Demo';
  }
}

function getButtonTextDescription(widgetType: WidgetType): string {
  switch (widgetType) {
    case 'inbound_web':
      return 'Text shown on the button users click to start the call. Leave empty to use default based on widget type.';
    case 'inbound_phone':
      return 'Button label. The phone number will be auto-detected from your agent and displayed on the button. Leave empty to use default.';
    case 'outbound_phone':
      return 'Text shown on the button to request a callback. Leave empty to use default based on widget type.';
    case 'outbound_web':
      return 'Text shown on the button to simulate answering an incoming call. Leave empty to use default based on widget type.';
    default:
      return 'Leave empty to use default based on widget type.';
  }
}
