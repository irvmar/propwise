'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  collection, query, where, orderBy, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useCallable } from '@/hooks/use-firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  tenantName: string;
  tenantPhone: string;
  unitNumber: string;
  status: string;
  lastMessagePreview: string;
  lastMessageAt: Timestamp;
  unreadCount: number;
  isEscalated: boolean;
  type?: string;
  propertyId?: string;
}

interface Message {
  id: string;
  body: string;
  direction: string;
  sender: string;
  intent?: string;
  createdAt: Timestamp;
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
];

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'unread', label: 'Unread First' },
];

export default function InboxPage() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [showThread, setShowThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { call: sendSms, loading: sending } = useCallable('sendManualSms');
  const { call: callArchive, loading: archiving } = useCallable('archiveConversation');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    if (!profile?.organizationId) return;
    const q = query(
      collection(firestore, 'conversations'),
      where('organizationId', '==', profile.organizationId),
      orderBy('lastMessageAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation)));
    });
  }, [profile?.organizationId]);

  useEffect(() => {
    if (!selectedConv) return;
    const q = query(
      collection(firestore, 'messages'),
      where('conversationId', '==', selectedConv),
      orderBy('createdAt', 'asc'),
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [selectedConv]);

  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (conv) =>
          conv.tenantName?.toLowerCase().includes(q) ||
          conv.tenantPhone?.toLowerCase().includes(q) ||
          conv.lastMessagePreview?.toLowerCase().includes(q) ||
          conv.unitNumber?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'escalated') {
        result = result.filter((conv) => conv.isEscalated);
      } else {
        result = result.filter((conv) => conv.status === statusFilter);
      }
    }

    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => (a.lastMessageAt?.toDate?.()?.getTime() ?? 0) - (b.lastMessageAt?.toDate?.()?.getTime() ?? 0));
        break;
      case 'unread':
        result.sort((a, b) => {
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
          if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
          return (b.lastMessageAt?.toDate?.()?.getTime() ?? 0) - (a.lastMessageAt?.toDate?.()?.getTime() ?? 0);
        });
        break;
      default:
        result.sort((a, b) => (b.lastMessageAt?.toDate?.()?.getTime() ?? 0) - (a.lastMessageAt?.toDate?.()?.getTime() ?? 0));
    }

    return result;
  }, [conversations, searchQuery, statusFilter, sortBy]);

  const handleSend = async () => {
    if (!reply.trim() || !selectedConv) return;
    const result = await sendSms({ conversationId: selectedConv, body: reply });
    if (result) {
      setReply('');
      toast.success('Message sent');
    }
  };

  const handleArchive = async (convId: string, newStatus: 'resolved' | 'active') => {
    const result = await callArchive({ conversationId: convId, status: newStatus });
    if (result) {
      toast.success(newStatus === 'resolved' ? 'Conversation resolved' : 'Conversation reopened');
    }
  };

  const handleSelectConversation = (convId: string) => {
    setSelectedConv(convId);
    setShowThread(true);
  };

  const handleBackToList = () => {
    setShowThread(false);
  };

  const formatTime = (ts: Timestamp) => {
    if (!ts?.toDate) return '';
    const d = ts.toDate();
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getStatusDot = (conv: Conversation) => {
    if (conv.isEscalated) return 'bg-red-500';
    if (conv.unreadCount > 0) return 'bg-[var(--pw-accent)]';
    if (conv.status === 'active') return 'bg-[var(--pw-sage)]';
    return 'bg-[var(--pw-border)]';
  };

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading text-[var(--pw-ink)] mb-4 md:mb-6">Inbox</h1>
      <div className="flex gap-4 h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]">
        {/* Conversation list */}
        <Card className={cn(
          'w-full md:w-80 md:shrink-0 flex flex-col border-[var(--pw-border)]',
          showThread ? 'hidden md:flex' : 'flex',
        )}>
          <div className="p-3 border-b border-[var(--pw-border)] space-y-2">
            <Input placeholder="Search name, phone, message..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 text-sm" />
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>{sortOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-[11px] text-[var(--pw-slate)]">Showing {filteredConversations.length} of {conversations.length}</p>
          </div>
          <ScrollArea className="flex-1">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={cn(
                  'w-full text-left p-4 border-b border-[var(--pw-border)] hover:bg-[var(--pw-warm)] transition-colors',
                  selectedConv === conv.id && 'bg-[var(--pw-warm)]',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', getStatusDot(conv))} />
                    <span className="font-medium text-sm text-[var(--pw-ink)]">{conv.tenantName}</span>
                  </div>
                  <span className="text-xs text-[var(--pw-slate)]">{formatTime(conv.lastMessageAt)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[var(--pw-slate)]">Unit {conv.unitNumber}</span>
                  {conv.isEscalated && <Badge variant="destructive" className="text-[10px] px-1 py-0">Escalated</Badge>}
                  {conv.status === 'resolved' && <Badge variant="outline" className="text-[10px] px-1 py-0 border-[var(--pw-border)]">Resolved</Badge>}
                  {conv.unreadCount > 0 && (
                    <span className="ml-auto bg-[var(--pw-accent)] text-white text-[10px] px-1.5 py-0.5 rounded-full">{conv.unreadCount}</span>
                  )}
                </div>
                <p className="text-xs text-[var(--pw-slate)] mt-1 truncate">{conv.lastMessagePreview}</p>
              </button>
            ))}
            {filteredConversations.length === 0 && conversations.length > 0 && (
              <div className="p-8 text-center text-[var(--pw-slate)] text-sm">No conversations match your filters.</div>
            )}
            {conversations.length === 0 && (
              <div className="p-8 text-center text-[var(--pw-slate)] text-sm">No conversations yet. They&apos;ll appear when tenants text in.</div>
            )}
          </ScrollArea>
        </Card>

        {/* Message thread */}
        <Card className={cn(
          'flex-1 flex flex-col border-[var(--pw-border)]',
          showThread ? 'flex' : 'hidden md:flex',
        )}>
          {selectedConv ? (
            <>
              <div className="p-4 border-b border-[var(--pw-border)]">
                {(() => {
                  const conv = conversations.find((c) => c.id === selectedConv);
                  return conv ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={handleBackToList} className="md:hidden p-1 -ml-1 rounded-lg hover:bg-[var(--pw-warm)] transition-colors" aria-label="Back">
                          <svg className="w-5 h-5 text-[var(--pw-ink)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                          <h2 className="font-semibold text-[var(--pw-ink)]">{conv.tenantName}</h2>
                          <p className="text-sm text-[var(--pw-slate)]">{conv.tenantPhone} &middot; Unit {conv.unitNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {conv.isEscalated && <Badge variant="destructive">Escalated</Badge>}
                        {conv.status && !conv.isEscalated && (
                          <Badge className={conv.status === 'active' ? 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]' : conv.status === 'resolved' ? 'bg-[var(--pw-warm)] text-[var(--pw-slate)]' : ''}>
                            {conv.status}
                          </Badge>
                        )}
                        {conv.status === 'active' || conv.isEscalated ? (
                          <Button size="sm" variant="outline" className="border-[var(--pw-border)] text-xs" onClick={() => handleArchive(conv.id, 'resolved')} disabled={archiving}>
                            {archiving ? '...' : 'Resolve'}
                          </Button>
                        ) : conv.status === 'resolved' ? (
                          <Button size="sm" variant="outline" className="border-[var(--pw-border)] text-xs" onClick={() => handleArchive(conv.id, 'active')} disabled={archiving}>
                            {archiving ? '...' : 'Reopen'}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'max-w-[85%] md:max-w-[70%] p-3 rounded-2xl text-sm',
                        msg.direction === 'inbound'
                          ? 'bg-[var(--pw-warm)] text-[var(--pw-ink)] mr-auto rounded-bl-sm'
                          : 'bg-[var(--pw-accent)] text-white ml-auto rounded-br-sm',
                      )}
                    >
                      <p>{msg.body}</p>
                      <div className={cn('text-[10px] mt-1 flex items-center gap-2', msg.direction === 'inbound' ? 'text-[var(--pw-slate)]' : 'text-white/70')}>
                        <span>{formatTime(msg.createdAt)}</span>
                        {msg.sender === 'ai' && (
                          <span className={cn('px-1 py-0.5 rounded text-[9px] font-medium', msg.direction === 'inbound' ? 'bg-[var(--pw-sage-soft)] text-[var(--pw-sage)]' : 'bg-white/20 text-white')}>AI</span>
                        )}
                        {msg.intent && <span>{msg.intent}</span>}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-3 md:p-4 border-t border-[var(--pw-border)]">
                <div className="flex gap-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type a reply..."
                    className="resize-none text-sm"
                    rows={2}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                  <Button onClick={handleSend} disabled={sending || !reply.trim()} className="self-end">
                    {sending ? '...' : 'Send'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--pw-slate)] gap-2">
              <svg className="w-12 h-12 text-[var(--pw-border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm">Select a conversation to view messages</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
