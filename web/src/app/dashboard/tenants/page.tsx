'use client';

import { useState, useMemo } from 'react';
import { useCollection, useCallable } from '@/hooks/use-firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  propertyId: string;
  unitId: string;
  rentAmount: number;
  balance: number;
  status: string;
  leaseStart: string;
  leaseEnd: string;
  createdAt?: any;
}

interface Property { id: string; name: string; }
interface Unit { id: string; propertyId: string; number: string; }

const statusFilterOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'past', label: 'Past' },
];

const sortOptions = [
  { value: 'name_az', label: 'Name A-Z' },
  { value: 'name_za', label: 'Name Z-A' },
  { value: 'recent', label: 'Most Recent' },
];

export default function TenantsPage() {
  const { data: tenants, loading } = useCollection<Tenant>('tenants');
  const { data: properties } = useCollection<Property>('properties');
  const { data: units } = useCollection<Unit>('units');
  const { call: createTenant, loading: creating } = useCallable('createTenant');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    propertyId: '', unitId: '', rentAmount: '', leaseStart: '', leaseEnd: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_az');

  const handleAdd = async () => {
    const result = await createTenant({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email || undefined,
      propertyId: form.propertyId,
      unitId: form.unitId,
      rentAmount: parseFloat(form.rentAmount),
      leaseStart: form.leaseStart,
      leaseEnd: form.leaseEnd,
    });
    if (result) {
      setShowAdd(false);
      setForm({ firstName: '', lastName: '', phone: '', email: '', propertyId: '', unitId: '', rentAmount: '', leaseStart: '', leaseEnd: '' });
    }
  };

  const formFilteredUnits = units.filter((u) => u.propertyId === form.propertyId);

  const getPropertyName = (propId: string) => properties.find((p) => p.id === propId)?.name ?? 'N/A';
  const getUnitNumber = (unitId: string) => units.find((u) => u.id === unitId)?.number ?? 'N/A';

  const filteredTenants = useMemo(() => {
    let result = [...tenants];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => {
        const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
        const unitNumber = getUnitNumber(t.unitId).toLowerCase();
        return (
          fullName.includes(q) ||
          t.phone?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q) ||
          unitNumber.includes(q)
        );
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    switch (sortBy) {
      case 'name_za':
        result.sort((a, b) => {
          const aName = `${a.lastName} ${a.firstName}`.toLowerCase();
          const bName = `${b.lastName} ${b.firstName}`.toLowerCase();
          return bName.localeCompare(aName);
        });
        break;
      case 'recent':
        result.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
          return bTime - aTime;
        });
        break;
      case 'name_az':
      default:
        result.sort((a, b) => {
          const aName = `${a.lastName} ${a.firstName}`.toLowerCase();
          const bName = `${b.lastName} ${b.firstName}`.toLowerCase();
          return aName.localeCompare(bName);
        });
        break;
    }

    return result;
  }, [tenants, searchQuery, statusFilter, sortBy, units]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-heading text-[var(--pw-ink)]">Tenants</h1>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button>Add Tenant</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">Add Tenant</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>First Name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                <div><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
              </div>
              <div><Label>Phone (E.164)</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+15551234567" /></div>
              <div><Label>Email (optional)</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div>
                <Label>Property</Label>
                <Select value={form.propertyId} onValueChange={(v) => setForm({ ...form, propertyId: v, unitId: '' })}>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={form.unitId} onValueChange={(v) => setForm({ ...form, unitId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    {formFilteredUnits.map((u) => <SelectItem key={u.id} value={u.id}>Unit {u.number}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Rent Amount ($)</Label><Input type="number" value={form.rentAmount} onChange={(e) => setForm({ ...form, rentAmount: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Lease Start</Label><Input type="date" value={form.leaseStart} onChange={(e) => setForm({ ...form, leaseStart: e.target.value })} /></div>
                <div><Label>Lease End</Label><Input type="date" value={form.leaseEnd} onChange={(e) => setForm({ ...form, leaseEnd: e.target.value })} /></div>
              </div>
              <Button onClick={handleAdd} disabled={creating} className="w-full">
                {creating ? 'Creating...' : 'Add Tenant'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter bar */}
      <div className="mb-4 md:mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search name, phone, email, unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {statusFilterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <p className="text-sm text-[var(--pw-slate)]">
              Showing {filteredTenants.length} of {tenants.length} tenants
            </p>
            <Button variant="ghost" size="sm" className="text-xs h-7"
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); setSortBy('name_az'); }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="border-[var(--pw-border)]"><CardContent className="pt-6"><div className="h-16 pw-skeleton" /></CardContent></Card>)}</div>
      ) : (
        <div className="space-y-3">
          {filteredTenants.map((t) => (
            <Card key={t.id} className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[var(--pw-ink)]">{t.firstName} {t.lastName}</h3>
                    <p className="text-sm text-[var(--pw-slate)]">{t.phone} {t.email && `| ${t.email}`}</p>
                    <p className="text-xs text-[var(--pw-slate)]/70 mt-1">
                      {getPropertyName(t.propertyId)} &middot; Unit {getUnitNumber(t.unitId)} &middot; ${t.rentAmount}/mo
                    </p>
                  </div>
                  <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
                    <Badge className={t.status === 'active' ? 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]' : 'bg-[var(--pw-warm)] text-[var(--pw-slate)]'}>
                      {t.status}
                    </Badge>
                    {t.balance > 0 && (
                      <p className="text-sm text-red-600">Balance: ${t.balance.toFixed(2)}</p>
                    )}
                    <p className="text-xs text-[var(--pw-slate)]/70">Lease: {t.leaseStart} to {t.leaseEnd}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredTenants.length === 0 && tenants.length > 0 && (
            <Card className="border-[var(--pw-border)]"><CardContent className="pt-6 text-center text-[var(--pw-slate)]">No tenants match your filters.</CardContent></Card>
          )}
          {tenants.length === 0 && (
            <Card className="border-[var(--pw-border)]"><CardContent className="pt-6 text-center text-[var(--pw-slate)]">No tenants yet. Add properties and units first, then add tenants.</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
