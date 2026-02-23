'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useCallable } from '@/hooks/use-firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  // Skip onboarding if user already has an organization
  useEffect(() => {
    if (!authLoading && profile?.organizationId) {
      router.push('/dashboard');
    }
  }, [profile, authLoading, router]);
  const { call: createOrg, loading: creatingOrg, error: orgError } = useCallable('createOrganization');
  const { call: createProperty, loading: creatingProp } = useCallable('createProperty');
  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState('');

  const [orgForm, setOrgForm] = useState({
    name: '', slug: '', escalationEmail: '', escalationPhone: '',
  });

  const [propForm, setPropForm] = useState({
    name: '', street: '', city: '', state: '', zip: '',
  });

  const handleCreateOrg = async () => {
    const result = await createOrg({
      name: orgForm.name,
      slug: orgForm.slug || orgForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      escalationEmail: orgForm.escalationEmail,
      escalationPhone: orgForm.escalationPhone || undefined,
    });
    if (result) {
      setOrgId((result as any).id);
      setStep(2);
    }
  };

  const handleCreateProperty = async () => {
    await createProperty({
      name: propForm.name,
      address: { street: propForm.street, city: propForm.city, state: propForm.state, zip: propForm.zip, country: 'US' },
      type: 'multi_family',
    });
    setStep(3);
  };

  const handleFinish = () => {
    // Force a page reload to pick up the new org in auth context
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-lg border-[var(--pw-border)] shadow-[0_8px_32px_rgba(26,23,20,0.08)]">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[var(--pw-accent)] rounded-lg flex items-center justify-center text-white font-heading text-lg">P</div>
          </div>
          <CardTitle className="text-2xl font-heading">Welcome to PropWise AI</CardTitle>
          <CardDescription className="text-[var(--pw-slate)]">Let&apos;s set up your account — Step {step} of 3</CardDescription>
          <div className="flex gap-2 justify-center mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 w-16 rounded-full transition-colors ${s <= step ? 'bg-[var(--pw-accent)]' : 'bg-[var(--pw-border)]'}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--pw-ink)]">Create Your Organization</h3>
              {orgError && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{orgError}</div>}
              <div><Label>Company Name</Label><Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} placeholder="ABC Property Management" /></div>
              <div><Label>Escalation Email</Label><Input type="email" value={orgForm.escalationEmail} onChange={(e) => setOrgForm({ ...orgForm, escalationEmail: e.target.value })} placeholder="manager@company.com" /></div>
              <div><Label>Escalation Phone (optional)</Label><Input value={orgForm.escalationPhone} onChange={(e) => setOrgForm({ ...orgForm, escalationPhone: e.target.value })} placeholder="+15551234567" /></div>
              <Button onClick={handleCreateOrg} disabled={creatingOrg || !orgForm.name || !orgForm.escalationEmail} className="w-full">
                {creatingOrg ? 'Creating...' : 'Continue'}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--pw-ink)]">Add Your First Property</h3>
              <div><Label>Property Name</Label><Input value={propForm.name} onChange={(e) => setPropForm({ ...propForm, name: e.target.value })} placeholder="Sunset Apartments" /></div>
              <div><Label>Street</Label><Input value={propForm.street} onChange={(e) => setPropForm({ ...propForm, street: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>City</Label><Input value={propForm.city} onChange={(e) => setPropForm({ ...propForm, city: e.target.value })} /></div>
                <div><Label>State</Label><Input value={propForm.state} onChange={(e) => setPropForm({ ...propForm, state: e.target.value })} maxLength={2} /></div>
                <div><Label>ZIP</Label><Input value={propForm.zip} onChange={(e) => setPropForm({ ...propForm, zip: e.target.value })} /></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1 border-[var(--pw-border)]">Skip for now</Button>
                <Button onClick={handleCreateProperty} disabled={creatingProp} className="flex-1">
                  {creatingProp ? 'Creating...' : 'Add Property'}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto bg-[var(--pw-sage-soft)] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--pw-sage)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-heading text-xl text-[var(--pw-ink)]">You&apos;re All Set!</h3>
              <p className="text-[var(--pw-slate)]">
                Your PropWise AI account is ready. Next steps:
              </p>
              <ul className="text-sm text-[var(--pw-slate)] text-left space-y-2 pl-4">
                <li>1. Add units to your property</li>
                <li>2. Add tenants with their phone numbers</li>
                <li>3. Set up your Knowledge Base with property info</li>
                <li>4. Configure your Twilio number (in Settings)</li>
                <li>5. Your AI agent will start responding to tenant texts!</li>
              </ul>
              <Button onClick={handleFinish} className="w-full">Go to Dashboard</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
