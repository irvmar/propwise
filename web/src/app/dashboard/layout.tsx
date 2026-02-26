'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '@/contexts/auth-context';
import { signOut } from 'firebase/auth';
import { auth, firestore, functions } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Features that require Growth plan or higher
const GROWTH_GATED_PATHS = ['/dashboard/vendors', '/dashboard/knowledge-base'];

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/inbox', label: 'Inbox', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
  { href: '/dashboard/work-orders', label: 'Work Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/dashboard/properties', label: 'Properties', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { href: '/dashboard/tenants', label: 'Tenants', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/dashboard/vendors', label: 'Vendors', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { href: '/dashboard/knowledge-base', label: 'Knowledge Base', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { href: '/dashboard/marketing', label: 'Marketing', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orgPlan, setOrgPlan] = useState<string>('starter');
  const [isMarketingAdmin, setIsMarketingAdmin] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Check marketing access via backend — no emails in frontend
  useEffect(() => {
    if (!user) return;
    const check = httpsCallable<unknown, { authorized: boolean }>(functions, 'checkMarketingAccess');
    check().then((res) => setIsMarketingAdmin(res.data.authorized)).catch(() => {});
  }, [user]);

  // Listen to org plan in real-time
  useEffect(() => {
    if (!profile?.organizationId) return;
    const unsub = onSnapshot(doc(firestore, 'organizations', profile.organizationId), (snap) => {
      if (snap.exists()) {
        setOrgPlan(snap.data().plan || 'starter');
      }
    });
    return unsub;
  }, [profile?.organizationId]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isGrowthOrAbove = orgPlan !== 'starter';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--pw-cream)]">
        <div className="pw-spinner" />
        <p className="mt-4 text-sm text-[var(--pw-slate)] font-body">Loading PropWise...</p>
      </div>
    );
  }

  if (!user) return null;

  // If no org, redirect to onboarding (unless already there)
  if (!profile?.organizationId && !pathname.includes('onboarding')) {
    router.push('/dashboard/onboarding');
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--pw-cream)] flex font-body">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[var(--pw-ink)] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--pw-accent)] rounded-lg flex items-center justify-center text-white font-heading text-lg">
              P
            </div>
            <div>
              <h1 className="text-lg text-[var(--pw-cream)] font-heading tracking-wide">PropWise</h1>
              <p className="text-[10px] text-[var(--pw-slate)] font-body uppercase tracking-widest">Property Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.filter((item) => {
            // Hide Marketing nav for non-admin users
            if (item.href === '/dashboard/marketing') return isMarketingAdmin;
            return true;
          }).map((item) => {
            const isGated = !isGrowthOrAbove && GROWTH_GATED_PATHS.includes(item.href);
            return (
              <Link
                key={item.href}
                href={isGated ? '/dashboard/settings' : item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors font-body',
                  pathname === item.href
                    ? 'bg-[var(--pw-accent)] text-white'
                    : isGated
                      ? 'text-[var(--pw-cream)]/40 hover:bg-white/5'
                      : 'text-[var(--pw-cream)]/70 hover:bg-white/10 hover:text-[var(--pw-cream)]',
                )}
                title={isGated ? 'Upgrade to Growth plan to unlock' : undefined}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                {item.label}
                {isGated && (
                  <svg className="w-3.5 h-3.5 ml-auto shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10">
          <div className="text-sm text-[var(--pw-cream)]/60 mb-2 truncate font-body">{user.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-[var(--pw-cream)]/50 hover:text-[var(--pw-cream)] hover:bg-white/10 font-body"
            onClick={() => signOut(auth)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-30 lg:hidden bg-white/80 backdrop-blur-md border-b border-[var(--pw-border)]">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-[var(--pw-warm)] transition-colors"
              aria-label="Open navigation"
            >
              <svg className="w-6 h-6 text-[var(--pw-ink)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[var(--pw-accent)] rounded-md flex items-center justify-center text-white font-heading text-sm">P</div>
              <span className="font-heading text-base text-[var(--pw-ink)]">PropWise</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardContent>{children}</DashboardContent>;
}
