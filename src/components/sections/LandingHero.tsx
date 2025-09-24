import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function LandingHero() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
            <span className="mr-2">🎤</span>
            Built specifically for Retell AI users
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Free Widget Platform for{' '}
              <span className="text-primary">Retell AI</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Embed your Retell AI voice agents on any website with one line of code. 
              Completely free, secure, and easy to set up.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="px-8 py-6 text-lg">
              <Link href="/login">
                Get Started Free
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="px-8 py-6 text-lg">
              <Link href="#demo">
                See Live Demo
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="pt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Trusted by Retell AI developers worldwide
            </p>
            <div className="flex justify-center items-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>No Setup Required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Secure by Default</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}