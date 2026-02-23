'use client';

import { useState, useMemo } from 'react';
import { useCollection, useCallable } from '@/hooks/use-firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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

export default function PropertiesPage() {
  const { data: properties, loading } = useCollection<Property>('properties');
  const { data: units } = useCollection<Unit>('units');
  const { call: createProperty, loading: creating } = useCallable('createProperty');
  const { call: createUnit, loading: creatingUnit } = useCallable('createUnit');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [propForm, setPropForm] = useState({
    name: '', street: '', city: '', state: '', zip: '', type: 'multi_family' as string,
  });
  const [unitForm, setUnitForm] = useState({
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
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={propForm.name} onChange={(e) => setPropForm({ ...propForm, name: e.target.value })} /></div>
              <div><Label>Street</Label><Input value={propForm.street} onChange={(e) => setPropForm({ ...propForm, street: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>City</Label><Input value={propForm.city} onChange={(e) => setPropForm({ ...propForm, city: e.target.value })} /></div>
                <div><Label>State</Label><Input value={propForm.state} onChange={(e) => setPropForm({ ...propForm, state: e.target.value })} maxLength={2} /></div>
                <div><Label>ZIP</Label><Input value={propForm.zip} onChange={(e) => setPropForm({ ...propForm, zip: e.target.value })} /></div>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={propForm.type} onValueChange={(v) => setPropForm({ ...propForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['single_family', 'multi_family', 'apartment', 'condo', 'townhouse', 'commercial'].map((t) => (
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
                    <Badge variant="outline" className="border-[var(--pw-border)]">{prop.type.replace('_', ' ')}</Badge>
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
                        <div key={unit.id} className="flex items-center justify-between p-2 bg-[var(--pw-warm)] rounded-lg text-sm">
                          <span className="text-[var(--pw-ink)]">Unit {unit.number}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--pw-slate)]">${unit.rentAmount}/mo</span>
                            <Badge className={unit.status === 'occupied' ? 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]' : 'bg-[var(--pw-warm)] text-[var(--pw-slate)]'}>
                              {unit.status}
                            </Badge>
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
          <div className="space-y-4">
            <div><Label>Unit Number</Label><Input value={unitForm.number} onChange={(e) => setUnitForm({ ...unitForm, number: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Bedrooms</Label><Input type="number" value={unitForm.bedrooms} onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })} /></div>
              <div><Label>Bathrooms</Label><Input type="number" step="0.5" value={unitForm.bathrooms} onChange={(e) => setUnitForm({ ...unitForm, bathrooms: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Rent Amount ($)</Label><Input type="number" value={unitForm.rentAmount} onChange={(e) => setUnitForm({ ...unitForm, rentAmount: e.target.value })} /></div>
              <div><Label>Rent Due Day</Label><Input type="number" min="1" max="28" value={unitForm.rentDueDay} onChange={(e) => setUnitForm({ ...unitForm, rentDueDay: e.target.value })} /></div>
            </div>
            <Button onClick={handleAddUnit} disabled={creatingUnit} className="w-full">
              {creatingUnit ? 'Creating...' : 'Create Unit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
