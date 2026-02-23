'use client';

import { useState } from 'react';
import { useCollection, useCallable } from '@/hooks/use-firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
}

const categories = [
  'policies', 'faq', 'maintenance', 'lease',
  'amenities', 'community', 'emergency', 'payments', 'other',
];

export default function KnowledgeBasePage() {
  const { data: entries, loading } = useCollection<KnowledgeBase>('knowledgeBase');
  const { call: createEntry, loading: creating } = useCallable('createKnowledgeBaseEntry');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'faq' });

  const handleAdd = async () => {
    const result = await createEntry({ ...form, isActive: true });
    if (result) {
      setShowAdd(false);
      setForm({ title: '', content: '', category: 'faq' });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-heading text-[var(--pw-ink)]">Knowledge Base</h1>
          <p className="text-[var(--pw-slate)] mt-1 text-sm">The AI uses this to answer tenant questions.</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button>Add Entry</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Add Knowledge Base Entry</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Pet Policy" /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={6}
                  placeholder="Write the information the AI should know about this topic..."
                />
              </div>
              <Button onClick={handleAdd} disabled={creating} className="w-full">
                {creating ? 'Creating...' : 'Add Entry'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Card key={i} className="border-[var(--pw-border)]"><CardContent className="pt-6"><div className="h-24 pw-skeleton" /></CardContent></Card>)}</div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="border-[var(--pw-border)] shadow-[0_2px_8px_rgba(26,23,20,0.04)]">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                  <h3 className="font-semibold text-[var(--pw-ink)]">{entry.title}</h3>
                  <div className="flex gap-2 shrink-0">
                    <Badge variant="outline" className="border-[var(--pw-border)]">{entry.category}</Badge>
                    <Badge className={entry.isActive ? 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]' : 'bg-[var(--pw-warm)] text-[var(--pw-slate)]'}>
                      {entry.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-[var(--pw-slate)] whitespace-pre-wrap">{entry.content}</p>
              </CardContent>
            </Card>
          ))}
          {entries.length === 0 && (
            <Card className="border-[var(--pw-border)]"><CardContent className="pt-6 text-center text-[var(--pw-slate)]">
              No entries yet. Add property policies, FAQs, and payment info so the AI can answer tenant questions accurately.
            </CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
