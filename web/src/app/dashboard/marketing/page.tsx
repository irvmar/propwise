'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import Papa from 'papaparse';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────

interface MarketingStats {
  leads: { total: number; byStatus: Record<string, number> };
  emails: { sent: number; opened: number; clicked: number; openRate: number; clickRate: number; byType: Record<string, number> };
  social: { total: number; byStatus: Record<string, number> };
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  status: string;
  score: number;
  sequenceStep: number;
  lastEmailAt?: { _seconds: number };
}

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  hashtags: string[];
  theme: string;
  dayOfWeek: string;
  status: string;
  hasImage?: boolean;
  imageUrl?: string | null;
  scheduledFor?: { _seconds: number };
  publishedAt?: { _seconds: number };
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(ts?: { _seconds: number }): string {
  if (!ts) return '\u2014';
  return new Date(ts._seconds * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  nurturing: 'bg-yellow-100 text-yellow-800',
  hot: 'bg-orange-100 text-orange-800',
  converted: 'bg-green-100 text-green-800',
  bounced: 'bg-red-100 text-red-800',
  unsubscribed: 'bg-gray-100 text-gray-800',
  draft: 'bg-[var(--pw-warm)] text-[var(--pw-slate)]',
  approved: 'bg-blue-50 text-blue-700',
  rejected: 'bg-red-50 text-red-700',
  published: 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]',
};

// ─── Tab Icon Components ────────────────────────────────────────────

function LeadsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function SocialIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  );
}

function BlogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  );
}

function AnalyticsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────

