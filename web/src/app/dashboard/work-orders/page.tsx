'use client';

import { useState, useMemo } from 'react';
import { orderBy } from 'firebase/firestore';
import { useCollection, useCallable } from '@/hooks/use-firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  tenantId: string;
  tenantName?: string;
  vendorId?: string;
  source: string;
  createdAt: any;
  notes: Array<{ body: string; authorName: string; createdAt: any }>;
}

interface Vendor {
  id: string;
  name: string;
  specialties: string[];
  isPreferred: boolean;
}

const priorityColors: Record<string, string> = {
  emergency: 'bg-red-100 text-red-800',
  high: 'bg-[#fce8e3] text-[var(--pw-accent)]',
  medium: 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]',
  low: 'bg-[var(--pw-warm)] text-[var(--pw-slate)]',
};

const statusColors: Record<string, string> = {
  new: 'bg-[var(--pw-warm)] text-[var(--pw-ink)]',
  assigned: 'bg-[var(--pw-accent-soft)]/30 text-[var(--pw-accent)]',
  scheduled: 'bg-[var(--pw-accent-soft)]/30 text-[var(--pw-accent)]',
  in_progress: 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]',
  completed: 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]',
  cancelled: 'bg-[var(--pw-warm)] text-[var(--pw-slate)]',
};

const priorityOrder: Record<string, number> = {
  emergency: 0, high: 1, medium: 2, low: 3,
};

const statusFilterOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const priorityFilterOptions = [
  { value: 'all', label: 'All Priority' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const categoryFilterOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'general', label: 'General' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'locksmith', label: 'Locksmith' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'priority', label: 'Priority (Emergency First)' },
];

