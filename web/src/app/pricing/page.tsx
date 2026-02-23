'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    desc: 'For landlords just getting started',
    cta: 'Get Started Free',
    features: [
      { text: 'Up to 1 property', included: true },
      { text: 'Up to 5 units', included: true },
      { text: '50 messages/month', included: true },
      { text: 'AI SMS Agent', included: true },
      { text: 'Work Order Management', included: true },
      { text: 'Basic Dashboard', included: true },
      { text: 'Email Support', included: true },
      { text: 'Knowledge Base', included: false },
      { text: 'Vendor Management', included: false },
      { text: 'Rent Reminders', included: false },
      { text: 'Custom AI Training', included: false },
      { text: 'API Access', included: false },
    ],
    highlight: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 99,
    desc: 'For independent landlords scaling up',
    cta: 'Get Started',
    features: [
      { text: 'Up to 3 properties', included: true },
      { text: 'Up to 50 units', included: true },
      { text: '500 messages/month', included: true },
      { text: 'AI SMS Agent', included: true },
      { text: 'Work Order Management', included: true },
      { text: 'Full Dashboard', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Knowledge Base', included: true },
      { text: 'Vendor Management', included: true },
      { text: 'Rent Reminders', included: true },
      { text: 'Custom AI Training', included: false },
      { text: 'API Access', included: false },
    ],
    highlight: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 199,
    desc: 'For growing portfolios that need full automation',
    cta: 'Get Started',
    features: [
      { text: 'Up to 10 properties', included: true },
      { text: 'Up to 150 units', included: true },
      { text: '2,000 messages/month', included: true },
      { text: 'AI SMS Agent', included: true },
      { text: 'Work Order Management', included: true },
      { text: 'Full Dashboard', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Knowledge Base', included: true },
      { text: 'Vendor Management', included: true },
      { text: 'Rent Reminders', included: true },
      { text: 'Custom AI Training', included: true },
      { text: 'API Access', included: false },
    ],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 349,
    desc: 'For management companies at scale',
    cta: 'Get Started',
    features: [
      { text: 'Unlimited properties', included: true },
      { text: 'Up to 500 units', included: true },
      { text: '5,000 messages/month', included: true },
      { text: 'AI SMS Agent', included: true },
      { text: 'Work Order Management', included: true },
      { text: 'Full Dashboard', included: true },
      { text: 'Dedicated Account Manager', included: true },
      { text: 'Knowledge Base', included: true },
      { text: 'Vendor Management', included: true },
      { text: 'Rent Reminders', included: true },
      { text: 'Custom AI Training', included: true },
      { text: 'API Access + Custom Integrations', included: true },
    ],
    highlight: false,
  },
];

