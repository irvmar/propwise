'use client';

import { useState, useMemo } from 'react';
import { useCollection, useCallable } from '@/hooks/use-firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Property {
  id: string;
  name: string;
  address: { street: string; city: string; state: string; zip: string };
  type: string;
  unitCount: number;
}

interface Unit {
  id: string;
  propertyId: string;
  number: string;
  bedrooms?: number;
  bathrooms?: number;
  rentAmount: number;
  rentDueDay: number;
  status: string;
}

const typeFilterOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'multi_family', label: 'Multi-Family' },
  { value: 'single_family', label: 'Single Family' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'commercial', label: 'Commercial' },
];

const propertyTypes = ['single_family', 'multi_family', 'apartment', 'condo', 'townhouse', 'commercial'];

export default function PropertiesPage() {
  const { data: properties, loading } = useCollection<Property>('properties');
  const { data: units } = useCollection<Unit>('units');
  const { call: createProperty, loading: creating } = useCallable('createProperty');
  const { call: callUpdateProperty, loading: updating } = useCallable('updateProperty');
  const { call: callDeleteProperty, loading: deletingProperty } = useCallable('deleteProperty');
  const { call: createUnit, loading: creatingUnit } = useCallable('createUnit');
  const { call: callUpdateUnit, loading: updatingUnit } = useCallable('updateUnit');
  const { call: callDeleteUnit, loading: deletingUnit } = useCallable('deleteUnit');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  // Edit/Delete state
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [deleteProperty, setDeleteProperty] = useState<Property | null>(null);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<Unit | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [propForm, setPropForm] = useState({
    name: '', street: '', city: '', state: '', zip: '', type: 'multi_family' as string,
  });
  const [unitForm, setUnitForm] = useState({
    number: '', bedrooms: '', bathrooms: '', rentAmount: '', rentDueDay: '1',
  });

  // Edit forms
  const [editPropForm, setEditPropForm] = useState({
    name: '', street: '', city: '', state: '', zip: '', type: 'multi_family' as string,
  });
  const [editUnitForm, setEditUnitForm] = useState({
    number: '', bedrooms: '', bathrooms: '', rentAmount: '', rentDueDay: '1',
  });

  const handleAddProperty = async () => {
    const result = await createProperty({
      name: propForm.name,
      address: { street: propForm.street, city: propForm.city, state: propForm.state, zip: propForm.zip, country: 'US' },
      type: propForm.type,
    });
    if (result) {
      setShowAddProperty(false);
      setPropForm({ name: '', street: '', city: '', state: '', zip: '', type: 'multi_family' });
      toast.success('Property created successfully');
    }
  };

  const handleAddUnit = async () => {
    const result = await createUnit({
      propertyId: selectedPropertyId,
      number: unitForm.number,
      bedrooms: unitForm.bedrooms ? parseInt(unitForm.bedrooms) : undefined,
      bathrooms: unitForm.bathrooms ? parseFloat(unitForm.bathrooms) : undefined,
      rentAmount: parseFloat(unitForm.rentAmount),
      rentDueDay: parseInt(unitForm.rentDueDay),
    });
    if (result) {
      setShowAddUnit(false);
      setUnitForm({ number: '', bedrooms: '', bathrooms: '', rentAmount: '', rentDueDay: '1' });
      toast.success('Unit created successfully');
    }
  };

  const openEditProperty = (prop: Property) => {
    setEditPropForm({
      name: prop.name,
      street: prop.address.street,
      city: prop.address.city,
      state: prop.address.state,
      zip: prop.address.zip,
      type: prop.type,
    });
    setEditProperty(prop);
  };

  const handleEditProperty = async () => {
    if (!editProperty) return;
    const result = await callUpdateProperty({
      propertyId: editProperty.id,
      name: editPropForm.name,
      address: { street: editPropForm.street, city: editPropForm.city, state: editPropForm.state, zip: editPropForm.zip, country: 'US' },
      type: editPropForm.type,
    });
    if (result) {
      setEditProperty(null);
      toast.success('Property updated');
    }
  };

  const handleDeleteProperty = async () => {
    if (!deleteProperty) return;
    const result = await callDeleteProperty({ id: deleteProperty.id });
    if (result) {
      setDeleteProperty(null);
      toast.success('Property deleted');
    } else {
      toast.error('Failed to delete property. Remove all units first.');
    }
  };

  const openEditUnit = (unit: Unit) => {
    setEditUnitForm({
      number: unit.number,
      bedrooms: unit.bedrooms?.toString() ?? '',
      bathrooms: unit.bathrooms?.toString() ?? '',
      rentAmount: unit.rentAmount.toString(),
      rentDueDay: unit.rentDueDay.toString(),
    });
    setEditUnit(unit);
  };

  const handleEditUnit = async () => {
    if (!editUnit) return;
    const result = await callUpdateUnit({
      unitId: editUnit.id,
      number: editUnitForm.number,
      bedrooms: editUnitForm.bedrooms ? parseInt(editUnitForm.bedrooms) : undefined,
      bathrooms: editUnitForm.bathrooms ? parseFloat(editUnitForm.bathrooms) : undefined,
      rentAmount: parseFloat(editUnitForm.rentAmount),
      rentDueDay: parseInt(editUnitForm.rentDueDay),
    });
    if (result) {
      setEditUnit(null);
      toast.success('Unit updated');
    }
  };

  const handleDeleteUnit = async () => {
    if (!deleteUnit) return;
    const result = await callDeleteUnit({ id: deleteUnit.id });
    if (result) {
      setDeleteUnit(null);
      toast.success('Unit deleted');
    } else {
      toast.error('Failed to delete unit. It may have an active tenant.');
    }
  };

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((prop) => {
        const address = `${prop.address.street} ${prop.address.city} ${prop.address.state} ${prop.address.zip}`.toLowerCase();
        return (
          prop.name?.toLowerCase().includes(q) ||
          address.includes(q)
        );
      });
    }

    if (typeFilter !== 'all') {
      result = result.filter((prop) => prop.type === typeFilter);
    }

    return result;
  }, [properties, searchQuery, typeFilter]);

  const hasActiveFilters = searchQuery || typeFilter !== 'all';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-heading text-[var(--pw-ink)]">Properties</h1>
        <Dialog open={showAddProperty} onOpenChange={setShowAddProperty}>
          <DialogTrigger asChild>
            <Button>Add Property</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Add Property</DialogTitle></DialogHeader>
            <div className="space-y-5">
              <div className="space-y-2"><Label>Name</Label><Input value={propForm.name} onChange={(e) => setPropForm({ ...propForm, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Street</Label><Input value={propForm.street} onChange={(e) => setPropForm({ ...propForm, street: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>City</Label><Input value={propForm.city} onChange={(e) => setPropForm({ ...propForm, city: e.target.value })} /></div>
                <div className="space-y-2"><Label>State</Label><Input value={propForm.state} onChange={(e) => setPropForm({ ...propForm, state: e.target.value })} maxLength={2} /></div>
                <div className="space-y-2"><Label>ZIP</Label><Input value={propForm.zip} onChange={(e) => setPropForm({ ...propForm, zip: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={propForm.type} onValueChange={(v) => setPropForm({ ...propForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddProperty} disabled={creating} className="w-full">
                {creating ? 'Creating...' : 'Create Property'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter bar */}
      <div className="mb-4 md:mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeFilterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <p className="text-sm text-[var(--pw-slate)]">
              Showing {filteredProperties.length} of {properties.length} properties
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => { setSearchQuery(''); setTypeFilter('all'); }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-[var(--pw-border)]"><CardContent className="pt-6"><div className="h-32 pw-skeleton" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          {filteredProperties.map((prop) => {
            const propUnits = units.filter((u) => u.propertyId === prop.id);
            return (
              <Card key={prop.id} className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-heading">{prop.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-[var(--pw-border)]">{prop.type.replace('_', ' ')}</Badge>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditProperty(prop)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => setDeleteProperty(prop)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--pw-slate)]">
                    {prop.address.street}, {prop.address.city}, {prop.address.state} {prop.address.zip}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-[var(--pw-slate)]">{propUnits.length} units</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[var(--pw-border)]"
                      onClick={() => { setSelectedPropertyId(prop.id); setShowAddUnit(true); }}
                    >
                      Add Unit
                    </Button>
                  </div>
                  {propUnits.length > 0 && (
                    <div className="space-y-2">
                      {propUnits.map((unit) => (
                        <div key={unit.id} className="flex items-center justify-between p-4 bg-[var(--pw-warm)] rounded-lg text-sm">
                          <span className="text-[var(--pw-ink)]">Unit {unit.number}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--pw-slate)]">${unit.rentAmount}/mo</span>
                            <Badge className={unit.status === 'occupied' ? 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]' : 'bg-[var(--pw-warm)] text-[var(--pw-slate)]'}>
                              {unit.status}
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditUnit(unit)}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={() => setDeleteUnit(unit)}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {filteredProperties.length === 0 && properties.length > 0 && (
            <Card className="col-span-full border-[var(--pw-border)]">
              <CardContent className="pt-6 text-center text-[var(--pw-slate)]">
                No properties match your filters.
              </CardContent>
            </Card>
          )}
          {properties.length === 0 && (
            <Card className="col-span-full border-[var(--pw-border)]">
              <CardContent className="pt-6 text-center text-[var(--pw-slate)]">
                No properties yet. Add your first property to get started.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Unit Dialog */}
      <Dialog open={showAddUnit} onOpenChange={setShowAddUnit}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Add Unit</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2"><Label>Unit Number</Label><Input value={unitForm.number} onChange={(e) => setUnitForm({ ...unitForm, number: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Bedrooms</Label><Input type="number" value={unitForm.bedrooms} onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })} /></div>
              <div className="space-y-2"><Label>Bathrooms</Label><Input type="number" step="0.5" value={unitForm.bathrooms} onChange={(e) => setUnitForm({ ...unitForm, bathrooms: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Rent Amount ($)</Label><Input type="number" value={unitForm.rentAmount} onChange={(e) => setUnitForm({ ...unitForm, rentAmount: e.target.value })} /></div>
              <div className="space-y-2"><Label>Rent Due Day</Label><Input type="number" min="1" max="28" value={unitForm.rentDueDay} onChange={(e) => setUnitForm({ ...unitForm, rentDueDay: e.target.value })} /></div>
            </div>
            <Button onClick={handleAddUnit} disabled={creatingUnit} className="w-full">
              {creatingUnit ? 'Creating...' : 'Create Unit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={!!editProperty} onOpenChange={(open) => !open && setEditProperty(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Edit Property</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2"><Label>Name</Label><Input value={editPropForm.name} onChange={(e) => setEditPropForm({ ...editPropForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Street</Label><Input value={editPropForm.street} onChange={(e) => setEditPropForm({ ...editPropForm, street: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>City</Label><Input value={editPropForm.city} onChange={(e) => setEditPropForm({ ...editPropForm, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>State</Label><Input value={editPropForm.state} onChange={(e) => setEditPropForm({ ...editPropForm, state: e.target.value })} maxLength={2} /></div>
              <div className="space-y-2"><Label>ZIP</Label><Input value={editPropForm.zip} onChange={(e) => setEditPropForm({ ...editPropForm, zip: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={editPropForm.type} onValueChange={(v) => setEditPropForm({ ...editPropForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleEditProperty} disabled={updating} className="w-full">
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Property Confirmation */}
      <Dialog open={!!deleteProperty} onOpenChange={(open) => !open && setDeleteProperty(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteProperty?.name}&quot;? This action cannot be undone. All units must be removed first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProperty(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProperty} disabled={deletingProperty}>
              {deletingProperty ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={!!editUnit} onOpenChange={(open) => !open && setEditUnit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Edit Unit</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2"><Label>Unit Number</Label><Input value={editUnitForm.number} onChange={(e) => setEditUnitForm({ ...editUnitForm, number: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Bedrooms</Label><Input type="number" value={editUnitForm.bedrooms} onChange={(e) => setEditUnitForm({ ...editUnitForm, bedrooms: e.target.value })} /></div>
              <div className="space-y-2"><Label>Bathrooms</Label><Input type="number" step="0.5" value={editUnitForm.bathrooms} onChange={(e) => setEditUnitForm({ ...editUnitForm, bathrooms: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Rent Amount ($)</Label><Input type="number" value={editUnitForm.rentAmount} onChange={(e) => setEditUnitForm({ ...editUnitForm, rentAmount: e.target.value })} /></div>
              <div className="space-y-2"><Label>Rent Due Day</Label><Input type="number" min="1" max="28" value={editUnitForm.rentDueDay} onChange={(e) => setEditUnitForm({ ...editUnitForm, rentDueDay: e.target.value })} /></div>
            </div>
            <Button onClick={handleEditUnit} disabled={updatingUnit} className="w-full">
              {updatingUnit ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Confirmation */}
      <Dialog open={!!deleteUnit} onOpenChange={(open) => !open && setDeleteUnit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Delete Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Unit {deleteUnit?.number}? Units with active tenants cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUnit(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUnit} disabled={deletingUnit}>
              {deletingUnit ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