export default function WorkOrdersPage() {
  const { data: workOrders, loading } = useCollection<WorkOrder>('workOrders', [
    orderBy('createdAt', 'desc'),
  ]);
  const { data: vendors } = useCollection<Vendor>('vendors');
  const { call: updateWorkOrder } = useCallable('updateWorkOrder');
  const [selectedWo, setSelectedWo] = useState<WorkOrder | null>(null);
  const [note, setNote] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const handleStatusChange = async (workOrderId: string, status: string) => {
    const result = await updateWorkOrder({ workOrderId, status });
    if (result) toast.success(`Status updated to ${status.replace('_', ' ')}`);
  };

  const handleVendorAssign = async (workOrderId: string, vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    const result = await updateWorkOrder({
      workOrderId,
      vendorId,
      status: 'assigned',
      assignedTo: vendor?.name,
    });
    if (result) toast.success(`Assigned to ${vendor?.name ?? 'vendor'}`);
  };

  const handleAddNote = async () => {
    if (!selectedWo || !note.trim()) return;
    const result = await updateWorkOrder({ workOrderId: selectedWo.id, note });
    if (result) {
      setNote('');
      toast.success('Note added');
    }
  };

  const getVendorName = (vendorId?: string) => {
    if (!vendorId) return null;
    return vendors.find((v) => v.id === vendorId)?.name ?? null;
  };

  const getMatchingVendors = (category: string) => {
    return vendors.filter((v) => v.specialties.includes(category) || v.specialties.includes('general'));
  };

  const filteredWorkOrders = useMemo(() => {
    let result = [...workOrders];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (wo) =>
          wo.title?.toLowerCase().includes(q) ||
          wo.description?.toLowerCase().includes(q) ||
          wo.tenantName?.toLowerCase().includes(q) ||
          wo.notes?.some((n) => n.body?.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') result = result.filter((wo) => wo.status === statusFilter);
    if (priorityFilter !== 'all') result = result.filter((wo) => wo.priority === priorityFilter);
    if (categoryFilter !== 'all') result = result.filter((wo) => wo.category === categoryFilter);

    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => (a.createdAt?.toDate?.()?.getTime() ?? 0) - (b.createdAt?.toDate?.()?.getTime() ?? 0));
        break;
      case 'priority':
        result.sort((a, b) => {
          const diff = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
          if (diff !== 0) return diff;
          return (b.createdAt?.toDate?.()?.getTime() ?? 0) - (a.createdAt?.toDate?.()?.getTime() ?? 0);
        });
        break;
      default:
        result.sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? 0) - (a.createdAt?.toDate?.()?.getTime() ?? 0));
    }

    return result;
  }, [workOrders, searchQuery, statusFilter, priorityFilter, categoryFilter, sortBy]);

  const openOrders = workOrders.filter((wo) => !['completed', 'cancelled'].includes(wo.status));
  const closedOrders = workOrders.filter((wo) => ['completed', 'cancelled'].includes(wo.status));
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-heading text-[var(--pw-ink)]">Work Orders</h1>
          <p className="text-[var(--pw-slate)] mt-1 text-sm">{openOrders.length} open, {closedOrders.length} closed</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 md:mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Search title, description, notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="sm:max-w-xs" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{statusFilterOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{priorityFilterOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{categoryFilterOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>{sortOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <p className="text-sm text-[var(--pw-slate)]">Showing {filteredWorkOrders.length} of {workOrders.length} work orders</p>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter('all'); setSortBy('newest'); }}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-[var(--pw-border)]"><CardContent className="pt-6"><div className="h-20 pw-skeleton" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkOrders.map((wo) => {
            const matching = getMatchingVendors(wo.category);
            const vendorName = getVendorName(wo.vendorId);
            return (
              <Card key={wo.id} className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-[var(--pw-ink)]">{wo.title}</h3>
                        <Badge className={priorityColors[wo.priority]}>{wo.priority}</Badge>
                        <Badge className={statusColors[wo.status]}>{wo.status.replace('_', ' ')}</Badge>
                        <Badge variant="outline" className="border-[var(--pw-border)]">{wo.category}</Badge>
                      </div>
                      <p className="text-sm text-[var(--pw-slate)]">{wo.description}</p>
                      {vendorName && (
                        <p className="text-sm text-[var(--pw-accent)] mt-1 font-medium">Assigned to: {vendorName}</p>
                      )}
                      <p className="text-xs text-[var(--pw-slate)]/70 mt-2">
                        Source: {wo.source} &middot; Created: {wo.createdAt?.toDate?.()?.toLocaleDateString() ?? 'N/A'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <Select value={wo.status} onValueChange={(v) => handleStatusChange(wo.id, v)}>
                          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['new', 'assigned', 'scheduled', 'in_progress', 'pending_parts', 'completed', 'cancelled'].map((s) => (
                              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-[var(--pw-border)]" onClick={() => { setSelectedWo(wo); setNote(''); }}>
                              Notes ({wo.notes?.length || 0})
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle className="font-heading">Work Order Notes</DialogTitle></DialogHeader>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {wo.notes?.map((n, i) => (
                                <div key={i} className="p-3 bg-[var(--pw-warm)] rounded-lg text-sm">
                                  <p className="text-[var(--pw-ink)]">{n.body}</p>
                                  <p className="text-xs text-[var(--pw-slate)] mt-1">{n.authorName}</p>
                                </div>
                              ))}
                              {(!wo.notes || wo.notes.length === 0) && <p className="text-sm text-[var(--pw-slate)]">No notes yet.</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Add Note</Label>
                              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                              <Button size="sm" onClick={handleAddNote}>Add Note</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      {/* Vendor Assignment */}
                      {!['completed', 'cancelled'].includes(wo.status) && (
                        <Select value={wo.vendorId ?? ''} onValueChange={(v) => handleVendorAssign(wo.id, v)}>
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Assign vendor..." />
                          </SelectTrigger>
                          <SelectContent>
                            {matching.length > 0 && (
                              <>
                                <SelectItem value="_label_matching" disabled>Matching ({wo.category})</SelectItem>
                                {matching.map((v) => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.isPreferred ? '⭐ ' : ''}{v.name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {vendors.filter((v) => !matching.find((m) => m.id === v.id)).length > 0 && (
                              <>
                                <SelectItem value="_label_other" disabled>Other vendors</SelectItem>
                                {vendors.filter((v) => !matching.find((m) => m.id === v.id)).map((v) => (
                                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                ))}
                              </>
                            )}
                            {vendors.length === 0 && (
                              <SelectItem value="_label_none" disabled>No vendors yet</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredWorkOrders.length === 0 && workOrders.length > 0 && (
            <Card className="border-[var(--pw-border)]"><CardContent className="pt-6 text-center text-[var(--pw-slate)]">No work orders match your filters.</CardContent></Card>
          )}
          {workOrders.length === 0 && (
            <Card className="border-[var(--pw-border)]"><CardContent className="pt-6 text-center text-[var(--pw-slate)]">No work orders yet. They&apos;ll appear when tenants report maintenance issues via SMS.</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
