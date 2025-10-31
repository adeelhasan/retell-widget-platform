import { Button } from '@/components/ui/button';
import Link from 'next/link';
import MockRetellWidget from '@/components/MockRetellWidget';

export function LandingDemo() {
  return (
    <section id="demo" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            See It in Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Here&apos;s what your embedded Retell AI voice widget looks like on a website.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Demo Widget */}
          <div className="order-2 lg:order-1">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-700">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-background px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live Demo Widget
                </div>
                
                <h3 className="text-2xl font-semibold">Try Our Voice AI</h3>
                <p className="text-muted-foreground">
                  Click the button below to experience an interactive demo of our AI voice agent.
                </p>

                {/* Interactive Mock Demo */}
                <div className="pt-4">
                  <MockRetellWidget buttonText="Start Voice Demo" />
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="order-1 lg:order-2 space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-4">How It Works</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Create Your Widget</h4>
                    <p className="text-muted-foreground">Sign up and configure a widget with your Retell AI credentials.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Copy the Embed Code</h4>
                    <p className="text-muted-foreground">Get a simple script tag to paste into your website.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Go Live</h4>
                    <p className="text-muted-foreground">Your voice AI is now available to visitors on your website.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h4 className="font-semibold mb-2">Sample Embed Code:</h4>
              <code className="text-sm bg-background p-3 rounded block overflow-x-auto">
{`<script 
  src="https://your-domain.com/api/widget-simple"
  data-widget-id="your-widget-id">
</script>`}
              </code>
            </div>

            <Button size="lg" asChild className="w-full">
              <Link href="/login">
                Create Your Widget Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}