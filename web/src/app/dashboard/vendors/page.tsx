'use client';

import { useState } from 'react';
import { useCollection, useCallable } from '@/hooks/use-firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
  const { call: callUpdateVendor, loading: updatingVendor } = useCallable('updateVendor');
  const { call: callDeleteVendor, loading: deletingVendor } = useCallable('deleteVendor');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '', hourlyRate: '',
    specialties: [] as string[], isPreferred: false,
  });

  // Edit/Delete state
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [deleteVendor, setDeleteVendor] = useState<Vendor | null>(null);
  const [editForm, setEditForm] = useState({
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

  const toggleEditSpecialty = (s: string) => {
    setEditForm((prev) => ({
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
      toast.success('Vendor added successfully');
    }
  };

  const openEditVendor = (v: Vendor) => {
    setEditForm({
      name: v.name,
      company: v.company ?? '',
      phone: v.phone,
      email: v.email ?? '',
      hourlyRate: v.hourlyRate?.toString() ?? '',
      specialties: [...v.specialties],
      isPreferred: v.isPreferred,
    });
    setEditVendor(v);
  };

  const handleEditVendor = async () => {
    if (!editVendor) return;
    const result = await callUpdateVendor({
      vendorId: editVendor.id,
      name: editForm.name,
      company: editForm.company || undefined,
      phone: editForm.phone,
      email: editForm.email || undefined,
      specialties: editForm.specialties,
      hourlyRate: editForm.hourlyRate ? parseFloat(editForm.hourlyRate) : undefined,
      isPreferred: editForm.isPreferred,
    });
    if (result) {
      setEditVendor(null);
      toast.success('Vendor updated');
    }
  };

  const handleDeleteVendor = async () => {
    if (!deleteVendor) return;
    const result = await callDeleteVendor({ id: deleteVendor.id });
    if (result) {
      setDeleteVendor(null);
      toast.success('Vendor deleted');
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
              <div className="flex items-center gap-2">
                <input type="checkbox" id="preferred" checked={form.isPreferred} onChange={(e) => setForm({ ...form, isPreferred: e.target.checked })} className="rounded" />
                <Label htmlFor="preferred">Preferred vendor</Label>
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
                    {v.email && <p className="text-sm text-[var(--pw-slate)]">{v.email}</p>}
                    {v.hourlyRate && <p className="text-sm text-[var(--pw-slate)]">${v.hourlyRate}/hr</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {v.isPreferred && <Badge className="bg-[var(--pw-accent-soft)]/30 text-[var(--pw-accent)]">Preferred</Badge>}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditVendor(v)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => setDeleteVendor(v)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </Button>
                  </div>
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

      {/* Edit Vendor Dialog */}
      <Dialog open={!!editVendor} onOpenChange={(open) => !open && setEditVendor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Edit Vendor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><Label>Company</Label><Input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} /></div>
            <div><Label>Phone (E.164)</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div><Label>Hourly Rate ($)</Label><Input type="number" value={editForm.hourlyRate} onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })} /></div>
            <div>
              <Label>Specialties</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {specialtyOptions.map((s) => (
                  <Badge
                    key={s}
                    variant={editForm.specialties.includes(s) ? 'default' : 'outline'}
                    className={`cursor-pointer ${editForm.specialties.includes(s) ? '' : 'border-[var(--pw-border)]'}`}
                    onClick={() => toggleEditSpecialty(s)}
                  >
                    {s.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="editPreferred" checked={editForm.isPreferred} onChange={(e) => setEditForm({ ...editForm, isPreferred: e.target.checked })} className="rounded" />
              <Label htmlFor="editPreferred">Preferred vendor</Label>
            </div>
            <Button onClick={handleEditVendor} disabled={updatingVendor || editForm.specialties.length === 0} className="w-full">
              {updatingVendor ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Vendor Confirmation */}
      <Dialog open={!!deleteVendor} onOpenChange={(open) => !open && setDeleteVendor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteVendor?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVendor(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteVendor} disabled={deletingVendor}>
              {deletingVendor ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
