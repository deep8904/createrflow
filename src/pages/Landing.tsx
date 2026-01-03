import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Youtube, Scissors, Palette, Handshake, Zap, ArrowRight, Check, Play } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const features = [
  { icon: Youtube, title: 'Connect YouTube', desc: 'Sync your channel and import all your videos automatically' },
  { icon: Scissors, title: 'Repurpose Studio', desc: 'Turn one video into a week of content for every platform' },
  { icon: Palette, title: 'Personal Style', desc: 'AI writes in YOUR voice with your tone and vocabulary' },
  { icon: Handshake, title: 'Brand Deal Helper', desc: 'Draft replies, calculate pricing, generate proposals' },
  { icon: Zap, title: 'Automations', desc: 'Set it and forget it. Content ideas flow automatically' },
];

const steps = [
  { num: '1', title: 'Connect YouTube', desc: 'One-click OAuth connection to your channel' },
  { num: '2', title: 'Set Your Style', desc: 'Tell us your tone, words, and vibe' },
  { num: '3', title: 'Generate Content', desc: 'AI creates drafts in your voice' },
  { num: '4', title: 'Publish Everywhere', desc: 'Export to any platform instantly' },
];

export default function Landing() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">CreatorFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/signin">Sign in</Link>
            </Button>
            <Button asChild className="gradient-primary text-primary-foreground">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Turn one video into a week of content.{' '}
            <span className="text-gradient">Automatically.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in stagger-1">
            Connect YouTube, generate drafts, manage deals, run automations.
            All in one creator-ops dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-2">
            <Button size="lg" asChild className="gradient-primary text-primary-foreground shadow-glow">
              <Link to="/signup">
                Get started free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" onClick={() => setDemoOpen(true)}>
              <Play className="mr-2 h-5 w-5" />
              See demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to scale</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                  {step.num}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Simple pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-2">Free</h3>
                <p className="text-3xl font-bold mb-4">$0<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
                <ul className="space-y-3 mb-6">
                  {['5 repurpose packs/month', 'Basic idea scanner', 'Connect 1 channel'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/signup">Start free</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <p className="text-3xl font-bold mb-4">$29<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
                <ul className="space-y-3 mb-6">
                  {['Unlimited repurpose packs', 'Advanced AI features', 'Automations', 'Brand deal helper', 'Priority support'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full gradient-primary text-primary-foreground" asChild>
                  <Link to="/signup">Get Pro</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded gradient-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-medium">CreatorFlow</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Product</a>
              <a href="#" className="hover:text-foreground">Pricing</a>
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>CreatorFlow Demo</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Demo video coming soon</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
