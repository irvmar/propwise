'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);

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
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(250, 248, 245, 0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--pw-border)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, background: 'var(--pw-accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'DM Serif Display', fontSize: 18 }}>P</div>
            <span style={{ fontFamily: 'DM Serif Display', fontSize: 20 }}>PropWise</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#features" style={{ fontSize: 14, fontWeight: 500, color: 'var(--pw-slate)', textDecoration: 'none' }}>Features</a>
            <a href="#how-it-works" style={{ fontSize: 14, fontWeight: 500, color: 'var(--pw-slate)', textDecoration: 'none' }}>How It Works</a>
            <Link href="/pricing" style={{ fontSize: 14, fontWeight: 500, color: 'var(--pw-slate)', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/auth/login" style={{ fontSize: 14, fontWeight: 500, color: 'var(--pw-slate)', textDecoration: 'none' }}>Sign In</Link>
            <Link href="/auth/signup" className="cta-btn" style={{ padding: '10px 24px', fontSize: 13 }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 32px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <div className="reveal" style={{ display: 'inline-block', padding: '6px 16px', background: 'var(--pw-sage-soft)', borderRadius: 100, fontSize: 13, fontWeight: 500, color: 'var(--pw-sage)', marginBottom: 24 }}>
            AI-Powered Property Management
          </div>
          <h1 className="reveal reveal-delay-1" style={{ fontSize: 56, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 24 }}>
            Your tenants text.<br />
            <span style={{ color: 'var(--pw-accent)' }}>AI handles the rest.</span>
          </h1>
          <p className="reveal reveal-delay-2" style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--pw-slate)', maxWidth: 440, marginBottom: 40 }}>
            PropWise AI is an SMS-first agent that manages tenant communication, coordinates maintenance, and sends rent reminders — so you can focus on growing your portfolio.
          </p>
          <div className="reveal reveal-delay-3" style={{ display: 'flex', gap: 16 }}>
            <Link href="/auth/signup" className="cta-btn">
              Start Free Trial
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <a href="#how-it-works" className="cta-btn cta-btn-outline">See How It Works</a>
          </div>
        </div>

        {/* SMS Demo */}
        <div className="reveal reveal-delay-2" style={{ background: 'white', borderRadius: 24, padding: 32, border: '1px solid var(--pw-border)', boxShadow: '0 24px 48px rgba(26,23,20,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--pw-border)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--pw-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: 'var(--pw-accent)' }}>JD</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Jessica Davis</div>
              <div style={{ fontSize: 12, color: 'var(--pw-slate)' }}>Unit 4B &middot; Maple Gardens</div>
            </div>
            <div style={{ marginLeft: 'auto', padding: '4px 10px', background: 'var(--pw-sage-soft)', borderRadius: 100, fontSize: 11, fontWeight: 600, color: 'var(--pw-sage)' }}>AI Active</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="sms-bubble inbound">Hi, my kitchen faucet has been leaking since this morning. Water is dripping constantly.</div>
            <div className="sms-bubble outbound">Hi Jessica! I&apos;ve logged a maintenance request for your kitchen faucet leak. A plumber will reach out within 24hrs to schedule a visit. Is the leak contained, or is it getting worse?</div>
            <div className="sms-bubble inbound">It&apos;s steady but not getting worse. I put a bowl under it.</div>
            <div className="sms-bubble outbound">Smart thinking with the bowl! I&apos;ve noted the leak is stable. Mike from Reliable Plumbing has been assigned — he&apos;ll contact you today to schedule. Anything else I can help with?</div>
          </div>
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--pw-warm)', borderRadius: 12, fontSize: 12, color: 'var(--pw-sage)', fontWeight: 500, textAlign: 'center' }}>
            Work order created &middot; Vendor assigned &middot; 0 PM time spent
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="reveal" style={{ borderTop: '1px solid var(--pw-border)', borderBottom: '1px solid var(--pw-border)', padding: '32px 0', background: 'var(--pw-warm)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap' }}>
          {[
            { value: '< 30s', label: 'Avg. response time' },
            { value: '85%', label: 'Issues resolved by AI' },
            { value: '12hrs', label: 'Saved per week' },
            { value: '4.9/5', label: 'Tenant satisfaction' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'DM Serif Display', fontSize: 28, color: 'var(--pw-accent)' }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: 'var(--pw-slate)', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 32px' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 42, marginBottom: 16 }}>Everything a PM needs,<br />nothing they don&apos;t</h2>
          <p style={{ fontSize: 16, color: 'var(--pw-slate)', maxWidth: 520, margin: '0 auto' }}>Purpose-built for residential property managers managing 10 to 500+ units.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { icon: '\uD83D\uDCAC', title: 'AI SMS Agent', desc: 'Answers tenant questions instantly using your property knowledge base. Handles FAQs, lease questions, and community info \u2014 24/7.' },
            { icon: '\uD83D\uDD27', title: 'Smart Maintenance', desc: 'Tenants text about issues, AI classifies urgency, creates work orders, and assigns vendors automatically.' },
            { icon: '\uD83D\uDCB0', title: 'Rent Reminders', desc: 'Automated reminders before due dates and follow-ups for late payments. Tenants can check balances via text.' },
            { icon: '\uD83D\uDEA8', title: 'Emergency Detection', desc: 'AI detects emergency keywords (flood, fire, gas leak) and immediately notifies you with tenant details.' },
            { icon: '\uD83D\uDCEC', title: 'Unified Inbox', desc: 'See all tenant conversations in one place. Jump in when needed, or let AI handle it. Real-time updates.' },
            { icon: '\uD83E\uDDE0', title: 'Knowledge Base', desc: 'Train the AI with your property policies, payment info, and FAQs. It gets smarter as you add more context.' },
          ].map((feature, i) => (
            <div key={feature.title} className={`reveal reveal-delay-${Math.min(i + 1, 4)} feature-card`}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{feature.icon}</div>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>{feature.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--pw-slate)' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ background: 'var(--pw-warm)', borderTop: '1px solid var(--pw-border)', borderBottom: '1px solid var(--pw-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 32px' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 42, marginBottom: 16 }}>Live in 15 minutes</h2>
            <p style={{ fontSize: 16, color: 'var(--pw-slate)' }}>No technical setup required. No app for tenants to download.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48, maxWidth: 640, margin: '0 auto' }}>
            {[
              { num: '1', title: 'Add your properties and tenants', desc: 'Import or manually add your units and tenant phone numbers through the dashboard.' },
              { num: '2', title: 'Set up your knowledge base', desc: 'Add your property policies, payment info, maintenance procedures, and FAQs.' },
              { num: '3', title: 'Connect your Twilio number', desc: 'Point your Twilio number to PropWise. We handle everything from there.' },
              { num: '4', title: 'Your AI agent goes live', desc: 'Tenants text your number, AI responds intelligently, and you see everything in your dashboard.' },
            ].map((step, i) => (
              <div key={step.num} className={`reveal reveal-delay-${Math.min(i + 1, 4)}`} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div className="step-number">{step.num}</div>
                <div>
                  <h3 style={{ fontSize: 20, marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--pw-slate)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 32px' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 42, marginBottom: 16 }}>Simple, transparent pricing</h2>
          <p style={{ fontSize: 16, color: 'var(--pw-slate)' }}>Start small, scale as you grow. No hidden fees.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { name: 'Starter', price: 99, desc: 'For independent landlords', units: '25 units', messages: '500 msgs/mo', highlight: false },
            { name: 'Professional', price: 199, desc: 'For growing portfolios', units: '100 units', messages: '2,000 msgs/mo', highlight: true },
            { name: 'Enterprise', price: 349, desc: 'For management companies', units: 'Unlimited', messages: 'Unlimited', highlight: false },
          ].map((plan, i) => (
            <div key={plan.name} className={`reveal reveal-delay-${i + 1}`} style={{
              background: plan.highlight ? 'var(--pw-ink)' : 'white',
              color: plan.highlight ? 'white' : 'var(--pw-ink)',
              borderRadius: 20,
              padding: 40,
              border: plan.highlight ? 'none' : '1px solid var(--pw-border)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: 16, right: 16, padding: '4px 12px', background: 'var(--pw-accent)', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
                  Most Popular
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.7, marginBottom: 8 }}>{plan.desc}</div>
              <h3 style={{ fontSize: 24, marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                <span style={{ fontFamily: 'DM Serif Display', fontSize: 48 }}>${plan.price}</span>
                <span style={{ fontSize: 14, opacity: 0.6 }}>/month</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 2, opacity: 0.8 }}>
                <div>Up to {plan.units}</div>
                <div>{plan.messages}</div>
                <div>AI SMS Agent</div>
                <div>Dashboard</div>
              </div>
              <Link href="/auth/signup" className="cta-btn" style={{
                marginTop: 24,
                width: '100%',
                justifyContent: 'center',
                background: plan.highlight ? 'white' : 'var(--pw-ink)',
                color: plan.highlight ? 'var(--pw-ink)' : 'white',
              }}>
                Get Started
              </Link>
            </div>
          ))}
        </div>
        <div className="reveal" style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/pricing" style={{ fontSize: 14, color: 'var(--pw-accent)', fontWeight: 500, textDecoration: 'underline' }}>View full pricing comparison</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="reveal" style={{ background: 'var(--pw-ink)', color: 'white', borderRadius: '32px 32px 0 0', marginTop: 40 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '100px 32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 42, marginBottom: 16 }}>Stop managing texts.<br />Start managing properties.</h2>
          <p style={{ fontSize: 16, opacity: 0.7, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>Join property managers who&apos;ve reclaimed 12+ hours per week with PropWise AI.</p>
          <Link href="/auth/signup" className="cta-btn" style={{ background: 'var(--pw-accent)', fontSize: 16, padding: '16px 40px' }}>
            Start Your Free Trial
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <p style={{ fontSize: 13, opacity: 0.5, marginTop: 16 }}>14-day free trial &middot; No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--pw-ink)', color: 'white', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, background: 'var(--pw-accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'DM Serif Display', fontSize: 14 }}>P</div>
            <span style={{ fontFamily: 'DM Serif Display', fontSize: 16 }}>PropWise AI</span>
          </div>
          <div style={{ fontSize: 13, opacity: 0.5 }}>&copy; 2026 PropWise AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