export default function MarketingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Check access via backend — no emails exposed in frontend
  useEffect(() => {
    if (authLoading || !user) return;
    const check = httpsCallable<unknown, { authorized: boolean }>(functions, 'checkMarketingAccess');
    check().then((res) => {
      if (!res.data.authorized) {
        router.push('/dashboard');
      } else {
        setIsAuthorized(true);
      }
    }).catch(() => {
      router.push('/dashboard');
    });
  }, [authLoading, user, router]);

  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [blogDraft, setBlogDraft] = useState<string>('');
  const [blogDraftSaved, setBlogDraftSaved] = useState(true);
  const [activeTab, setActiveTab] = useState('leads');

  const loadData = useCallback(async () => {
    try {
      const [statsRes, leadsRes, postsRes] = await Promise.all([
        httpsCallable(functions, 'getMarketingStats')(),
        httpsCallable(functions, 'getLeads')(),
        httpsCallable(functions, 'getSocialPosts')(),
      ]);
      setStats(statsRes.data as MarketingStats);
      setLeads(leadsRes.data as Lead[]);
      setPosts(postsRes.data as SocialPost[]);
    } catch {
      toast.error('Failed to load marketing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleTabChange = (newTab: string) => {
    if (activeTab === 'blog' && blogDraft && !blogDraftSaved) {
      const confirmed = window.confirm('You have an unsaved blog draft. Switch tabs anyway?');
      if (!confirmed) return;
    }
    setActiveTab(newTab);
  };

  if (authLoading || isAuthorized === null || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="pw-spinner" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="animate-in fade-in duration-300">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-heading text-[var(--pw-ink)]">Marketing</h1>
          <p className="text-sm text-[var(--pw-slate)] mt-1 font-body">
            Manage leads, campaigns, social content, and analytics
          </p>
        </div>
        <Button variant="outline" size="sm" className="border-[var(--pw-border)] self-start sm:self-auto" onClick={loadData}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="bg-white border border-[var(--pw-border)] shadow-[0_1px_3px_rgba(26,23,20,0.04)] h-auto p-1 w-full sm:w-auto">
            <TabsTrigger value="leads" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-[var(--pw-ink)] data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-200">
              <LeadsIcon className="w-3.5 h-3.5 hidden sm:block" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-[var(--pw-ink)] data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-200">
              <EmailIcon className="w-3.5 h-3.5 hidden sm:block" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-[var(--pw-ink)] data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-200">
              <SocialIcon className="w-3.5 h-3.5 hidden sm:block" />
              Social
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-[var(--pw-ink)] data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-200">
              <BlogIcon className="w-3.5 h-3.5 hidden sm:block" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-[var(--pw-ink)] data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-200">
              <AnalyticsIcon className="w-3.5 h-3.5 hidden sm:block" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="leads" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <LeadsTab stats={stats} leads={leads} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="emails" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <EmailsTab stats={stats} />
        </TabsContent>

        <TabsContent value="social" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <SocialTab posts={posts} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="blog" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <BlogTab blogDraft={blogDraft} setBlogDraft={(v) => { setBlogDraft(v); setBlogDraftSaved(false); }} onDraftSaved={() => setBlogDraftSaved(true)} />
        </TabsContent>

        <TabsContent value="analytics" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <AnalyticsTab stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Leads Tab ──────────────────────────────────────────────────────

const LEAD_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'nurturing', label: 'Nurturing' },
  { value: 'hot', label: 'Hot' },
  { value: 'converted', label: 'Converted' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
  { value: 'bounced', label: 'Bounced' },
];

function LeadsTab({ stats, leads, onRefresh }: { stats: MarketingStats | null; leads: Lead[]; onRefresh: () => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', portfolioSize: '', market: '' });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(leads);

  useEffect(() => {
    if (!statusFilter) {
      setFilteredLeads(leads);
    } else {
      setFilteredLeads(leads.filter((l) => l.status === statusFilter));
    }
  }, [leads, statusFilter]);

  const handleAddLead = async () => {
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    if (!trimmedName || !trimmedEmail) {
      toast.error('Name and email are required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    try {
      await httpsCallable(functions, 'addLead')({
        name: trimmedName,
        email: trimmedEmail,
        company: form.company.trim() || undefined,
        portfolioSize: form.portfolioSize ? parseInt(form.portfolioSize, 10) : undefined,
        market: form.market.trim() || undefined,
        source: 'manual',
      });
      toast.success('Lead added');
      setAddOpen(false);
      setForm({ name: '', email: '', company: '', portfolioSize: '', market: '' });
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add lead';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    // Use papaparse for proper CSV handling (quotes, commas in fields, etc.)
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    if (result.errors.length > 0) {
      toast.error(`CSV parse error: ${result.errors[0].message}`);
      return;
    }

    const parsed = result.data
      .map((row) => ({
        email: row.email?.trim() || '',
        name: row.name?.trim() || `${row.firstname?.trim() || ''} ${row.lastname?.trim() || ''}`.trim(),
        company: row.company?.trim() || undefined,
        portfolioSize: row.portfoliosize || row['portfolio_size']
          ? parseInt(row.portfoliosize || row['portfolio_size'], 10)
          : undefined,
        market: row.market?.trim() || undefined,
      }))
      .filter((l) => l.email && l.name);

    if (parsed.length === 0) {
      toast.error('No valid leads found in CSV. Ensure columns: email, name');
      return;
    }

    try {
      const res = await httpsCallable(functions, 'importLeads')({ leads: parsed }) as { data: { imported: number; skipped: number } };
      toast.success(`Imported ${res.data.imported} leads (${res.data.skipped} duplicates skipped)`);
      onRefresh();
    } catch {
      toast.error('Failed to import leads');
    }

    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total Leads" value={stats?.leads.total ?? 0} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        } />
        <StatCard label="Nurturing" value={stats?.leads.byStatus?.nurturing ?? 0} color="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
        <StatCard label="Hot" value={stats?.leads.byStatus?.hot ?? 0} color="accent" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
        } />
        <StatCard label="Converted" value={stats?.leads.byStatus?.converted ?? 0} color="sage" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-[var(--pw-slate)] font-body">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}{statusFilter ? ` (${statusFilter})` : ' in pipeline'}
          </p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-[var(--pw-border)] rounded-md px-2.5 py-1.5 bg-white text-[var(--pw-ink)] font-body focus:outline-none focus:ring-2 focus:ring-[var(--pw-accent)]/20 focus:border-[var(--pw-accent)]"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Add Lead</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[var(--pw-ink)]">Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[var(--pw-ink)]">Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[var(--pw-ink)]">Company</Label>
                  <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Properties" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[var(--pw-ink)]">Portfolio Size</Label>
                    <Input type="number" value={form.portfolioSize} onChange={(e) => setForm({ ...form, portfolioSize: e.target.value })} placeholder="50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[var(--pw-ink)]">Market</Label>
                    <Input value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })} placeholder="Austin, TX" />
                  </div>
                </div>
                <Button onClick={handleAddLead} disabled={submitting || !form.name.trim() || !form.email.trim()} className="w-full">
                  {submitting ? 'Adding...' : 'Add Lead'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" className="border-[var(--pw-border)]" asChild>
            <label className="cursor-pointer">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
            </label>
          </Button>
        </div>
      </div>

      {/* Leads Table */}
      <Card className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--pw-warm)]/60 hover:bg-[var(--pw-warm)]/60">
                <TableHead className="font-semibold text-[var(--pw-ink)] text-xs uppercase tracking-wide">Name</TableHead>
                <TableHead className="font-semibold text-[var(--pw-ink)] text-xs uppercase tracking-wide hidden md:table-cell">Company</TableHead>
                <TableHead className="font-semibold text-[var(--pw-ink)] text-xs uppercase tracking-wide hidden lg:table-cell">Email</TableHead>
                <TableHead className="font-semibold text-[var(--pw-ink)] text-xs uppercase tracking-wide">Status</TableHead>
                <TableHead className="font-semibold text-[var(--pw-ink)] text-xs uppercase tracking-wide text-center">Score</TableHead>
                <TableHead className="font-semibold text-[var(--pw-ink)] text-xs uppercase tracking-wide text-center hidden sm:table-cell">Step</TableHead>
                <TableHead className="font-semibold text-[var(--pw-ink)] text-xs uppercase tracking-wide hidden lg:table-cell">Last Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="group transition-colors hover:bg-[var(--pw-warm)]/40">
                  <TableCell className="font-medium text-[var(--pw-ink)]">
                    <div>{lead.name}</div>
                    <div className="text-xs text-[var(--pw-slate)] md:hidden">{lead.company || ''}</div>
                  </TableCell>
                  <TableCell className="text-[var(--pw-slate)] hidden md:table-cell">{lead.company || '\u2014'}</TableCell>
                  <TableCell className="text-sm text-[var(--pw-slate)] hidden lg:table-cell">{lead.email}</TableCell>
                  <TableCell><Badge className={statusColors[lead.status]}>{lead.status}</Badge></TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                      lead.score >= 80 ? 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]' :
                      lead.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-[var(--pw-warm)] text-[var(--pw-slate)]'
                    }`}>
                      {lead.score}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-[var(--pw-slate)] hidden sm:table-cell">{lead.sequenceStep}</TableCell>
                  <TableCell className="text-sm text-[var(--pw-slate)] hidden lg:table-cell">{formatDate(lead.lastEmailAt)}</TableCell>
                </TableRow>
              ))}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-[var(--pw-border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm text-[var(--pw-slate)] font-body">No leads yet. Add your first lead or import a CSV.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// ─── Emails Tab ─────────────────────────────────────────────────────

function EmailsTab({ stats }: { stats: MarketingStats | null }) {
  const emailEvents = ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained'] as const;

  const eventIcons: Record<string, React.ReactNode> = {
    sent: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
    delivered: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    opened: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" /></svg>,
    clicked: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>,
    bounced: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    complained: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
  };

  const eventColors: Record<string, string> = {
    sent: 'text-[var(--pw-accent)]',
    delivered: 'text-[var(--pw-sage)]',
    opened: 'text-blue-600',
    clicked: 'text-purple-600',
    bounced: 'text-orange-500',
    complained: 'text-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Top-level email KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard label="Sent" value={stats?.emails.sent ?? 0} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        } />
        <StatCard label="Opened" value={stats?.emails.opened ?? 0} color="sage" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5" /></svg>
        } />
        <StatCard label="Clicked" value={stats?.emails.clicked ?? 0} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>
        } />
        <StatCard label="Open Rate" value={`${stats?.emails.openRate ?? 0}%`} color="sage" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        } />
        <StatCard label="Click Rate" value={`${stats?.emails.clickRate ?? 0}%`} color="accent" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        } />
      </div>

      {/* Email events breakdown */}
      <Card className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
        <CardHeader>
          <CardTitle className="text-base font-heading text-[var(--pw-ink)]">Email Event Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {emailEvents.map((type) => (
              <div key={type} className="group flex flex-col items-center p-4 rounded-xl bg-[var(--pw-warm)]/50 hover:bg-[var(--pw-warm)] transition-colors duration-200">
                <div className={`mb-2 ${eventColors[type]}`}>
                  {eventIcons[type]}
                </div>
                <div className="text-2xl font-heading text-[var(--pw-ink)]">{stats?.emails.byType?.[type] ?? 0}</div>
                <div className="text-xs text-[var(--pw-slate)] capitalize font-body mt-0.5">{type}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Social Tab ─────────────────────────────────────────────────────

function SocialTab({ posts, onRefresh }: { posts: SocialPost[]; onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    httpsCallable<unknown, { autoApprove: boolean }>(functions, 'getMarketingSettings')()
      .then((res) => setAutoApprove(res.data.autoApprove))
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  const handleToggleAutoApprove = async (checked: boolean) => {
    setAutoApprove(checked);
    try {
      await httpsCallable(functions, 'updateMarketingSettings')({ autoApprove: checked });
      toast.success(checked ? 'Auto-approve enabled' : 'Auto-approve disabled');
    } catch {
      setAutoApprove(!checked);
      toast.error('Failed to update setting');
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Uses the onCall wrapper (triggerWeeklyContent), not the onSchedule function
      // Set 10-minute timeout — generation takes ~3-4 min for 8 posts with images
      const res = await httpsCallable<unknown, { postCount: number; campaignWeek: string; skipped?: boolean }>(functions, 'triggerWeeklyContent', { timeout: 600000 })();
      if (res.data.skipped) {
        toast.info(`Content already exists for week ${res.data.campaignWeek}. Delete existing posts first to regenerate.`);
      } else {
        toast.success(`Generated ${res.data.postCount} posts for week ${res.data.campaignWeek}`);
      }
    } catch {
      toast.error('Generation may still be running in the background. Refreshing...');
    } finally {
      setGenerating(false);
      onRefresh();
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      await httpsCallable(functions, 'approvePost')({ postId });
      toast.success('Post approved');
      onRefresh();
    } catch {
      toast.error('Failed to approve post');
    }
  };

  const handleReject = async (postId: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await httpsCallable(functions, 'rejectPost')({ postId, reason });
      toast.success('Post rejected');
      onRefresh();
    } catch {
      toast.error('Failed to reject post');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await httpsCallable(functions, 'deletePost')({ postId });
      toast.success('Post deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const draftCount = posts.filter(p => p.status === 'draft').length;
  const publishedCount = posts.filter(p => p.status === 'published').length;

  return (
    <div className="space-y-6">
      {/* Header bar with auto-approve toggle */}
      <Card className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
        <CardContent className="py-4 px-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <h2 className="text-lg font-heading text-[var(--pw-ink)]">Social Content</h2>
                <p className="text-sm text-[var(--pw-slate)] font-body mt-0.5">
                  {posts.length} post{posts.length !== 1 ? 's' : ''} total
                  {draftCount > 0 && <span className="ml-1">&middot; {draftCount} pending review</span>}
                  {publishedCount > 0 && <span className="ml-1">&middot; {publishedCount} ready to post</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Auto-approve toggle */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[var(--pw-warm)] border border-[var(--pw-border)]">
                <div className="flex flex-col">
                  <Label htmlFor="auto-approve" className="text-sm font-medium text-[var(--pw-ink)] cursor-pointer leading-tight">
                    Auto-approve
                  </Label>
                  <span className="text-[11px] text-[var(--pw-slate)] leading-tight">
                    {autoApprove ? 'Posts go live automatically' : 'Manual review required'}
                  </span>
                </div>
                <Switch
                  id="auto-approve"
                  checked={autoApprove}
                  onCheckedChange={handleToggleAutoApprove}
                  disabled={loadingSettings}
                />
              </div>

              <Button onClick={handleGenerate} disabled={generating} size="sm">
                {generating ? (
                  <>
                    <div className="pw-spinner-sm mr-1.5" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual publishing notice */}
      {posts.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-800">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-xs font-body">
            Posts are generated as a content calendar. Use the <strong>Copy</strong> button on each post to copy the text, then paste it directly into LinkedIn or X/Twitter.
          </p>
        </div>
      )}

      {/* Posts grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <Card key={post.id} className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)] group hover:shadow-[0_4px_12px_rgba(26,23,20,0.08)] transition-shadow duration-200 overflow-hidden">
            {/* Platform & status stripe */}
            <div className={`h-1 ${
              post.status === 'published' ? 'bg-[var(--pw-sage)]' :
              post.status === 'approved' ? 'bg-blue-400' :
              post.status === 'rejected' ? 'bg-red-400' :
              'bg-[var(--pw-border)]'
            }`} />
            <CardContent className="pt-5 pb-5">
              {/* Badges row */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="outline" className="border-[var(--pw-border)] font-medium text-[var(--pw-ink)]">
                  {post.platform === 'twitter' ? (
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  ) : (
                    <span className="capitalize">{post.platform}</span>
                  )}
                  {post.platform === 'twitter' && <span>X / Twitter</span>}
                </Badge>
                <Badge className={`${statusColors[post.status]} transition-colors`}>{post.status}</Badge>
                {post.hasImage && (
                  <Badge variant="outline" className="text-[var(--pw-sage)] border-[var(--pw-sage-soft)]">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Image
                  </Badge>
                )}
                <span className="text-xs text-[var(--pw-slate)] ml-auto font-body">{post.dayOfWeek}</span>
              </div>

              {/* Image thumbnail */}
              {post.imageUrl && (
                <div className="mb-3 rounded-lg overflow-hidden border border-[var(--pw-border)]">
                  <img src={post.imageUrl} alt="Post image" className="w-full h-32 object-cover" />
                </div>
              )}

              {/* Content */}
              <p className="text-sm font-body text-[var(--pw-ink)] mb-3 line-clamp-4 leading-relaxed">{post.content}</p>

              {/* Hashtags */}
              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.hashtags.map((tag) => (
                    <span key={tag} className="text-xs text-[var(--pw-accent)] bg-[var(--pw-accent)]/5 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              )}

              {/* Action row */}
              {post.status === 'draft' && (
                <div className="flex gap-2 pt-2 border-t border-[var(--pw-border)]">
                  <Button size="sm" onClick={() => handleApprove(post.id)} className="flex-1 sm:flex-none">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(post.id)} className="border-[var(--pw-border)] flex-1 sm:flex-none">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Reject
                  </Button>
                </div>
              )}
              {post.status === 'approved' && (
                <div className="flex items-center justify-between pt-2 border-t border-[var(--pw-border)]">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs text-[var(--pw-slate)] font-body">Scheduled: {formatDate(post.scheduledFor)}</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-[var(--pw-border)] h-7 text-xs px-2" onClick={() => { navigator.clipboard.writeText(post.content + '\n\n' + post.hashtags.join(' ')); toast.success('Post copied to clipboard'); }}>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Copy
                  </Button>
                </div>
              )}
              {post.status === 'published' && (
                <div className="flex items-center justify-between pt-2 border-t border-[var(--pw-border)]">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[var(--pw-sage)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs text-[var(--pw-sage)] font-body font-medium">Ready to post &middot; {formatDate(post.publishedAt)}</p>
                  </div>
                  <Button size="sm" variant="outline" className="border-[var(--pw-border)] h-7 text-xs px-2" onClick={() => { navigator.clipboard.writeText(post.content + '\n\n' + post.hashtags.join(' ')); toast.success('Post copied to clipboard'); }}>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Copy
                  </Button>
                </div>
              )}
              {/* Delete button */}
              <div className={`flex justify-end ${post.status !== 'draft' && post.status !== 'approved' && post.status !== 'published' ? 'pt-2 border-t border-[var(--pw-border)]' : 'mt-2'}`}>
                <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(post.id)}>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {posts.length === 0 && (
          <Card className="col-span-full border-[var(--pw-border)] border-dashed">
            <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--pw-warm)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--pw-slate)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--pw-ink)]">No social posts yet</p>
                <p className="text-sm text-[var(--pw-slate)] font-body mt-1">
                  Click &quot;Generate Now&quot; to create this week&apos;s content.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Blog Tab ───────────────────────────────────────────────────────

interface SavedBlogDraft {
  id: string;
  topic: string;
  targetKeywords: string[];
  mdxContent: string;
  status: string;
  tokensUsed: number;
  createdAt: { _seconds: number };
}

function BlogTab({ blogDraft, setBlogDraft, onDraftSaved }: { blogDraft: string; setBlogDraft: (v: string) => void; onDraftSaved: () => void }) {
  const [form, setForm] = useState({ topic: '', keywords: '', angle: '', wordCount: '1200' });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<SavedBlogDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [lastGeneratedMeta, setLastGeneratedMeta] = useState<{ topic: string; keywords: string[]; angle?: string; wordCount: number; tokensUsed: number } | null>(null);

  const loadDrafts = useCallback(async () => {
    try {
      const res = await httpsCallable(functions, 'getBlogDrafts')();
      setSavedDrafts(res.data as SavedBlogDraft[]);
    } catch {
      // silently fail — drafts list is secondary
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  const handleGenerate = async () => {
    const trimmedTopic = form.topic.trim();
    const keywords = form.keywords.split(',').map((k) => k.trim()).filter(Boolean);
    const wordCount = parseInt(form.wordCount, 10);

    if (!trimmedTopic) {
      toast.error('Topic is required');
      return;
    }
    if (keywords.length === 0) {
      toast.error('At least one keyword is required');
      return;
    }
    if (isNaN(wordCount) || wordCount < 500 || wordCount > 3000) {
      toast.error('Word count must be between 500 and 3000');
      return;
    }

    setGenerating(true);
    try {
      const res = await httpsCallable(functions, 'generateBlogDraft')({
        topic: trimmedTopic,
        targetKeywords: keywords,
        angle: form.angle.trim() || undefined,
        wordCount,
      }) as { data: { mdxContent: string; tokensUsed: number } };
      setBlogDraft(res.data.mdxContent);
      setLastGeneratedMeta({ topic: trimmedTopic, keywords, angle: form.angle.trim() || undefined, wordCount, tokensUsed: res.data.tokensUsed });
      toast.success(`Draft generated (${res.data.tokensUsed} tokens)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate blog draft';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!blogDraft || !lastGeneratedMeta) return;
    setSaving(true);
    try {
      await httpsCallable(functions, 'saveBlogDraft')({
        topic: lastGeneratedMeta.topic,
        targetKeywords: lastGeneratedMeta.keywords,
        angle: lastGeneratedMeta.angle,
        wordCount: lastGeneratedMeta.wordCount,
        mdxContent: blogDraft,
        tokensUsed: lastGeneratedMeta.tokensUsed,
      });
      toast.success('Draft saved');
      setLastGeneratedMeta(null);
      onDraftSaved();
      loadDrafts();
    } catch {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await httpsCallable(functions, 'deleteBlogDraft')({ draftId });
      toast.success('Draft deleted');
      loadDrafts();
    } catch {
      toast.error('Failed to delete draft');
    }
  };

  const handleCopy = (content?: string) => {
    navigator.clipboard.writeText(content || blogDraft);
    toast.success('MDX copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <Card className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--pw-warm)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--pw-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-base font-heading text-[var(--pw-ink)]">Generate Blog Draft</CardTitle>
              <p className="text-xs text-[var(--pw-slate)] font-body mt-0.5">AI-powered SEO content for your property management blog</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[var(--pw-ink)]">Topic</Label>
            <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. 5 Ways to Reduce Tenant Turnover" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[var(--pw-ink)]">Target Keywords (comma-separated)</Label>
            <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="tenant turnover, retention strategies" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[var(--pw-ink)]">Angle (optional)</Label>
              <Input value={form.angle} onChange={(e) => setForm({ ...form, angle: e.target.value })} placeholder="Written for PMs managing 50-200 units" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[var(--pw-ink)]">Word Count</Label>
              <Input type="number" value={form.wordCount} onChange={(e) => setForm({ ...form, wordCount: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={generating || !form.topic.trim() || !form.keywords.trim()}>
            {generating ? (
              <>
                <div className="pw-spinner-sm mr-2" />
                Generating Draft...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Draft
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {blogDraft && (
        <Card className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--pw-sage-soft)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--pw-sage)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle className="text-base font-heading text-[var(--pw-ink)]">Generated Draft</CardTitle>
              </div>
              <div className="flex gap-2">
                {lastGeneratedMeta && (
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <div className="pw-spinner-sm mr-1.5" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save Draft
                      </>
                    )}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="border-[var(--pw-border)]" onClick={() => handleCopy()}>
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy MDX
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-[var(--pw-warm)] rounded-xl p-5 text-sm font-mono overflow-x-auto max-h-[500px] overflow-y-auto whitespace-pre-wrap text-[var(--pw-ink)] border border-[var(--pw-border)] leading-relaxed">
              {blogDraft}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Saved Drafts */}
      <Card className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--pw-warm)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--pw-slate)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-base font-heading text-[var(--pw-ink)]">Saved Drafts</CardTitle>
                <p className="text-xs text-[var(--pw-slate)] font-body mt-0.5">{savedDrafts.length} draft{savedDrafts.length !== 1 ? 's' : ''} saved</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingDrafts ? (
            <div className="flex items-center justify-center h-16">
              <div className="pw-spinner" />
            </div>
          ) : savedDrafts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--pw-slate)] font-body">No saved drafts yet. Generate a draft above and save it.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedDrafts.map((draft) => (
                <div key={draft.id} className="flex items-center justify-between p-4 rounded-lg bg-[var(--pw-warm)]/50 border border-[var(--pw-border)] group hover:bg-[var(--pw-warm)] transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-[var(--pw-ink)] truncate">{draft.topic}</p>
                      <Badge className={draft.status === 'published' ? 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]' : 'bg-[var(--pw-warm)] text-[var(--pw-slate)]'}>
                        {draft.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--pw-slate)] font-body">
                      <span>{draft.targetKeywords?.slice(0, 3).join(', ')}</span>
                      <span>&middot;</span>
                      <span>{formatDate(draft.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-3">
                    <Button size="sm" variant="outline" className="border-[var(--pw-border)] h-8 px-2.5" onClick={() => { setBlogDraft(draft.mdxContent); setLastGeneratedMeta(null); onDraftSaved(); toast.info('Draft loaded into editor'); }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </Button>
                    <Button size="sm" variant="outline" className="border-[var(--pw-border)] h-8 px-2.5" onClick={() => handleCopy(draft.mdxContent)}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-2.5" onClick={() => handleDeleteDraft(draft.id)}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Analytics Tab ──────────────────────────────────────────────────

function AnalyticsTab({ stats }: { stats: MarketingStats | null }) {
  const funnel = [
    { label: 'Total Leads', value: stats?.leads.total ?? 0, color: 'bg-[var(--pw-ink)]' },
    { label: 'Emails Sent', value: stats?.emails.sent ?? 0, color: 'bg-[var(--pw-accent)]' },
    { label: 'Opened', value: stats?.emails.opened ?? 0, color: 'bg-[var(--pw-accent-soft)]' },
    { label: 'Clicked', value: stats?.emails.clicked ?? 0, color: 'bg-[var(--pw-sage)]' },
    { label: 'Converted', value: stats?.leads.byStatus?.converted ?? 0, color: 'bg-[var(--pw-sage-soft)]' },
  ];

  const maxValue = Math.max(...funnel.map((f) => f.value), 1);

  return (
    <div className="space-y-6">
      {/* Funnel */}
      <Card className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--pw-warm)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--pw-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-base font-heading text-[var(--pw-ink)]">Marketing Funnel</CardTitle>
              <p className="text-xs text-[var(--pw-slate)] font-body mt-0.5">Conversion flow from leads to customers</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {funnel.map((step, index) => {
            const percentage = Math.max((step.value / maxValue) * 100, 2);
            return (
              <div key={step.label} className="group">
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--pw-warm)] flex items-center justify-center text-xs font-semibold text-[var(--pw-ink)]">
                      {index + 1}
                    </span>
                    <span className="font-body text-[var(--pw-ink)] font-medium">{step.label}</span>
                  </div>
                  <span className="font-heading text-[var(--pw-ink)] text-lg">{step.value}</span>
                </div>
                <div className="h-3 bg-[var(--pw-warm)] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${step.color} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {index < funnel.length - 1 && step.value > 0 && funnel[index + 1].value > 0 && (
                  <div className="flex justify-end mt-1">
                    <span className="text-[11px] text-[var(--pw-slate)] font-body">
                      {((funnel[index + 1].value / step.value) * 100).toFixed(1)}% conversion
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Social stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Social Posts" value={stats?.social.total ?? 0} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
        } />
        <StatCard label="Published" value={stats?.social.byStatus?.published ?? 0} color="sage" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
        <StatCard label="Drafts" value={stats?.social.byStatus?.draft ?? 0} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        } />
      </div>
    </div>
  );
}

// ─── Shared Stat Card ───────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon?: React.ReactNode; color?: 'accent' | 'sage' | 'amber' }) {
  const iconColorClass =
    color === 'accent' ? 'text-[var(--pw-accent)] bg-[var(--pw-accent)]/10' :
    color === 'sage' ? 'text-[var(--pw-sage)] bg-[var(--pw-sage-soft)]' :
    color === 'amber' ? 'text-amber-600 bg-amber-50' :
    'text-[var(--pw-slate)] bg-[var(--pw-warm)]';

  return (
    <Card className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)] group hover:shadow-[0_4px_12px_rgba(26,23,20,0.06)] transition-shadow duration-200">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-heading text-[var(--pw-ink)] leading-tight">{value}</div>
            <div className="text-xs text-[var(--pw-slate)] font-body mt-1">{label}</div>
          </div>
          {icon && (
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColorClass} transition-transform duration-200 group-hover:scale-105`}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
