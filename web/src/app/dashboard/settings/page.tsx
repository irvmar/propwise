'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, functions } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const PLAN_DETAILS: Record<string, { name: string; price: number; description: string }> = {
  starter: { name: 'Starter', price: 0, description: 'Free - Up to 50 messages/mo' },
  growth: { name: 'Growth', price: 99, description: '$99/mo - Up to 500 messages/mo' },
  professional: { name: 'Professional', price: 199, description: '$199/mo - Up to 2,000 messages/mo' },
  enterprise: { name: 'Enterprise', price: 349, description: '$349/mo - Unlimited messages' },
};

export default function SettingsPage() {
  const { profile } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billingLoading, setBillingLoading] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    aiEnabled: true,
    autoRespond: true,
    escalationEmail: '',
    escalationPhone: '',
  });

  useEffect(() => {
    if (!profile?.organizationId) return;
    const fetchOrg = async () => {
      const orgDoc = await getDoc(doc(firestore, 'organizations', profile.organizationId));
      if (orgDoc.exists()) {
        const data = orgDoc.data();
        setOrg(data);
        setSettings({
          aiEnabled: data.settings.aiEnabled,
          autoRespond: data.settings.autoRespond,
          escalationEmail: data.settings.escalationEmail,
          escalationPhone: data.settings.escalationPhone || '',
        });
      }
      setLoading(false);
    };
    fetchOrg();
  }, [profile?.organizationId]);

  const handleSave = async () => {
    if (!profile?.organizationId) return;
    setSaving(true);
    await updateDoc(doc(firestore, 'organizations', profile.organizationId), {
      'settings.aiEnabled': settings.aiEnabled,
      'settings.autoRespond': settings.autoRespond,
      'settings.escalationEmail': settings.escalationEmail,
      'settings.escalationPhone': settings.escalationPhone || null,
    });
    setSaving(false);
  };

  const handleUpgrade = async (planId: string) => {
    setBillingLoading(planId);
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
      setBillingLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading('portal');
    try {
      const createBillingPortalFn = httpsCallable<
        { origin: string },
        { url: string }
      >(functions, 'createBillingPortalSession');
      const result = await createBillingPortalFn({
        origin: window.location.origin,
      });
      if (result.data.url) {
        window.open(result.data.url, '_blank');
      }
    } catch (err) {
      console.error('Failed to create billing portal session:', err);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setBillingLoading(null);
    }
  };

  if (loading) return <div className="h-64 pw-skeleton" />;

  const currentPlan = org?.plan || 'starter';
  const planInfo = PLAN_DETAILS[currentPlan] || PLAN_DETAILS.starter;
  const hasSubscription = !!org?.stripeSubscriptionId;
  const paymentFailed = !!org?.paymentFailed;

  const planOrder = ['starter', 'growth', 'professional', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const upgradePlans = planOrder
    .slice(currentIndex + 1)
    .filter((p) => p !== 'starter');

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading text-[var(--pw-ink)] mb-4 md:mb-6">Settings</h1>

      <div className="space-y-4 md:space-y-6 max-w-2xl">
        {/* Payment Failed Warning */}
        {paymentFailed && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-800">Payment Failed</h3>
                <p className="text-sm text-red-700 mt-1">
                  Your last payment failed. Please update your payment method to avoid service interruption.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                  onClick={handleManageBilling}
                  disabled={billingLoading === 'portal'}
                >
                  {billingLoading === 'portal' ? 'Opening...' : 'Update Payment Method'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <Card className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
          <CardHeader>
            <CardTitle className="font-heading">Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-[var(--pw-slate)]">Name</Label>
              <p className="font-medium text-[var(--pw-ink)]">{org?.name}</p>
            </div>
            <div>
              <Label className="text-[var(--pw-slate)]">Plan</Label>
              <Badge className="ml-2">{planInfo.name}</Badge>
            </div>
            <div>
              <Label className="text-[var(--pw-slate)]">Twilio Number</Label>
              <p className="font-medium text-[var(--pw-ink)]">{org?.twilioPhoneNumber || 'Not configured'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Billing Section */}
        <Card className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
          <CardHeader>
            <CardTitle className="font-heading">Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-[var(--pw-slate)]">Current Plan</Label>
              <p className="font-medium text-lg text-[var(--pw-ink)]">{planInfo.name}</p>
              <p className="text-sm text-[var(--pw-slate)]">{planInfo.description}</p>
            </div>

            {upgradePlans.length > 0 && (
              <div>
                <Label className="text-[var(--pw-slate)] mb-2 block">Upgrade</Label>
                <div className="space-y-2">
                  {upgradePlans.map((planId) => {
                    const plan = PLAN_DETAILS[planId];
                    return (
                      <div key={planId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-[var(--pw-border)] rounded-lg gap-3">
                        <div>
                          <p className="font-medium text-[var(--pw-ink)]">{plan.name}</p>
                          <p className="text-sm text-[var(--pw-slate)]">{plan.description}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUpgrade(planId)}
                          disabled={billingLoading !== null}
                          className="shrink-0"
                        >
                          {billingLoading === planId ? 'Loading...' : `Upgrade to ${plan.name}`}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {hasSubscription && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="border-[var(--pw-border)]"
                  onClick={handleManageBilling}
                  disabled={billingLoading === 'portal'}
                >
                  {billingLoading === 'portal' ? 'Opening...' : 'Manage Billing'}
                </Button>
                <p className="text-xs text-[var(--pw-slate)] mt-2">
                  Update payment method, view invoices, or cancel your subscription via the Stripe billing portal.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
          <CardHeader>
            <CardTitle className="font-heading">AI Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>AI Enabled</Label>
                <p className="text-sm text-[var(--pw-slate)]">Allow the AI to respond to tenant messages</p>
              </div>
              <Switch checked={settings.aiEnabled} onCheckedChange={(v) => setSettings({ ...settings, aiEnabled: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Respond</Label>
                <p className="text-sm text-[var(--pw-slate)]">Automatically send AI responses (vs. draft for review)</p>
              </div>
              <Switch checked={settings.autoRespond} onCheckedChange={(v) => setSettings({ ...settings, autoRespond: v })} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
          <CardHeader>
            <CardTitle className="font-heading">Escalation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Escalation Email</Label>
              <Input
                value={settings.escalationEmail}
                onChange={(e) => setSettings({ ...settings, escalationEmail: e.target.value })}
              />
            </div>
            <div>
              <Label>Escalation Phone (for emergencies)</Label>
              <Input
                value={settings.escalationPhone}
                onChange={(e) => setSettings({ ...settings, escalationPhone: e.target.value })}
                placeholder="+15551234567"
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
