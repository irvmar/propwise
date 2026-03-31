'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, functions } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';

export function useCollection<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
) {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  // Serialize constraints to a stable string for the dependency array.
  // This ensures the listener re-subscribes when constraints change.
  const constraintsKey = JSON.stringify(constraints.map((c) => `${c}`));

  useEffect(() => {
    if (!profile?.organizationId) return;

    const q = query(
      collection(firestore, collectionName),
      where('organizationId', '==', profile.organizationId),
      ...constraints,
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (T & { id: string })[];
      setData(items);
      setLoading(false);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, profile?.organizationId, constraintsKey]);

  return { data, loading };
}

export function useCallable<TInput = unknown, TResult = unknown>(functionName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (data: TInput): Promise<TResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const callable = httpsCallable<TInput, TResult>(functions, functionName);
      const result = await callable(data);
      return result.data;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { call, loading, error };
}
