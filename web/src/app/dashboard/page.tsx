'use client';

import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
  properties: number;
  units: number;
  tenants: number;
  activeConversations: number;
  openWorkOrders: number;
  escalated: number;
  monthlyMessages: number;
  plan: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const callable = httpsCallable<unknown, DashboardStats>(functions, 'getDashboardStats');
        const result = await callable({});
        setStats(result.data);
      } catch {
        // Stats will show as 0 if not loaded
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Properties', value: stats?.properties ?? 0, color: 'text-[var(--pw-accent)]' },
    { label: 'Active Tenants', value: stats?.tenants ?? 0, color: 'text-[var(--pw-sage)]' },
    { label: 'Open Conversations', value: stats?.activeConversations ?? 0, color: 'text-[var(--pw-ink)]' },
    { label: 'Open Work Orders', value: stats?.openWorkOrders ?? 0, color: 'text-[var(--pw-accent)]' },
    { label: 'Escalated', value: stats?.escalated ?? 0, color: 'text-red-600' },
    { label: 'Messages This Month', value: stats?.monthlyMessages ?? 0, color: 'text-[var(--pw-slate)]' },
  ];

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-heading text-[var(--pw-ink)]">Dashboard</h1>
        <p className="text-[var(--pw-slate)] mt-1 text-sm md:text-base">Welcome back. Here&apos;s your property overview.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-[var(--pw-border)]">
              <CardContent className="pt-6">
                <div className="h-16 pw-skeleton" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-[var(--pw-slate)]">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl md:text-3xl font-bold font-heading ${stat.color}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
