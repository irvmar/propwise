'use client';

import { useState } from 'react';
import { useCollection, useCallable } from '@/hooks/use-firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
  const { call: callUpdateEntry, loading: updatingEntry } = useCallable('updateKnowledgeBaseEntry');
  const { call: callDeleteEntry, loading: deletingEntry } = useCallable('deleteKnowledgeBaseEntry');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'faq' });

  // Edit/Delete state
  const [editEntry, setEditEntry] = useState<KnowledgeBase | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<KnowledgeBase | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', category: 'faq', isActive: true });

  const handleAdd = async () => {
    const result = await createEntry({ ...form, isActive: true });
    if (result) {
      setShowAdd(false);
      setForm({ title: '', content: '', category: 'faq' });
      toast.success('Entry added to knowledge base');
    }
  };

  const openEditEntry = (entry: KnowledgeBase) => {
    setEditForm({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      isActive: entry.isActive,
    });
    setEditEntry(entry);
  };

  const handleEditEntry = async () => {
    if (!editEntry) return;
    const result = await callUpdateEntry({
      entryId: editEntry.id,
      title: editForm.title,
      content: editForm.content,
      category: editForm.category,
      isActive: editForm.isActive,
    });
    if (result) {
      setEditEntry(null);
      toast.success('Entry updated');
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteEntry) return;
    const result = await callDeleteEntry({ id: deleteEntry.id });
    if (result) {
      setDeleteEntry(null);
      toast.success('Entry deleted');
    }
  };

  const handleToggleActive = async (entry: KnowledgeBase) => {
    const result = await callUpdateEntry({
      entryId: entry.id,
      isActive: !entry.isActive,
    });
    if (result) {
      toast.success(entry.isActive ? 'Entry deactivated' : 'Entry activated');
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
            <div className="space-y-5">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Pet Policy" /></div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
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
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="border-[var(--pw-border)]">{entry.category}</Badge>
                    <Badge
                      className={`cursor-pointer ${entry.isActive ? 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]' : 'bg-[var(--pw-warm)] text-[var(--pw-slate)]'}`}
                      onClick={() => handleToggleActive(entry)}
                    >
                      {entry.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditEntry(entry)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => setDeleteEntry(entry)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </Button>
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

      {/* Edit Entry Dialog */}
      <Dialog open={!!editEntry} onOpenChange={(open) => !open && setEditEntry(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Edit Knowledge Base Entry</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} rows={6} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="editActive" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} className="rounded" />
              <Label htmlFor="editActive">Active (AI can use this entry)</Label>
            </div>
            <Button onClick={handleEditEntry} disabled={updatingEntry} className="w-full">
              {updatingEntry ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Entry Confirmation */}
      <Dialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteEntry?.title}&quot;? The AI will no longer be able to reference this information.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEntry(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteEntry} disabled={deletingEntry}>
              {deletingEntry ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
