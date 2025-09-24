import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Code, Zap, Globe, Settings, HeartHandshake } from 'lucide-react';

const features = [
  {
    icon: Code,
    title: 'One-Line Integration',
    description: 'Add a single script tag to any website and your Retell AI agent is ready to go.',
  },
  {
    icon: Shield,
    title: 'Domain Security',
    description: 'Built-in domain verification ensures your widgets only work on authorized websites.',
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'No complex SDK integration. Works with any website, CMS, or platform immediately.',
  },
  {
    icon: Globe,
    title: 'Universal Compatibility',
    description: 'Works on WordPress, Shopify, custom sites, and any HTML page. No restrictions.',
  },
  {
    icon: Settings,
    title: 'Custom Metadata',
    description: 'Pass dynamic data to your Retell agents - customer info, page context, and more.',
  },
  {
    icon: HeartHandshake,
    title: 'Always Free',
    description: 'No hidden costs, no usage limits, no monthly fees. Built for the Retell community.',
  },
];

export function LandingFeatures() {
  return (
    <section className="py-20 px-4 bg-muted/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Why Choose Our Widget Platform?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Designed specifically for Retell AI users who want to embed voice agents 
            quickly and securely on their websites.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Retell-specific callout */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-card px-6 py-3 rounded-full border">
            <span className="text-2xl">🤖</span>
            <span className="font-medium">
              Requires an existing Retell AI account and configured agents
            </span>
            <a 
              href="https://docs.retellai.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-2"
            >
              Learn more →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}