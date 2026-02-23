'use client';

import { useState } from 'react';
import { useCollection, useCallable } from '@/hooks/use-firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Vendor {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  specialties: string[];
  hourlyRate?: number;
  isPreferred: boolean;
}

const specialtyOptions = [
  'plumbing', 'electrical', 'hvac', 'appliance', 'structural',
  'pest_control', 'landscaping', 'cleaning', 'painting',
  'flooring', 'roofing', 'locksmith', 'general',
];

export default function VendorsPage() {
  const { data: vendors, loading } = useCollection<Vendor>('vendors');
  const { call: createVendor, loading: creating } = useCallable('createVendor');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '', hourlyRate: '',
    specialties: [] as string[], isPreferred: false,
  });

  const toggleSpecialty = (s: string) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter((x) => x !== s)
        : [...prev.specialties, s],
    }));
  };

  const handleAdd = async () => {
    const result = await createVendor({
      name: form.name,
      company: form.company || undefined,
      phone: form.phone,
      email: form.email || undefined,
      specialties: form.specialties,
      hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
      isPreferred: form.isPreferred,
    });
    if (result) {
      setShowAdd(false);
      setForm({ name: '', company: '', phone: '', email: '', hourlyRate: '', specialties: [], isPreferred: false });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-heading text-[var(--pw-ink)]">Vendors</h1>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button>Add Vendor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Add Vendor</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Company (optional)</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
              <div><Label>Phone (E.164)</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+15551234567" /></div>
              <div><Label>Email (optional)</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Hourly Rate ($)</Label><Input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} /></div>
              <div>
                <Label>Specialties</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {specialtyOptions.map((s) => (
                    <Badge
                      key={s}
                      variant={form.specialties.includes(s) ? 'default' : 'outline'}
                      className={`cursor-pointer ${form.specialties.includes(s) ? '' : 'border-[var(--pw-border)]'}`}
                      onClick={() => toggleSpecialty(s)}
                    >
                      {s.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={handleAdd} disabled={creating || form.specialties.length === 0} className="w-full">
                {creating ? 'Creating...' : 'Add Vendor'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Card key={i} className="border-[var(--pw-border)]"><CardContent className="pt-6"><div className="h-16 pw-skeleton" /></CardContent></Card>)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vendors.map((v) => (
            <Card key={v.id} className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-[var(--pw-ink)]">{v.name}</h3>
                    {v.company && <p className="text-sm text-[var(--pw-slate)]">{v.company}</p>}
                    <p className="text-sm text-[var(--pw-slate)] mt-1">{v.phone}</p>
                    {v.hourlyRate && <p className="text-sm text-[var(--pw-slate)]">${v.hourlyRate}/hr</p>}
                  </div>
                  {v.isPreferred && <Badge className="bg-[var(--pw-accent-soft)]/30 text-[var(--pw-accent)]">Preferred</Badge>}
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {v.specialties.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs border-[var(--pw-border)]">{s.replace('_', ' ')}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {vendors.length === 0 && (
            <Card className="col-span-full border-[var(--pw-border)]"><CardContent className="pt-6 text-center text-[var(--pw-slate)]">No vendors yet. Add your maintenance vendors here.</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