export default function PricingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePlanClick = async (planId: string) => {
    // If not logged in, redirect to signup
    if (!user) {
      router.push('/auth/signup');
      return;
    }

    // Starter is free - redirect to dashboard
    if (planId === 'starter') {
      router.push('/dashboard');
      return;
    }

    // Logged in - create checkout session
    setLoadingPlan(planId);
    try {
      const createCheckoutSessionFn = httpsCallable<
        { planId: string; origin: string },
        { url: string }
      >(functions, 'createCheckoutSession');
      const result = await createCheckoutSessionFn({
        planId,
        origin: window.location.origin,
      });
      if (result.data.url) {
        window.location.href = result.data.url;
      }
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="landing-page">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap');
        .landing-page {
          --pw-ink: #1a1714;
          --pw-warm: #f7f3ee;
          --pw-cream: #faf8f5;
          --pw-accent: #c4553a;
          --pw-sage: #7a8b6f;
          --pw-sage-soft: #c8d4be;
          --pw-slate: #6b7280;
          --pw-border: #e5e0d8;
          font-family: 'Outfit', sans-serif;
          color: var(--pw-ink);
          background: var(--pw-cream);
          min-height: 100vh;
        }
        .landing-page h1, .landing-page h2, .landing-page h3 { font-family: 'DM Serif Display', serif; }
        .cta-btn {
          display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px;
          background: var(--pw-ink); color: white; font-family: 'Outfit', sans-serif;
          font-weight: 600; font-size: 15px; border-radius: 100px; text-decoration: none;
          transition: all 0.3s ease; border: none; cursor: pointer;
        }
        .cta-btn:hover { background: var(--pw-accent); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(196,85,58,0.25); }
        .cta-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
        .cta-btn:disabled:hover { background: var(--pw-ink); }
      `}</style>

      {/* Nav */}
      <nav className="border-b border-[var(--pw-border)]" style={{ background: 'rgba(250,248,245,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline" style={{ color: 'var(--pw-ink)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'var(--pw-accent)', fontFamily: 'DM Serif Display', fontSize: 18 }}>P</div>
            <span style={{ fontFamily: 'DM Serif Display', fontSize: 20 }}>PropWise</span>
          </Link>
          {user ? (
            <Link href="/dashboard" className="cta-btn" style={{ padding: '10px 24px', fontSize: 13 }}>Dashboard</Link>
          ) : (
            <Link href="/auth/signup" className="cta-btn" style={{ padding: '10px 24px', fontSize: 13 }}>Get Started</Link>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4 lg:pt-20 lg:pb-5 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-[48px] mb-4" style={{ letterSpacing: '-0.02em' }}>
          Pricing that scales<br />with your portfolio
        </h1>
        <p className="text-base lg:text-lg max-w-[480px] mx-auto" style={{ color: 'var(--pw-slate)' }}>
          Start free with our Starter plan. No credit card required. Upgrade or cancel anytime.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16 lg:pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {plans.map((plan) => (
          <div key={plan.name} className="rounded-[20px] p-5 sm:p-6 lg:p-9 relative" style={{
            background: plan.highlight ? 'var(--pw-ink)' : 'white',
            color: plan.highlight ? 'white' : 'var(--pw-ink)',
            border: plan.highlight ? '2px solid var(--pw-accent)' : '1px solid var(--pw-border)',
          }}>
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: 'var(--pw-accent)' }}>
                Most Popular
              </div>
            )}
            <div className="mb-6">
              <div className="text-[13px] font-medium opacity-60 mb-1">{plan.desc}</div>
              <h3 className="text-2xl mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                {plan.price === 0 ? (
                  <span className="text-3xl sm:text-4xl lg:text-[48px]" style={{ fontFamily: 'DM Serif Display' }}>Free</span>
                ) : (
                  <>
                    <span className="text-3xl sm:text-4xl lg:text-[48px]" style={{ fontFamily: 'DM Serif Display' }}>${plan.price}</span>
                    <span className="text-sm opacity-60">/month</span>
                  </>
                )}
              </div>
            </div>

            <div className="pt-6 mb-6" style={{ borderTop: `1px solid ${plan.highlight ? 'rgba(255,255,255,0.15)' : 'var(--pw-border)'}` }}>
              {plan.features.map((f) => (
                <div key={f.text} className="flex items-center gap-2.5 py-[7px] text-[13px]">
                  {f.included ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3 3 7-7" stroke={plan.highlight ? '#c8d4be' : 'var(--pw-sage)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 8h8" stroke={plan.highlight ? 'rgba(255,255,255,0.3)' : '#d1d5db'} strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                  <span style={{ opacity: f.included ? 1 : 0.4 }}>{f.text}</span>
                </div>
              ))}
            </div>

            <button
              className="cta-btn w-full justify-center"
              disabled={loadingPlan !== null || authLoading}
              onClick={() => handlePlanClick(plan.id)}
              style={{
                background: plan.highlight ? 'white' : 'var(--pw-ink)',
                color: plan.highlight ? 'var(--pw-ink)' : 'white',
              }}
            >
              {loadingPlan === plan.id ? 'Loading...' : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <section className="border-t border-[var(--pw-border)] px-4 sm:px-6 lg:px-8 py-16 lg:py-20" style={{ background: 'var(--pw-warm)' }}>
        <div className="max-w-[640px] mx-auto">
          <h2 className="text-2xl sm:text-3xl text-center mb-12">Common questions</h2>
          {[
            { q: 'Do tenants need to download an app?', a: 'No. PropWise works entirely through standard SMS. Tenants just text your property number like they would any other phone number.' },
            { q: 'What happens when the AI can\'t handle something?', a: 'The AI will flag the conversation for human review and notify you. You can jump in and respond manually from the dashboard at any time.' },
            { q: 'Can I try it before committing?', a: 'Yes! Start with our free Starter plan to try everything out. Upgrade anytime as your portfolio grows.' },
            { q: 'Do I need a Twilio account?', a: 'Yes, you\'ll need a Twilio account with a phone number. We provide step-by-step setup instructions that take about 5 minutes.' },
            { q: 'What if I go over my message limit?', a: 'We\'ll notify you when you\'re approaching your limit. You can upgrade your plan at any time, and overage messages are billed at $0.05 each.' },
          ].map((faq) => (
            <div key={faq.q} className="border-b border-[var(--pw-border)] py-6">
              <h3 className="text-[17px] mb-2">{faq.q}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--pw-slate)' }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--pw-ink)', color: 'white' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-white" style={{ background: 'var(--pw-accent)', fontFamily: 'DM Serif Display', fontSize: 14 }}>P</div>
            <span style={{ fontFamily: 'DM Serif Display', fontSize: 16 }}>PropWise AI</span>
          </div>
          <div className="text-[13px] opacity-50">&copy; 2026 PropWise AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
