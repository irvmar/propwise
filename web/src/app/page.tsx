'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll('.reveal').forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="landing-page">
      <style jsx global>{`
        .landing-page {
          font-family: 'Outfit', sans-serif;
          color: var(--pw-ink);
          background: var(--pw-cream);
        }

        .landing-page h1, .landing-page h2, .landing-page h3 {
          font-family: 'DM Serif Display', serif;
        }

        .reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }

        .sms-bubble {
          position: relative;
          padding: 14px 18px;
          border-radius: 18px;
          max-width: 280px;
          font-size: 14px;
          line-height: 1.5;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .sms-bubble.inbound {
          background: #e9e9eb;
          color: #1a1a1a;
          border-bottom-left-radius: 4px;
          margin-right: auto;
        }
        .sms-bubble.outbound {
          background: var(--pw-accent);
          color: white;
          border-bottom-right-radius: 4px;
          margin-left: auto;
        }

        .grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .feature-card {
          background: white;
          border: 1px solid var(--pw-border);
          border-radius: 16px;
          padding: 32px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(26, 23, 20, 0.08);
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: var(--pw-ink);
          color: white;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 15px;
          border-radius: 100px;
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        .cta-btn:hover {
          background: var(--pw-accent);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(196, 85, 58, 0.25);
        }
        .cta-btn-outline {
          background: transparent;
          color: var(--pw-ink);
          border: 1.5px solid var(--pw-border);
        }
        .cta-btn-outline:hover {
          background: var(--pw-ink);
          color: white;
          border-color: var(--pw-ink);
        }

        .step-number {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Serif Display', serif;
          font-size: 20px;
          background: var(--pw-warm);
          border: 1.5px solid var(--pw-border);
          color: var(--pw-accent);
          flex-shrink: 0;
        }
      `}</style>

      <div className="grain" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[var(--pw-border)]" style={{ background: 'rgba(250, 248, 245, 0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'var(--pw-accent)', fontFamily: 'DM Serif Display', fontSize: 18 }}>P</div>
            <span style={{ fontFamily: 'DM Serif Display', fontSize: 20 }}>PropWise</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium no-underline" style={{ color: 'var(--pw-slate)' }}>Features</a>
            <a href="#how-it-works" className="text-sm font-medium no-underline" style={{ color: 'var(--pw-slate)' }}>How It Works</a>
            <Link href="/pricing" className="text-sm font-medium no-underline" style={{ color: 'var(--pw-slate)' }}>Pricing</Link>
            <Link href="/auth/login" className="text-sm font-medium no-underline" style={{ color: 'var(--pw-slate)' }}>Sign In</Link>
            <Link href="/auth/signup" className="cta-btn" style={{ padding: '10px 24px', fontSize: 13 }}>
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span className={`block w-5 h-0.5 bg-[var(--pw-ink)] transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-[4px]' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[var(--pw-ink)] transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[var(--pw-ink)] transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-[4px]' : ''}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--pw-border)] px-4 sm:px-6 py-4 flex flex-col gap-4" style={{ background: 'var(--pw-cream)' }}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium no-underline py-2" style={{ color: 'var(--pw-slate)' }}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium no-underline py-2" style={{ color: 'var(--pw-slate)' }}>How It Works</a>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium no-underline py-2" style={{ color: 'var(--pw-slate)' }}>Pricing</Link>
            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium no-underline py-2" style={{ color: 'var(--pw-slate)' }}>Sign In</Link>
            <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="cta-btn" style={{ padding: '10px 24px', fontSize: 13, justifyContent: 'center' }}>
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-24 lg:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <div>
          <div className="reveal inline-block px-4 py-1.5 rounded-full text-[13px] font-medium mb-6" style={{ background: 'var(--pw-sage-soft)', color: 'var(--pw-sage)' }}>
            AI-Powered Property Management
          </div>
          <h1 className="reveal reveal-delay-1 text-3xl sm:text-4xl lg:text-[56px] leading-tight mb-6" style={{ letterSpacing: '-0.02em' }}>
            Your tenants text.<br />
            <span style={{ color: 'var(--pw-accent)' }}>AI handles the rest.</span>
          </h1>
          <p className="reveal reveal-delay-2 text-base lg:text-lg leading-relaxed max-w-[440px] mb-10" style={{ color: 'var(--pw-slate)' }}>
            PropWise AI is an SMS-first agent that manages tenant communication, coordinates maintenance, and sends rent reminders — so you can focus on growing your portfolio.
          </p>
          <div className="reveal reveal-delay-3 flex flex-wrap gap-4">
            <Link href="/auth/signup" className="cta-btn">
              Start Free Trial
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <a href="#how-it-works" className="cta-btn cta-btn-outline">See How It Works</a>
          </div>
        </div>

        {/* SMS Demo */}
        <div className="reveal reveal-delay-2 rounded-3xl p-6 lg:p-8 border border-[var(--pw-border)]" style={{ background: 'white', boxShadow: '0 24px 48px rgba(26,23,20,0.06)' }}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--pw-border)]">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: 'var(--pw-warm)', color: 'var(--pw-accent)' }}>JD</div>
            <div>
              <div className="font-semibold text-sm">Jessica Davis</div>
              <div className="text-xs" style={{ color: 'var(--pw-slate)' }}>Unit 4B &middot; Maple Gardens</div>
            </div>
            <div className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: 'var(--pw-sage-soft)', color: 'var(--pw-sage)' }}>AI Active</div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="sms-bubble inbound">Hi, my kitchen faucet has been leaking since this morning. Water is dripping constantly.</div>
            <div className="sms-bubble outbound">Hi Jessica! I&apos;ve logged a maintenance request for your kitchen faucet leak. A plumber will reach out within 24hrs to schedule a visit. Is the leak contained, or is it getting worse?</div>
            <div className="sms-bubble inbound">It&apos;s steady but not getting worse. I put a bowl under it.</div>
            <div className="sms-bubble outbound">Smart thinking with the bowl! I&apos;ve noted the leak is stable. Mike from Reliable Plumbing has been assigned — he&apos;ll contact you today to schedule. Anything else I can help with?</div>
          </div>
          <div className="mt-4 p-3 rounded-xl text-xs font-medium text-center" style={{ background: 'var(--pw-warm)', color: 'var(--pw-sage)' }}>
            Work order created &middot; Vendor assigned &middot; 0 PM time spent
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="reveal border-t border-b border-[var(--pw-border)] py-8" style={{ background: 'var(--pw-warm)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-center gap-6 sm:gap-8 lg:gap-16 flex-wrap">
          {[
            { value: '< 30s', label: 'Avg. response time' },
            { value: '85%', label: 'Issues resolved by AI' },
            { value: '12hrs', label: 'Saved per week' },
            { value: '4.9/5', label: 'Tenant satisfaction' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-xl sm:text-2xl lg:text-[28px]" style={{ fontFamily: 'DM Serif Display', color: 'var(--pw-accent)' }}>{stat.value}</div>
              <div className="text-[13px] mt-1" style={{ color: 'var(--pw-slate)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="reveal text-center mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-[42px] mb-4">Everything a PM needs,<br />nothing they don&apos;t</h2>
          <p className="text-base max-w-[520px] mx-auto" style={{ color: 'var(--pw-slate)' }}>Purpose-built for residential property managers managing 10 to 500+ units.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {[
            { icon: '\uD83D\uDCAC', title: 'AI SMS Agent', desc: 'Answers tenant questions instantly using your property knowledge base. Handles FAQs, lease questions, and community info \u2014 24/7.' },
            { icon: '\uD83D\uDD27', title: 'Smart Maintenance', desc: 'Tenants text about issues, AI classifies urgency, creates work orders, and assigns vendors automatically.' },
            { icon: '\uD83D\uDCB0', title: 'Rent Reminders', desc: 'Automated reminders before due dates and follow-ups for late payments. Tenants can check balances via text.' },
            { icon: '\uD83D\uDEA8', title: 'Emergency Detection', desc: 'AI detects emergency keywords (flood, fire, gas leak) and immediately notifies you with tenant details.' },
            { icon: '\uD83D\uDCEC', title: 'Unified Inbox', desc: 'See all tenant conversations in one place. Jump in when needed, or let AI handle it. Real-time updates.' },
            { icon: '\uD83E\uDDE0', title: 'Knowledge Base', desc: 'Train the AI with your property policies, payment info, and FAQs. It gets smarter as you add more context.' },
          ].map((feature, i) => (
            <div key={feature.title} className={`reveal reveal-delay-${Math.min(i + 1, 4)} feature-card`}>
              <div className="text-[32px] mb-4">{feature.icon}</div>
              <h3 className="text-xl mb-2">{feature.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--pw-slate)' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-b border-[var(--pw-border)]" style={{ background: 'var(--pw-warm)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="reveal text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-[42px] mb-4">Live in 15 minutes</h2>
            <p className="text-base" style={{ color: 'var(--pw-slate)' }}>No technical setup required. No app for tenants to download.</p>
          </div>
          <div className="flex flex-col gap-12 max-w-[640px] mx-auto">
            {[
              { num: '1', title: 'Add your properties and tenants', desc: 'Import or manually add your units and tenant phone numbers through the dashboard.' },
              { num: '2', title: 'Set up your knowledge base', desc: 'Add your property policies, payment info, maintenance procedures, and FAQs.' },
              { num: '3', title: 'Connect your Twilio number', desc: 'Point your Twilio number to PropWise. We handle everything from there.' },
              { num: '4', title: 'Your AI agent goes live', desc: 'Tenants text your number, AI responds intelligently, and you see everything in your dashboard.' },
            ].map((step, i) => (
              <div key={step.num} className={`reveal reveal-delay-${Math.min(i + 1, 4)} flex gap-6 items-start`}>
                <div className="step-number">{step.num}</div>
                <div>
                  <h3 className="text-xl mb-1.5">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--pw-slate)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="reveal text-center mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-[42px] mb-4">Simple, transparent pricing</h2>
          <p className="text-base" style={{ color: 'var(--pw-slate)' }}>Start small, scale as you grow. No hidden fees.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {[
            { name: 'Growth', price: 99, desc: 'For independent landlords', units: '3 properties · 50 units', messages: '500 msgs/mo', highlight: false },
            { name: 'Professional', price: 199, desc: 'For growing portfolios', units: '10 properties · 150 units', messages: '2,000 msgs/mo', highlight: true },
            { name: 'Enterprise', price: 349, desc: 'For management companies', units: 'Unlimited properties · 500 units', messages: '5,000 msgs/mo', highlight: false },
          ].map((plan, i) => (
            <div key={plan.name} className={`reveal reveal-delay-${i + 1} rounded-[20px] p-6 lg:p-10 relative overflow-hidden`} style={{
              background: plan.highlight ? 'var(--pw-ink)' : 'white',
              color: plan.highlight ? 'white' : 'var(--pw-ink)',
              border: plan.highlight ? 'none' : '1px solid var(--pw-border)',
            }}>
              {plan.highlight && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: 'var(--pw-accent)' }}>
                  Most Popular
                </div>
              )}
              <div className="text-sm font-medium opacity-70 mb-2">{plan.desc}</div>
              <h3 className="text-2xl mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl sm:text-4xl lg:text-[48px]" style={{ fontFamily: 'DM Serif Display' }}>${plan.price}</span>
                <span className="text-sm opacity-60">/month</span>
              </div>
              <div className="text-sm leading-8 opacity-80">
                <div>{plan.units}</div>
                <div>{plan.messages}</div>
                <div>AI SMS Agent</div>
                <div>Dashboard</div>
              </div>
              <Link href="/auth/signup" className="cta-btn mt-6 w-full justify-center" style={{
                background: plan.highlight ? 'white' : 'var(--pw-ink)',
                color: plan.highlight ? 'var(--pw-ink)' : 'white',
              }}>
                Get Started
              </Link>
            </div>
          ))}
        </div>
        <div className="reveal text-center mt-8">
          <Link href="/pricing" className="text-sm font-medium underline" style={{ color: 'var(--pw-accent)' }}>View full pricing comparison</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="reveal mt-10" style={{ background: 'var(--pw-ink)', color: 'white', borderRadius: '32px 32px 0 0' }}>
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[42px] mb-4">Stop managing texts.<br />Start managing properties.</h2>
          <p className="text-base opacity-70 max-w-[480px] mx-auto mb-10">Join property managers who&apos;ve reclaimed 12+ hours per week with PropWise AI.</p>
          <Link href="/auth/signup" className="cta-btn text-base" style={{ background: 'var(--pw-accent)', padding: '16px 40px' }}>
            Start Your Free Trial
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <p className="text-[13px] opacity-50 mt-4">14-day free trial &middot; No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10" style={{ background: 'var(--pw-ink)', color: 'white' }}>
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
